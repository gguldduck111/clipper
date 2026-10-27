import Link from "next/link";

import { BrandMark } from "@/components/clipper/brand-mark";

export function SiteHeader({ bookingId = "book", howItWorksId = "how-it-works" }: { bookingId?: string; howItWorksId?: string }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5 lg:px-12">
      <Link href="/" aria-label="Clipper home" className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-highlight">
        <BrandMark />
      </Link>
      <nav className="hidden items-center gap-7 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-warm-ink-muted sm:flex">
        <a className="transition-colors hover:text-warm-highlight" href={`#${howItWorksId}`}>How it works</a>
        <a className="transition-colors hover:text-warm-highlight" href={`#${bookingId}`}>Book a visit</a>
      </nav>
      <a href={`#${bookingId}`} className="shrink-0 whitespace-nowrap rounded-full border border-warm-outline px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-warm-outline transition-colors hover:bg-warm-outline hover:text-warm-outline-on focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-warm-highlight sm:px-5 sm:text-[0.68rem]">
        Book now <span aria-hidden="true">↗</span>
      </a>
    </header>
  );
}
