import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { BOOKING_HREF } from "@/lib/clipper/constants";

export default function AppointmentNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-warm-surface px-5 py-12 text-warm-ink">
      <section className="w-full max-w-md rounded-[2rem] border border-warm-line bg-warm-card px-6 py-10 text-center shadow-[0_18px_45px_var(--shadow-warm)] sm:px-10">
        <div className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-warm-accent-soft text-warm-accent">
          <SearchX aria-hidden="true" className="size-6" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-warm-accent">That link wandered off</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.05em]">We can&apos;t find that visit.</h1>
        <p className="mt-4 text-sm leading-6 text-warm-ink-muted">Check the booking reference and try again, or start a fresh Clipper booking.</p>
        <Link href={BOOKING_HREF} className="mt-7 inline-flex items-center gap-2 rounded-full bg-warm-button px-5 py-3 text-sm font-bold text-warm-ink-inverse transition-transform hover:-translate-y-0.5">
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to booking
        </Link>
      </section>
    </main>
  );
}
