"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send,
  Trash2,
  Loader2,
  Bot,
  User,
  Phone,
  PhoneOff,
  Mic,
  Waves,
  Brain,
  Volume2,
  Clock,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useDriveX } from "@/lib/store";
import { useDriveXAssistant } from "@/hooks/use-assistant";
import { useVoiceConversation, type VoiceConvState } from "@/hooks/use-voice-conversation";
import { QUICK_COMMANDS } from "@/lib/intents";
import { cn } from "@/lib/utils";

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" });
}

const STATE_META: Record<
  VoiceConvState,
  { label: string; color: string; icon: React.ReactNode }
> = {
  idle: { label: "غير نشط", color: "text-muted-foreground", icon: <Mic className="w-4 h-4" /> },
  listening: { label: "أستمع...", color: "text-[var(--drivex-cyan)]", icon: <Waves className="w-4 h-4" /> },
  processing: { label: "أفكّر...", color: "text-amber-300", icon: <Brain className="w-4 h-4" /> },
  speaking: { label: "أتحدث...", color: "text-emerald-300", icon: <Volume2 className="w-4 h-4" /> },
  waiting: { label: "انتظار 2 ثانية...", color: "text-sky-300", icon: <Clock className="w-4 h-4" /> },
  reconnecting: { label: "إعادة الاتصال...", color: "text-amber-300", icon: <AlertCircle className="w-4 h-4" /> },
  mic_blocked: { label: "الميكروفون محظور", color: "text-red-400", icon: <AlertCircle className="w-4 h-4" /> },
  ended: { label: "انتهت المحادثة", color: "text-muted-foreground", icon: <PhoneOff className="w-4 h-4" /> },
};

export function AIChat() {
  const messages = useDriveX((s) => s.messages);
  const clearMessages = useDriveX((s) => s.clearMessages);
  const driving = useDriveX((s) => s.driving);
  const ttsEnabled = useDriveX((s) => s.ttsEnabled);
  const voiceResponse = useDriveX((s) => s.voiceResponse);
  const setTtsEnabled = useDriveX((s) => s.setTtsEnabled);
  const setVoiceResponse = useDriveX((s) => s.setVoiceResponse);
  const userProfile = useDriveX((s) => s.userProfile);
  const setUserProfile = useDriveX((s) => s.setUserProfile);
  const { sendText } = useDriveXAssistant();
  const { state: vState, interim, error: vError, supported: voiceSupported, start: startVoice, stop: stopVoice } = useVoiceConversation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const voiceActive = vState !== "idle" && vState !== "ended";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, interim]);

  const submit = (text: string) => {
    const t = text.trim();
    if (!t) return;
    sendText(t);
    setInput("");
  };

  const meta = STATE_META[vState];

  return (
    <div className="flex flex-col h-full">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] grid place-items-center">
            <Bot className="w-4 h-4 text-black" />
            {voiceActive && (
              <span className="absolute -inset-1 rounded-full border-2 border-[var(--drivex-cyan)]/60 dx-blink" />
            )}
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              DriveX AI
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--drivex-cyan)]/15 text-[var(--drivex-cyan)] border border-[var(--drivex-cyan)]/30">V5</span>
            </div>
            <div className="text-[10px] text-muted-foreground">رفيقك الذكي — أي موضوع</div>
          </div>
        </div>
        <button
          onClick={clearMessages}
          className="text-muted-foreground hover:text-red-400 transition-colors p-2"
          aria-label="مسح المحادثة"
          title="مسح المحادثة"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* voice conversation status bar */}
      <AnimatePresence>
        {voiceActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/5 bg-gradient-to-r from-[var(--drivex-cyan)]/5 to-transparent"
          >
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={cn("shrink-0 grid place-items-center w-9 h-9 rounded-full bg-white/5", meta.color)}>
                  {meta.icon}
                </span>
                <div className="min-w-0">
                  <div className={cn("text-sm font-semibold", meta.color)}>{meta.label}</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {interim ? `«${interim}»` : vState === "listening" ? "تحدّث الآن، سأنتظر حتى تنهي ثم أرد." : vState === "speaking" ? "أستمع إن أردت مقاطعتي." : "محادثة صوتية مستمرة"}
                  </div>
                </div>
              </div>
              <button
                onClick={stopVoice}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-red-500/90 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
                aria-label="إنهاء المحادثة الصوتية"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                إنهاء
              </button>
            </div>
            {vError && (
              <div className="px-4 pb-2 text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {vError} — سأحاول الاستئناف تلقائيًا.
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* messages */}
      <div ref={scrollRef} className="dx-scroll flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m) => {
          const isUser = m.role === "user";
          const isThinking = m.role === "assistant" && m.content === "…";
          return (
            <div
              key={m.id}
              className={cn("flex gap-2.5 max-w-[88%] dx-fade-up", isUser ? "ml-auto flex-row-reverse" : "")}
            >
              <div
                className={cn(
                  "shrink-0 w-7 h-7 rounded-full grid place-items-center",
                  isUser
                    ? "bg-white/10 text-white"
                    : "bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black"
                )}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-white/10 text-white rounded-tr-sm"
                    : "bg-[var(--drivex-panel-2)] border border-[var(--drivex-cyan)]/15 text-foreground rounded-tl-sm"
                )}
              >
                {isThinking ? (
                  <span className="inline-flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> أفكّر...
                  </span>
                ) : (
                  <span className="whitespace-pre-wrap break-words">{m.content}</span>
                )}
                <div className="mt-1 text-[9px] text-muted-foreground/70 text-left">{fmtTime(m.ts)}</div>
              </div>
            </div>
          );
        })}
        {/* live interim transcript while listening */}
        {voiceActive && interim && (
          <div className="flex gap-2.5 max-w-[88%] ml-auto flex-row-reverse dx-fade-up">
            <div className="shrink-0 w-7 h-7 rounded-full grid place-items-center bg-white/10 text-white">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="rounded-2xl px-3.5 py-2.5 text-sm bg-white/5 text-muted-foreground italic rounded-tr-sm border border-white/10">
              {interim}…
            </div>
          </div>
        )}
      </div>

      {/* quick commands */}
      {driving && !voiceActive && (
        <div className="px-3 pb-2 flex gap-2 overflow-x-auto dx-scroll">
          {QUICK_COMMANDS.map((c) => (
            <button
              key={c.label}
              onClick={() => submit(c.text)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-[var(--drivex-cyan)]/20 text-[var(--drivex-cyan)] hover:bg-[var(--drivex-cyan)]/10 transition-colors"
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* continuous voice conversation CTA */}
      {!voiceActive && voiceSupported && (
        <div className="px-3 pb-2">
          <button
            onClick={startVoice}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-[var(--drivex-cyan)]/15 to-[var(--drivex-blue)]/15 border border-[var(--drivex-cyan)]/40 text-[var(--drivex-cyan)] hover:from-[var(--drivex-cyan)]/25 hover:to-[var(--drivex-blue)]/25 transition-colors font-semibold text-sm"
          >
            <Phone className="w-4 h-4" />
            ابدأ محادثة صوتية مستمرة
            <span className="text-[10px] font-normal text-muted-foreground">— اضغط مرة واحدة فقط</span>
          </button>
        </div>
      )}
      {!voiceSupported && (
        <div className="px-3 pb-2 text-[11px] text-amber-300/80 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          المتصفح لا يدعم المحادثة الصوتية المستمرة. استخدم الإدخال النصي أو ميكروفون مفرد.
        </div>
      )}

      {/* memory / profile quick editor */}
      <details className="px-3 group">
        <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 py-1">
          <Sparkles className="w-3.5 h-3.5 text-[var(--drivex-cyan)]/70" />
          ذاكرة DriveX AI (الاسم، الاهتمامات)
        </summary>
        <div className="py-2 grid grid-cols-2 gap-2">
          <input
            value={userProfile.name}
            onChange={(e) => setUserProfile({ name: e.target.value })}
            placeholder="اسمك"
            className="h-9 rounded-lg bg-[var(--drivex-panel)] border border-white/10 px-3 text-xs outline-none focus:border-[var(--drivex-cyan)]/50"
          />
          <input
            value={userProfile.interests}
            onChange={(e) => setUserProfile({ interests: e.target.value })}
            placeholder="اهتماماتك (مثال: برمجة، تصميم، فيزياء)"
            className="h-9 rounded-lg bg-[var(--drivex-panel)] border border-white/10 px-3 text-xs outline-none focus:border-[var(--drivex-cyan)]/50"
          />
        </div>
      </details>

      {/* TTS toggles */}
      <div className="px-3 pt-1 pb-1 flex items-center gap-3 text-[11px] text-muted-foreground">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={voiceResponse}
            onChange={(e) => setVoiceResponse(e.target.checked)}
            className="accent-[var(--drivex-cyan)]"
          />
          رد صوتي
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={ttsEnabled}
            onChange={(e) => setTtsEnabled(e.target.checked)}
            className="accent-[var(--drivex-cyan)]"
          />
          نطق (TTS)
        </label>
      </div>

      {/* text input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="dx-safe-bottom flex items-center gap-2 px-3 py-3 border-t border-white/5 bg-black/30"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اكتب رسالة أو اسأل عن أي موضوع..."
          className="flex-1 h-11 rounded-full bg-[var(--drivex-panel)] border border-white/10 px-4 text-sm outline-none focus:border-[var(--drivex-cyan)]/50 placeholder:text-muted-foreground/60"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          className="shrink-0 w-11 h-11 rounded-full grid place-items-center bg-gradient-to-br from-[var(--drivex-cyan)] to-[var(--drivex-blue)] text-black disabled:opacity-40 transition-opacity"
          aria-label="إرسال"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
