export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    const sysPrompt = "You are btuta.ai travel/chat assistant. Answer in Arabic if user writes Arabic; otherwise use English. Be concise and helpful.";

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sysPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      stream: true,
      temperature: 0.3
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok || !resp.body) {
      const txt = await resp.text();
      return new Response(`Upstream error: ${txt}`, { status: 500 });
    }

    const reader = resp.body.getReader();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.replace(/^data:\s*/, "");
            if (data === "[DONE]") {
              controller.close();
              return;
            }
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content || "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore invalid json
            }
          }
          return;
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache"
      }
    });
  } catch (e: any) {
    return new Response(`Error: ${e.message}`, { status: 500 });
  }
}