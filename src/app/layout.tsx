import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevPath-AI",
  description: "Turn a job description into the shortest credible path to job readiness.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
