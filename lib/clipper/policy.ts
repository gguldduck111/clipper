/**
 * When a customer may still cancel or move a visit.
 *
 * Cancelling and rescheduling share one rule, so the API routes and the
 * appointment page call the same function: what the page offers and what the
 * server accepts can never drift apart.
 */

/** A visit is locked this long before its arrival time. */
export const CHANGE_CUTOFF_MINUTES = 24 * 60;

/** How far ahead arrival times are offered, and accepted. */
export const BOOKING_HORIZON_DAYS = 14;

const CHANGE_CUTOFF_MS = CHANGE_CUTOFF_MINUTES * 60 * 1000;

/** Statuses a customer can no longer act on. */
const CLOSED_STATUSES = new Set(["cancelled", "completed"]);

export type ChangeBlockReason = "cancelled" | "completed" | "past" | "cutoff";

type ChangeableAppointment = {
  status: string;
  startsAt: string | Date;
};

/** Why this visit cannot be cancelled or moved, or `null` when it can. */
export function appointmentChangeBlockReason(
  appointment: ChangeableAppointment,
  now: Date = new Date(),
): ChangeBlockReason | null {
  if (CLOSED_STATUSES.has(appointment.status)) {
    return appointment.status as "cancelled" | "completed";
  }

  const startsAt =
    appointment.startsAt instanceof Date
      ? appointment.startsAt
      : new Date(appointment.startsAt);

  if (startsAt.getTime() <= now.getTime()) return "past";
  if (startsAt.getTime() - now.getTime() < CHANGE_CUTOFF_MS) return "cutoff";

  return null;
}

/** Whether an arrival time falls inside the window we take bookings for. */
export function isWithinBookingHorizon(
  startsAt: Date,
  now: Date = new Date(),
): boolean {
  const horizon = now.getTime() + BOOKING_HORIZON_DAYS * 24 * 60 * 60 * 1000;

  return startsAt.getTime() > now.getTime() && startsAt.getTime() <= horizon;
}

/** Customer-facing explanation for a blocked visit. */
export const changeBlockMessages: Record<ChangeBlockReason, string> = {
  cancelled: "This visit has been cancelled.",
  completed: "This visit is already finished.",
  past: "This visit has already started.",
  cutoff:
    "Visits are locked 24 hours before arrival. Give us a call and we'll sort it out.",
};
