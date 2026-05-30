import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentOS - Mission Control Dashboard",
  description: "Agent Operating System — Centralized AI agent management with searchable memory vault, model routing, and production surfaces.",
  keywords: ["AgentOS", "AI Agents", "Mission Control", "Dashboard", "Multi-Agent"],
  authors: [{ name: "AgentOS Team" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AgentOS - Mission Control",
    description: "Centralized AI agent management dashboard",
    url: "https://chat.z.ai",
    siteName: "AgentOS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentOS - Mission Control",
    description: "Centralized AI agent management dashboard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
