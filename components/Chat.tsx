"use client";
import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function sendMessage(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMsgs = [...messages, { role: "user", content: text } as Msg];
    setMessages(newMsgs);
    setInput("");

    setLoading(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMsgs }),
        signal: abortRef.current.signal
      });

      if (!res.ok || !res.body) {
        throw new Error("Response error");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantText += chunk;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  function stop() {
    abortRef.current?.abort();
    setLoading(false);
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 300 }}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <strong>{m.role === "user" ? "You" : "Assistant"}:</strong>
            <div className="stream">{m.content}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} className="row" style={{ marginTop: 12 }}>
        <input
          className="input"
          placeholder="اكتب سؤالك…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="button" type="submit" disabled={loading}>
          {loading ? "…" : "Send"}
        </button>
        {loading && (
          <button className="button" type="button" onClick={stop}>Stop</button>
        )}
      </form>
    </div>
  );
}