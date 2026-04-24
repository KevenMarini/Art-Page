import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ItsOnlyArt",
  description: "Exploring the depths of emotion through charcoal, shading, and creative visual storytelling.",
  icons: {
    icon: "/logo.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
