import {
  CalendarDays,
  Check,
  Clock3,
  Dog,
  MapPin,
  Scissors,
  StickyNote,
  UserRound,
  X,
} from "lucide-react";

import { formatMoney } from "@/lib/clipper/format";
import { formatSeoulDateLong, formatSeoulTime } from "@/lib/clipper/time";
import type { AppointmentDetails } from "@/lib/types";

type AppointmentCardProps = {
  appointment: AppointmentDetails;
};

const statusLabels: Record<string, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "border-ok-border bg-ok-bg text-ok-fg",
  },
  completed: {
    label: "Completed",
    className: "border-info-border bg-info-bg text-info-fg",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-danger-border bg-danger-bg text-danger-fg",
  },
  pending: {
    label: "Pending",
    className: "border-warn-border bg-warn-bg text-warn-fg",
  },
};

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const status = statusLabels[appointment.status] ?? {
    label: appointment.status,
    className: "border-info-border bg-info-bg text-info-fg",
  };
  const petName = appointment.pet.name;
  const neighborhood = appointment.neighborhood ? `, ${appointment.neighborhood}` : "";

  return (
    <section aria-labelledby="appointment-details-heading" className="overflow-hidden rounded-2xl border border-line bg-surface-card shadow-[0_20px_60px_var(--shadow-card)]">
      <div className="border-b border-line-soft px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-brand">Your Clipper visit</p>
            <h2 id="appointment-details-heading" className="text-3xl font-bold leading-none tracking-[-0.04em] text-ink sm:text-4xl">
              {petName}&apos;s appointment
            </h2>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${status.className}`}>
            {appointment.status === "cancelled" ? (
              <X aria-hidden="true" className="size-3.5" strokeWidth={3} />
            ) : (
              <Check aria-hidden="true" className="size-3.5" strokeWidth={3} />
            )}
            {status.label}
          </span>
        </div>
      </div>

      <div className="grid gap-0 divide-y divide-line-soft sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-7">
          <DetailRow icon={<CalendarDays aria-hidden="true" />} label="When">
            <strong className="block font-semibold text-ink">{formatSeoulDateLong(appointment.startsAt)}</strong>
            <span>{formatSeoulTime(appointment.startsAt)} – {formatSeoulTime(appointment.endsAt)} KST</span>
          </DetailRow>
          <DetailRow icon={<MapPin aria-hidden="true" />} label="Where">
            <strong className="block font-semibold text-ink">At your home</strong>
            <span>{appointment.address}{neighborhood}</span>
          </DetailRow>
          <DetailRow icon={<Clock3 aria-hidden="true" />} label="Visit length">
            <strong className="block font-semibold text-ink">{appointment.package.durationMinutes} minutes</strong>
            <span>Our groomer brings everything</span>
          </DetailRow>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-8 sm:py-7">
          <DetailRow icon={<Dog aria-hidden="true" />} label="Pet">
            <strong className="block font-semibold text-ink">{petName}</strong>
            <span>{appointment.pet.breed}</span>
          </DetailRow>
          <DetailRow icon={<Scissors aria-hidden="true" />} label="Service">
            <strong className="block font-semibold text-ink">{appointment.package.name}</strong>
            <span>{appointment.package.description}</span>
          </DetailRow>
          <DetailRow icon={<UserRound aria-hidden="true" />} label="Your groomer">
            <strong className="block font-semibold text-ink">{appointment.groomer?.name ?? "A Clipper groomer"}</strong>
            <span>{appointment.groomer?.bio ?? "A friendly professional from the Clipper team."}</span>
          </DetailRow>
        </div>
      </div>

      <div className="grid gap-0 border-t border-line-soft bg-surface-muted sm:grid-cols-[1fr_auto]">
        <div className="px-5 py-5 sm:px-8">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-subtle">Notes for your groomer</p>
          <p className="flex items-start gap-2 text-sm leading-6 text-ink-muted">
            <StickyNote aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" />
            <span>{appointment.notes ?? "No special notes added for this visit."}</span>
          </p>
        </div>
        <div className="border-t border-line-soft px-5 py-5 sm:border-l sm:border-t-0 sm:px-8 sm:text-right">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-subtle">Total</p>
          <p className="text-3xl font-bold tracking-[-0.04em] text-ink">{formatMoney(appointment.priceCents)}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-soft px-5 py-4 text-xs text-ink-subtle sm:px-8">
        <span>Booked with Clipper</span>
        <span className="font-mono tracking-[0.12em] text-ink-muted">{appointment.reference}</span>
      </div>
    </section>
  );
}

function DetailRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand [&_svg]:size-4">{icon}</div>
      <div className="min-w-0 text-sm leading-6 text-ink-muted">
        <p className="mb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-subtle">{label}</p>
        {children}
      </div>
    </div>
  );
}
