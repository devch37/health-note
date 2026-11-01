const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025";

type Summary = { ID: string; Subject: string };

/** Mailpit API로 받은 메일 본문을 기다렸다가 가져온다. */
export async function waitForMail(to: string, subjectIncludes: string, timeoutMs = 10_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const { messages } = (await res.json()) as { messages: Summary[] };
    const found = messages.find((m) => m.Subject.includes(subjectIncludes));
    if (found) {
      const detail = await fetch(`${MAILPIT}/api/v1/message/${found.ID}`);
      return ((await detail.json()) as { Text: string }).Text;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`mail not received: ${subjectIncludes}`);
}
