import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Clipper — At-home grooming in Seoul",
  description: "Book a thoughtful, at-home grooming visit for your favorite pet.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen overflow-x-hidden bg-[#f7f0e6] text-[#202321] antialiased">
        {children}
      </body>
    </html>
  );
}
