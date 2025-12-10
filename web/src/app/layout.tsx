// src/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Vimarsha",
  description: "Track Fittings Digital Ecosystem",
  icons: {
    icon: "public/favicon.ico",
    shortcut: "public/favicon.ico",
    apple: "public/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground min-h-screen">
        {children}
      </body>
    </html>
  );
}
