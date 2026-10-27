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
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-[#0a2540]">
      <div aria-hidden="true" className="absolute -right-[28rem] -top-[35rem] h-[62rem] w-[62rem] rotate-[24deg] bg-[linear-gradient(135deg,#ffdb80,#ff8f70_28%,#d783ff_52%,#7a73ff_74%,#68d5ff)] opacity-55 blur-[3px]" />
      <div className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 lg:px-12">
        <header className="relative flex items-center justify-between py-6 sm:py-8">
          <Link href="/" className="text-2xl font-black tracking-[-0.07em] text-[#0a2540]">clipper</Link>
          <Link href={BOOKING_HREF} className="inline-flex items-center gap-2 rounded-full bg-[#635bff] px-5 py-2.5 text-sm font-bold !text-white transition-colors hover:bg-[#0a2540]">
            Book another visit <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        <div className="relative mx-auto max-w-4xl pt-8 sm:pt-14">
          <Link href="/appointments" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#53627a] transition-colors hover:text-[#635bff]">
            <ArrowLeft aria-hidden="true" className="size-4" /> All appointments
          </Link>
          {query.changed && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#bfe8db] bg-[#e7f8f1] px-5 py-4 text-sm text-[#08775d] sm:px-7">
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
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[#f3c4c0] bg-[#fff0ef] px-5 py-4 text-sm text-[#9f3f38] sm:px-7">
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

        <footer className="relative mx-auto mt-16 flex max-w-4xl flex-col gap-2 border-t border-[#dbe3ef] pt-5 text-xs text-[#8898aa] sm:flex-row sm:items-center sm:justify-between">
          <span>Clipper · Seoul, Korea</span>
          <span>Thoughtful grooming, right at home.</span>
        </footer>
      </div>
    </main>
  );
}
