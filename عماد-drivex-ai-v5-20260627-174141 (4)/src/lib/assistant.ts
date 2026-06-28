type ChatTurn = { role: "user" | "assistant"; content: string };

export type UserProfile = {
  name?: string;
  interests?: string;
  goals?: string;
  notes?: string;
};

export async function askAssistant(
  message: string,
  history: ChatTurn[],
  context: {
    driving?: boolean;
    speedKmh?: number;
    coords?: { lat: number; lng: number } | null;
    homeAddress?: string;
  },
  profile?: UserProfile
): Promise<string> {
  try {
    const res = await fetch("/api/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, context, profile }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      return data?.error || "تعذّر الاتصال بالمساعد الذكي. حاول مرة أخرى.";
    }
    return (data.reply as string) || "لم أفهم. هل يمكنك إعادة الصياغة؟";
  } catch {
    return "تعذّر الاتصال بالمساعد الذكي. تحقق من اتصالك بالإنترنت.";
  }
}
