import { Check, Heart, Sparkles, X } from "lucide-react";

import { formatSeoulDateShort } from "@/lib/clipper/time";
import type { AppointmentDetails } from "@/lib/types";

type BookingConfirmationProps = {
  appointment: AppointmentDetails;
};

const statusLabels: Record<string, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  pending: "Pending",
};

export function BookingConfirmation({ appointment }: BookingConfirmationProps) {
  const petName = appointment.pet.name;
  const status = statusLabels[appointment.status] ?? "Booked";
  const cancelled = appointment.status === "cancelled";

  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#0a2540] px-5 py-8 text-white shadow-[0_28px_80px_rgba(10,37,64,0.24)] sm:px-8 sm:py-10">
      <div className="relative max-w-xl">
        <div className="mb-6 flex size-12 items-center justify-center rounded-full bg-white shadow-sm">
          {cancelled ? (
            <X aria-hidden="true" className="size-6 text-[#9f3f38]" strokeWidth={3} />
          ) : (
            <Check aria-hidden="true" className="size-6 text-[#635bff]" strokeWidth={3} />
          )}
        </div>
        <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#80e9ff]">
          <Sparkles aria-hidden="true" className="size-3.5" /> {status}
        </p>
        <h1 className="max-w-lg text-4xl font-bold leading-[0.98] tracking-[-0.055em] sm:text-6xl">
          {cancelled ? `${petName}'s visit is cancelled.` : `${petName} is on the books.`}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-[#adbdcc] sm:text-lg">
          {cancelled
            ? "We've let the groomer know, and nothing was charged. Book again whenever you're ready."
            : `We'll see you on ${formatSeoulDateShort(appointment.startsAt, "your chosen day")}. Your groomer will bring the good towels—and a little extra patience.`}
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-[#d6e2ec]">
          <span className="inline-flex items-center gap-2"><Heart aria-hidden="true" className="size-4 fill-current" /> Made for good pets</span>
          <span className="font-mono text-xs tracking-[0.14em] text-[#80e9ff]">{appointment.reference}</span>
        </div>
      </div>
    </section>
  );
}
