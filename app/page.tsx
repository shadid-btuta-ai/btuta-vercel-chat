import "./globals.css";
import Chat from "../components/Chat";

export default function Page() {
  return (
    <main className="container">
      <h1>btuta.ai — Chat Bot</h1>
      <p className="small">Next.js + OpenAI (Streaming)</p>
      <div className="card">
        <Chat />
      </div>
    </main>
  );
}