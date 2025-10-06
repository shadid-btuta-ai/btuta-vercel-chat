import "./globals.css";

export const metadata = {
  title: "btuta.ai — Chat Bot",
  description: "Next.js + OpenAI (Streaming)"
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="auto">
      <body>{children}</body>
    </html>
  );
}
