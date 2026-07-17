export async function postToGoogleChat(text: string): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.warn("Google Chat 通知失敗", response.status, await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Google Chat 通知失敗", error);
    return false;
  }
}
