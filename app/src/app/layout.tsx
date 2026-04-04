import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Architecture Simulator",
  description:
    "Desenhe, simule e analise arquiteturas AWS com métricas de performance, custo e disponibilidade em tempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
