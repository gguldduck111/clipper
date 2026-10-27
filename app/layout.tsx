import type { Metadata, Viewport } from "next";

import { themeInitScript } from "@/lib/clipper/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipper \u2014 At-home grooming in Seoul",
  description: "Book a thoughtful, at-home grooming visit for your favorite pet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-surface text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
