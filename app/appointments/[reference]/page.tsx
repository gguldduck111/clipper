import { ArrowLeft, ArrowUpRight, CalendarCheck, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentActions } from "@/components/clipper/appointment-actions";
import { AppointmentCard } from "@/components/clipper/appointment-card";
import { BookingConfirmation } from "@/components/clipper/booking-confirmation";
import { BOOKING_HREF } from "@/lib/clipper/constants";
import {
  getAppointmentByReference,
  getRescheduleSlots,
} from "@/lib/clipper/data";
import { appointmentChangeBlockReason } from "@/lib/clipper/policy";
import { ThemeToggle } from "@/components/clipper/theme-toggle";

type AppointmentPageProps = {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ changed?: string; cancelled?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AppointmentPage({
  params,
  searchParams,
}: AppointmentPageProps) {
  const [{ reference }, query] = await Promise.all([params, searchParams]);
  const appointment = await getAppointmentByReference(reference);

  if (!appointment) {
    notFound();
  }

  // Decided here, not in the client component: the server's clock settles
  // whether the 24-hour window is still open, so the buttons on the page and
  // the checks in the API cannot disagree.
  const blockReason = appointmentChangeBlockReason(appointment);
  const rescheduleSlots = blockReason ? [] : await getRescheduleSlots(appointment);

  return (
    <main className="relative min-h-screen overflow-hidden bg-surface text-ink">
      <div aria-hidden="true" className="absolute -right-[18rem] -top-[24rem] h-[40rem] w-[40rem] rotate-[24deg] bg-[linear-gradient(135deg,#ffdb80,#ff8f70_28%,#d783ff_52%,#7a73ff_74%,#68d5ff)] opacity-55 blur-[3px] dark:opacity-30 sm:-right-[28rem] sm:-top-[35rem] sm:h-[62rem] sm:w-[62rem]" />
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 lg:px-12">
        <header className="relative flex items-center justify-between gap-3 py-5 sm:py-8">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center text-xl font-black tracking-[-0.07em] text-ink sm:text-2xl">clipper</Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href={BOOKING_HREF} className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-4 py-2 text-xs font-bold !text-brand-on transition-colors hover:bg-brand-hover sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm">
              Book another visit <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        </header>

        <div className="relative mx-auto max-w-4xl pt-6 sm:pt-14">
          <Link href="/appointments" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-brand sm:mb-6">
            <ArrowLeft aria-hidden="true" className="size-4" /> All appointments
          </Link>
          {query.changed && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-ok-border bg-ok-bg px-5 py-4 text-sm text-ok-fg sm:px-7">
              <CalendarCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong className="font-semibold">Your visit has been moved.</strong>{" "}
                {query.changed === "groomer"
                  ? "A different groomer covers the new time — see who is coming below."
                  : "The new arrival time is below."}
              </p>
            </div>
          )}

          {query.cancelled && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-danger-border bg-danger-bg px-5 py-4 text-sm text-danger-fg sm:px-7">
              <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                <strong className="font-semibold">This visit is cancelled.</strong>{" "}
                Nothing was charged. Book again whenever you&apos;re ready.
              </p>
            </div>
          )}

          <BookingConfirmation appointment={appointment} />

          <div className="mt-7">
            <AppointmentCard appointment={appointment} />
          </div>

          <AppointmentActions
            appointment={appointment}
            slots={rescheduleSlots}
            blockReason={blockReason}
          />
        </div>

        <footer className="relative mx-auto mt-16 flex max-w-4xl flex-col gap-2 border-t border-line pt-5 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between">
          <span>Clipper · Seoul, Korea</span>
          <span>Thoughtful grooming, right at home.</span>
        </footer>
      </div>
    </main>
  );
}
