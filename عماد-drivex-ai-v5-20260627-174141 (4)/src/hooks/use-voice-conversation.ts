"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDriveX } from "@/lib/store";
import { askAssistant } from "@/lib/assistant";
import { detectIntent, intentReply } from "@/lib/intents";
import { isArabicText } from "@/hooks/use-speech";

/**
 * useVoiceConversation — DriveX AI V5 continuous voice conversation engine.
 *
 * Flow (runs forever until stop()):
 *   LISTENING → (2s silence via VAD) → PROCESSING → SPEAKING → (2s wait) → LISTENING → ...
 *
 * Features:
 *  - Voice Activity Detection using Web Speech API (continuous + interim).
 *  - 2 consecutive seconds of silence finalize the user turn.
 *  - Barge-in: an AudioContext RMS meter on the mic cancels TTS when the user
 *    speaks while the assistant is talking.
 *  - Self-recovery: every phase is wrapped in try/catch; recognition auto-
 *    restarts on browser-imposed `onend`; failures never freeze the loop.
 *  - Resource cleanup: all timers, streams, audio contexts and recognizers are
 *    torn down on stop() / unmount.
 */

export type VoiceConvState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "waiting"
  | "reconnecting"
  | "mic_blocked"
  | "ended";

// Minimal Web Speech API typing.
type SR = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

function getRecCtor(): (new () => SR) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const SILENCE_MS = 2000; // 2 seconds of silence → finalize user turn
const POST_SPEAK_WAIT_MS = 2000; // 2 seconds after speaking → listen again
const VAD_TICK_MS = 250;
const BARGE_TICK_MS = 60;
const BARGE_THRESHOLD = 0.14; // RMS threshold for barge-in
const BARGE_FRAMES = 4; // sustained frames (~240ms) to confirm barge-in
const MAX_RESTART_RETRIES = 6;

export function useVoiceConversation() {
  const [state, setState] = useState<VoiceConvState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => typeof window !== "undefined" && !!getRecCtor());

  // ---- Resource refs ----
  const recRef = useRef<SR | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bargeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);

  // ---- Control refs (avoid stale closures inside callbacks) ----
  const runningRef = useRef(false);
  const phaseRef = useRef<VoiceConvState>("idle");
  const lastSpeechTsRef = useRef(0);
  const finalTextRef = useRef("");
  const processingRef = useRef(false); // guard against double finalize
  const retryCountRef = useRef(0);
  const lastUserTsRef = useRef(0);

  // ---- Store accessors ----
  const addMessage = useDriveX((s) => s.addMessage);
  const setListening = useDriveX((s) => s.setListening);
  const setLastTranscript = useDriveX((s) => s.setLastTranscript);
  const driving = useDriveX((s) => s.driving);
  const speedKmh = useDriveX((s) => s.speedKmh);
  const coords = useDriveX((s) => s.coords);
  const homeAddress = useDriveX((s) => s.homeAddress);
  const userProfile = useDriveX((s) => s.userProfile);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const setView = useDriveX((s) => s.setView);
  const setMediaPlaying = useDriveX((s) => s.setMediaPlaying);
  const stopDriving = useDriveX((s) => s.stopDriving);
  const setVoiceConvActive = useDriveX((s) => s.setVoiceConvActive);

  // Keep latest messages in a ref for history.
  const messages = useDriveX((s) => s.messages);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const drivingRef = useRef(driving);
  drivingRef.current = driving;

  const setPhase = useCallback((p: VoiceConvState) => {
    phaseRef.current = p;
    setState(p);
  }, []);

  // ---------- Timer cleanup helpers ----------
  const clearVad = () => {
    if (vadTimerRef.current) {
      clearInterval(vadTimerRef.current);
      vadTimerRef.current = null;
    }
  };
  const clearWait = () => {
    if (waitTimerRef.current) {
      clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  };
  const clearRestart = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  };
  const clearBarge = () => {
    if (bargeTimerRef.current) {
      clearInterval(bargeTimerRef.current);
      bargeTimerRef.current = null;
    }
  };

  // ---------- TTS ----------
  const cancelTTS = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {
      /* noop */
    }
    utterRef.current = null;
  }, []);

  const speakText = useCallback(
    (text: string, onDone: () => void): (() => void) => {
      if (!text) {
        onDone();
        return () => {};
      }
      // If TTS disabled, skip immediately but respect the flow.
      if (!voiceResponse || !ttsEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        onDone();
        return () => {};
      }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const lang = isArabicText(text) ? "ar-SA" : "en-US";
        u.lang = lang;
        u.rate = lang.startsWith("ar") ? 0.95 : 1;
        u.pitch = 1;
        // pick a matching voice
        const voices = window.speechSynthesis.getVoices();
        const prefix = lang.slice(0, 2).toLowerCase();
        const match =
          voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ||
          voices.find((v) => v.lang?.toLowerCase().startsWith(prefix));
        if (match) u.voice = match;

        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          onDone();
        };
        u.onend = finish;
        u.onerror = finish;
        utterRef.current = u;
        window.speechSynthesis.speak(u);
        // Safety: some browsers fail to fire onend; force-finish after a generous
        // timeout based on text length (~150 words/min ≈ 2.5 chars/sec heuristic).
        const estMs = Math.max(3000, (text.length / 12) * 1000);
        const safety = setTimeout(finish, estMs + 2000);
        return () => {
          clearTimeout(safety);
          finish();
        };
      } catch {
        onDone();
        return () => {};
      }
    },
    [voiceResponse, ttsEnabled]
  );

  // ---------- Barge-in meter (active during speaking) ----------
  const startBargeMeter = useCallback(async () => {
    try {
      if (!audioCtxRef.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctor) return;
        audioCtxRef.current = new Ctor();
      }
      if (audioCtxRef.current.state === "suspended") {
        await audioCtxRef.current.resume();
      }
      if (!micStreamRef.current) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }
      const ctx = audioCtxRef.current;
      const src = ctx.createMediaStreamSource(micStreamRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let loudFrames = 0;
      clearBarge();
      bargeTimerRef.current = setInterval(() => {
        if (!runningRef.current || phaseRef.current !== "speaking") return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        if (rms > BARGE_THRESHOLD) {
          loudFrames++;
          if (loudFrames >= BARGE_FRAMES) {
            // BARGE-IN: cancel TTS, switch to listening.
            loudFrames = 0;
            cancelTTS();
            clearBarge();
            setPhase("listening");
            startListening();
          }
        } else {
          loudFrames = Math.max(0, loudFrames - 1);
        }
      }, BARGE_TICK_MS);
    } catch {
      // Mic may be blocked during speaking; barge-in simply unavailable.
    }
     
  }, [cancelTTS, setPhase]);

  // ---------- Listening ----------
  const startListening = useCallback(() => {
    if (!runningRef.current) return;
    const Ctor = getRecCtor();
    if (!Ctor) {
      setPhase("mic_blocked");
      setError("المتصفح لا يدعم التعرف على الصوت.");
      return;
    }

    // Tear down any previous recognizer.
    try {
      recRef.current?.abort();
    } catch {
      /* noop */
    }

    setInterim("");
    finalTextRef.current = "";
    lastSpeechTsRef.current = 0;
    processingRef.current = false;

    const rec = new Ctor();
    rec.lang = "ar-SA";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      if (!runningRef.current) return;
      retryCountRef.current = 0;
      setPhase("listening");
      setListening(true);
    };

    rec.onresult = (event: any) => {
      if (!runningRef.current) return;
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      lastSpeechTsRef.current = Date.now();
      if (finalText) {
        finalTextRef.current = (finalTextRef.current + " " + finalText).trim();
      }
      setInterim(interimText);
    };

    rec.onerror = (e: any) => {
      const err = e?.error;
      if (err === "no-speech") {
        // benign — VAD / restart handles it
      } else if (err === "not-allowed" || err === "service-not-allowed") {
        setPhase("mic_blocked");
        setError("تم رفض إذن الميكروفون.");
        runningRef.current = false;
        setVoiceConvActive(false);
        return;
      } else if (err === "aborted") {
        // intentional — ignore
      } else if (err === "network") {
        setPhase("reconnecting");
        setError("انقطاع الشبكة في التعرف الصوتي.");
      } else {
        // generic — keep trying
      }
    };

    rec.onend = () => {
      setListening(false);
      if (!runningRef.current) return;
      // If we already finalized (processing), do nothing.
      if (processingRef.current) return;
      // If we have final text, the VAD timer will finalize. But if the browser
      // stopped early with text, give VAD a chance; otherwise auto-restart.
      if (finalTextRef.current && phaseRef.current === "listening") {
        // Force finalize path via VAD check.
        return;
      }
      // No text yet — restart recognition after a short delay (auto-recovery).
      if (retryCountRef.current < MAX_RESTART_RETRIES && phaseRef.current === "listening") {
        retryCountRef.current++;
        clearRestart();
        restartTimerRef.current = setTimeout(() => {
          if (runningRef.current && phaseRef.current === "listening") {
            startListening();
          }
        }, 300);
      }
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch {
      // start() throws if already started — attempt a single retry.
      clearRestart();
      restartTimerRef.current = setTimeout(() => {
        if (runningRef.current && phaseRef.current === "listening") {
          startListening();
        }
      }, 300);
    }

    // VAD: check for 2s of silence after speech.
    clearVad();
    vadTimerRef.current = setInterval(() => {
      if (!runningRef.current || phaseRef.current !== "listening") return;
      if (!finalTextRef.current) return; // nothing said yet
      const since = Date.now() - lastSpeechTsRef.current;
      if (since >= SILENCE_MS && !processingRef.current) {
        processingRef.current = true;
        clearVad();
        finalizeAndProcess();
      }
    }, VAD_TICK_MS);
     
  }, [setPhase, setListening, setVoiceConvActive]);

  // ---------- Finalize + process the user turn ----------
  const finalizeAndProcess = useCallback(async () => {
    if (!runningRef.current) return;
    const text = finalTextRef.current.trim();
    finalTextRef.current = "";
    setInterim("");
    // Stop recognition cleanly.
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
    setListening(false);

    if (!text) {
      // Nothing to send — go back to listening.
      processingRef.current = false;
      if (runningRef.current) {
        setPhase("listening");
        startListening();
      }
      return;
    }

    setPhase("processing");
    setLastTranscript(text);
    addMessage({ id: uid(), role: "user", content: text, ts: Date.now() });
    lastUserTsRef.current = Date.now();

    // Local action intents (fast, offline) — execute the UI action, then still
    // route to the AI for a natural companion reply (V5 universal).
    const { intent } = detectIntent(text);
    if (intent !== "unknown") {
      switch (intent) {
        case "navigate_home":
        case "navigate_to":
        case "open_maps":
          setView("map");
          break;
        case "play_music":
          setMediaPlaying(true);
          setView("media");
          break;
        case "stop_music":
          setMediaPlaying(false);
          break;
        case "exit_drive":
          stopDriving();
          break;
      }
    }

    // Thinking placeholder.
    const thinkingId = uid();
    addMessage({ id: thinkingId, role: "assistant", content: "…", ts: Date.now() });

    let reply = "";
    try {
      reply = await askAssistant(
        text,
        messagesRef.current.slice(-12),
        {
          driving: drivingRef.current,
          speedKmh,
          coords,
          homeAddress,
        },
        userProfile
      );
    } catch {
      reply = "حدث خطأ بسيط. سأحاول مجددًا.";
    }

    if (!runningRef.current) {
      // stopped while processing — clean up and exit.
      useDriveX.setState((s) => ({
        messages: [
          ...s.messages.filter((m) => m.id !== thinkingId),
          { id: uid(), role: "assistant" as const, content: reply, ts: Date.now() },
        ],
      }));
      return;
    }

    // Replace the thinking bubble with the real reply.
    useDriveX.setState((s) => ({
      messages: [
        ...s.messages.filter((m) => m.id !== thinkingId),
        { id: uid(), role: "assistant" as const, content: reply, ts: Date.now() },
      ],
    }));

    // ---------- Speak ----------
    setPhase("speaking");
    // Start barge-in meter (async, non-blocking).
    void startBargeMeter();
    speakText(reply, () => {
      clearBarge();
      if (!runningRef.current) return;
      // Wait 2 seconds, then listen again.
      setPhase("waiting");
      clearWait();
      waitTimerRef.current = setTimeout(() => {
        if (!runningRef.current) return;
        processingRef.current = false;
        setPhase("listening");
        startListening();
      }, POST_SPEAK_WAIT_MS);
    });
     
  }, [
    addMessage,
    coords,
    homeAddress,
    setLastTranscript,
    setListening,
    setMediaPlaying,
    setPhase,
    setView,
    speakText,
    speedKmh,
    startBargeMeter,
    startListening,
    stopDriving,
    userProfile,
  ]);

  // ---------- Public: start ----------
  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!supported) {
      setPhase("mic_blocked");
      setError("المتصفح لا يدعم التعرف على الصوت.");
      return;
    }
    setError(null);
    runningRef.current = true;
    setVoiceConvActive(true);
    retryCountRef.current = 0;
    processingRef.current = false;
    cancelTTS();
    // Warm up the mic stream early (also used for barge-in later).
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        micStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
      }
    } catch {
      // will be retried; recognition may still work
    }
    setPhase("listening");
    startListening();
     
  }, [cancelTTS, setPhase, setVoiceConvActive, startListening, supported]);

  // ---------- Public: stop ----------
  const stop = useCallback(() => {
    runningRef.current = false;
    setVoiceConvActive(false);
    processingRef.current = false;
    clearVad();
    clearWait();
    clearRestart();
    clearBarge();
    try {
      recRef.current?.abort();
    } catch {
      /* noop */
    }
    recRef.current = null;
    cancelTTS();
    setListening(false);
    setInterim("");
    // Release mic stream + audio context.
    try {
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* noop */
    }
    micStreamRef.current = null;
    try {
      audioCtxRef.current?.close();
    } catch {
      /* noop */
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setPhase("ended");
    // Reset to idle shortly after so the UI can reset cleanly.
    setTimeout(() => {
      if (!runningRef.current) setPhase("idle");
    }, 600);
  }, [cancelTTS, setListening, setPhase, setVoiceConvActive]);

  // ---------- Cleanup on unmount ----------
  useEffect(() => {
    return () => {
      runningRef.current = false;
      clearVad();
      clearWait();
      clearRestart();
      clearBarge();
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
      try {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        /* noop */
      }
      try {
        micStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {
        /* noop */
      }
      try {
        audioCtxRef.current?.close();
      } catch {
        /* noop */
      }
    };
  }, []);

  // ---------- Pause on tab hidden (graceful, preserves state) ----------
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVis = () => {
      if (document.hidden && runningRef.current && phaseRef.current === "listening") {
        // Pause recognition while hidden to save resources; resume on visible.
        try {
          recRef.current?.stop();
        } catch {
          /* noop */
        }
      } else if (!document.hidden && runningRef.current && phaseRef.current === "listening") {
        clearRestart();
        restartTimerRef.current = setTimeout(() => {
          if (runningRef.current && phaseRef.current === "listening") {
            startListening();
          }
        }, 400);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [startListening]);

  return {
    state,
    interim,
    error,
    supported,
    start,
    stop,
  };
}
