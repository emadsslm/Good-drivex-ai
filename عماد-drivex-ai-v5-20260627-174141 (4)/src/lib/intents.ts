import type { VoiceIntent } from "@/lib/store";

/**
 * Client-side voice intent detection for known commands.
 * Fast, offline, no network needed. Falls back to "unknown" for free-form
 * questions which are then sent to the AI.
 *
 * Supports Arabic + English keywords.
 */
export function detectIntent(raw: string): { intent: VoiceIntent; arg?: string; clean: string } {
  const text = raw.trim();
  const t = text.toLowerCase();
  const clean = text;

  // Navigate home
  if (/\b(home|house)\b/.test(t) && /(take|go|drive|navigate|directions?|خذني|روح|اذهب|Directions|طريق|البيت|المنزل)/.test(t)) {
    return { intent: "navigate_home", clean };
  }
  if (/خذني(\s*ل)?\s*ال(بيت|منزل)|روح(\s*على)?\s*ال(بيت|منزل)|اذهب\s*(ل|الى|إلى)\s*ال(بيت|منزل)/.test(text)) {
    return { intent: "navigate_home", clean };
  }

  // Navigate to <place>
  const toMatchEN = t.match(/^(?:take me to|navigate to|go to|directions to)\s+(.+)/);
  if (toMatchEN) return { intent: "navigate_to", arg: toMatchEN[1], clean };
  const toMatchAR = text.match(/^(?:خذني|اذهب|روح)\s*(?:إلى|الى|ل|على)\s+(.+)/);
  if (toMatchAR) return { intent: "navigate_to", arg: toMatchAR[1], clean };

  // Open maps
  if (/\b(open|show|launch)\b.*\b(map|maps)\b/.test(t) || /(افتح|اعرض|وريني).*(خرائط|خريطة|الخريطة|الخرائط)/.test(text)) {
    return { intent: "open_maps", clean };
  }
  if (/^خرائط$|^الخريطة$|^maps?$/.test(t)) return { intent: "open_maps", clean };

  // Play music
  if (/\b(play|start)\b.*\b(music|song|radio|track|playlist)\b/.test(t) || /(شغل|ابدأ|تشغيل).*(موسيقى|أغنية|اغنية|راديو|مقاطع|قائمة)/.test(text)) {
    return { intent: "play_music", clean };
  }
  if (/شغل\s*الموسيقى|^music$|^radio$/.test(t)) return { intent: "play_music", clean };

  // Stop music
  if (/\b(stop|pause|turn off)\b.*\b(music|song|radio|track|playlist)\b/.test(t) || /(وقف|أوقف|ايقاف|اطفئ|إيقاف).*(موسيقى|أغنية|اغنية|راديو|مقاطع|قائمة|الصوت)/.test(text)) {
    return { intent: "stop_music", clean };
  }

  // Distance / how far
  if (/(how far|distance|كم\s*المسافة|كم\s*باقي|المسافة|مسافة|كم\s*تبعد)/.test(t)) {
    return { intent: "distance", clean };
  }

  // Speed
  if (/(what.*speed|current speed|how fast|سرعتي|سرعت|السرعة|كم\s*السرعة|كام\s*السرعة)/.test(t)) {
    return { intent: "speed", clean };
  }

  // Time
  if (/\b(what time|current time|time now)\b/.test(t) || /(كم\s*الساعة|الوقت|الساعة\s*كم|شقد\s*الساعة)/.test(text)) {
    return { intent: "time", clean };
  }

  // Weather
  if (/\bweather\b|طقس|الجو|حالة الطقس/.test(t)) {
    return { intent: "weather", clean };
  }

  // Call
  if (/\b(call|dial|phone)\b/.test(t) || /(اتصل|اتصلي|اتصال|اتصلي).*(بـ|ب|على)?/.test(text) || /^اتصل$/.test(t)) {
    return { intent: "call", clean };
  }

  // Help
  if (/^help$|مساعدة|ساعدني|ماذا\s*تستطيع|ماذا\s*يمكنك/.test(t)) {
    return { intent: "help", clean };
  }

  // Exit driving
  if (/\b(exit|stop driving|end drive|quit)\b/.test(t) || /(انهي|أنهي|وقف|ايقاف|خروج|اطلع).*(القيادة|قيادة)/.test(text)) {
    return { intent: "exit_drive", clean };
  }

  return { intent: "unknown", clean };
}

export const QUICK_COMMANDS: { label: string; text: string; icon: string }[] = [
  { label: "خذني للمنزل", text: "خذني إلى المنزل", icon: "home" },
  { label: "افتح الخرائط", text: "افتح الخرائط", icon: "map" },
  { label: "شغل موسيقى", text: "شغل الموسيقى", icon: "music" },
  { label: "كم المسافة؟", text: "كم المسافة المتبقية؟", icon: "route" },
  { label: "كم السرعة؟", text: "كم سرعتي الآن؟", icon: "gauge" },
  { label: "كم الساعة؟", text: "كم الساعة الآن؟", icon: "clock" },
];

export function intentReply(intent: VoiceIntent, opts: {
  speedKmh: number;
  homeAddress: string;
  coords: { lat: number; lng: number } | null;
}): string {
  switch (intent) {
    case "navigate_home":
      if (!opts.homeAddress)
        return "لم أجد عنوان منزلك بعد. اضغط الإعدادات وأضف عنوان منزلك أولًا، وسأفتح لك الطريق.";
      return `حسنًا، سأفتح الخريطة وأحدد الطريق إلى منزلك: ${opts.homeAddress}.`;
    case "navigate_to":
      return "حسنًا، سأفتح الخريطة وأحدد الوجهة. قيادة آمنة!";
    case "open_maps":
      return "فتحت الخريطة. يمكنك رؤية موقعك الحالي عليها.";
    case "play_music":
      return "تشغيل الموسيقى. استمتع بالرحلة!";
    case "stop_music":
      return "تم إيقاف الموسيقى.";
    case "distance":
      return opts.coords
        ? `موقعك الحالي مسجّل على الخريطة. افتح الخريطة لرؤية المسافة المتبقية إلى وجهتك.`
        : "أحتاج إذن الموقع لحساب المسافة بدقة. افتح الخريطة بعد تفعيل الموقع.";
    case "speed":
      return opts.speedKmh > 0
        ? `سرعتك الحالية ${opts.speedKmh} كيلومتر في الساعة.`
        : "لا توجد حركة حاليًا، السرعة صفر.";
    case "time":
      return `الساعة الآن ${new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}.`;
    case "weather":
      return "لا أستطيع جلب الطقس مباشرة، لكن افتح الخريطة لرؤية موقعك وتأكد من حالة الطريق.";
    case "call":
      return "للأسف لا يمكنني إجراء المكالمات من داخل التطبيق. استخدم شاشة الهاتف مباشرة وبأمان.";
    case "help":
      return "يمكنني: أخذك للمنزل، فتح الخرائط، تشغيل الموسيقى، إخبارك بالسرعة والوقت والمسافة، والرد على أسئلتك. فقط تحدث بوضوح.";
    case "exit_drive":
      return "إنهاء وضع القيادة. في أمان الله.";
    default:
      return "";
  }
}
