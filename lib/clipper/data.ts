import {
  and,
  desc,
  eq,
  gt,
  inArray,
  lt,
  ne,
} from "drizzle-orm";

import {
  appointments,
  groomerSchedules,
  groomerServiceAreas,
  groomers,
  groomingPackages,
} from "@/db/schema";

import { getDatabase } from "./db";
import { BOOKING_HORIZON_DAYS } from "./policy";
import {
  formatSeoulDateShort,
  formatSeoulTime,
  formatTimeOfDay,
  parseTimeOfDay,
  seoulDateKey,
  seoulTimeOfDay,
  seoulWallClockToUtc,
  seoulWeekday,
} from "./time";
import type {
  AppointmentDetails,
  AvailableSlot,
  BookingOption,
  GroomingPackage,
  NewAppointment,
} from "../types";

/** Arrival times are offered on the hour. */
const SLOT_STEP_MINUTES = 60;
/** The shortest package, so a slot always leaves room for at least one visit. */
const SHORTEST_VISIT_MINUTES = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function getBookingOptions(): Promise<BookingOption> {
  const db = getDatabase();

  const [packageRows, neighborhoodRows, availableSlots] = await Promise.all([
    db.select().from(groomingPackages),
    db
      .select({ neighborhood: groomerServiceAreas.neighborhood })
      .from(groomerServiceAreas),
    getAvailableSlots(),
  ]);

  return {
    packages: packageRows,
    neighborhoods: [
      ...new Set(neighborhoodRows.map((row) => row.neighborhood)),
    ].sort(),
    availableSlots,
  };
}

/**
 * Builds the arrival times to offer for the next `DAYS_AHEAD` days from the
 * groomers' weekly schedules, dropping anything already booked or in the past.
 *
 * These are candidates only: `findAvailableGroomer` re-checks availability when
 * the booking is actually created.
 *
 * `excludeAppointmentId` leaves one appointment's own booking out of the
 * "already booked" set. A visit being rescheduled must not block itself, or a
 * visit longer than one slot could never move to an overlapping time.
 */
async function getAvailableSlots(
  excludeAppointmentId?: string,
): Promise<AvailableSlot[]> {
  const db = getDatabase();
  const now = new Date();
  const horizon = new Date(now.getTime() + (BOOKING_HORIZON_DAYS + 1) * DAY_MS);
  const bookedFilters = [
    gt(appointments.endsAt, now),
    lt(appointments.startsAt, horizon),
    ne(appointments.status, "cancelled"),
  ];

  if (excludeAppointmentId) {
    bookedFilters.push(ne(appointments.id, excludeAppointmentId));
  }

  // Kept as three queries rather than one join: joining schedules against
  // service areas multiplies every shift by the groomer's neighborhood count,
  // and the loop below would then rebuild the same slot once per neighborhood.
  const [shifts, serviceAreas, booked] = await Promise.all([
    db
      .select({
        groomerId: groomers.id,
        weekday: groomerSchedules.weekday,
        startTime: groomerSchedules.startTime,
        endTime: groomerSchedules.endTime,
      })
      .from(groomers)
      .innerJoin(groomerSchedules, eq(groomerSchedules.groomerId, groomers.id))
      .where(
        and(eq(groomers.active, true), eq(groomerSchedules.available, true)),
      ),
    db
      .select({
        groomerId: groomerServiceAreas.groomerId,
        neighborhood: groomerServiceAreas.neighborhood,
      })
      .from(groomerServiceAreas)
      .innerJoin(groomers, eq(groomers.id, groomerServiceAreas.groomerId))
      .where(eq(groomers.active, true)),
    db
      .select({
        groomerId: appointments.groomerId,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(and(...bookedFilters)),
  ]);

  if (shifts.length === 0) return [];

  const areasByGroomer = new Map<string, string[]>();
  for (const area of serviceAreas) {
    const areas = areasByGroomer.get(area.groomerId);
    if (areas) areas.push(area.neighborhood);
    else areasByGroomer.set(area.groomerId, [area.neighborhood]);
  }

  // Grouped up front so the slot loop scans one groomer's bookings, not all.
  const bookedByGroomer = new Map<string, { startsAt: Date; endsAt: Date }[]>();
  for (const appointment of booked) {
    if (!appointment.groomerId) continue;
    const existing = bookedByGroomer.get(appointment.groomerId);
    if (existing) existing.push(appointment);
    else bookedByGroomer.set(appointment.groomerId, [appointment]);
  }

  const slots = new Map<
    string,
    { startsAt: Date; dateKey: string; neighborhoods: Set<string> }
  >();

  for (let dayOffset = 0; dayOffset < BOOKING_HORIZON_DAYS; dayOffset += 1) {
    const day = new Date(now.getTime() + dayOffset * DAY_MS);
    const dateKey = seoulDateKey(day);
    const weekday = seoulWeekday(day);

    for (const shift of shifts) {
      if (shift.weekday !== weekday) continue;

      const neighborhoods = areasByGroomer.get(shift.groomerId);
      if (!neighborhoods) continue;

      const groomerBookings = bookedByGroomer.get(shift.groomerId) ?? [];
      const lastStart = parseTimeOfDay(shift.endTime) - SHORTEST_VISIT_MINUTES;

      for (
        let minutes = parseTimeOfDay(shift.startTime);
        minutes <= lastStart;
        minutes += SLOT_STEP_MINUTES
      ) {
        const timeOfDay = formatTimeOfDay(minutes);
        const startsAt = seoulWallClockToUtc(dateKey, timeOfDay);
        if (startsAt <= now) continue;

        const endsAt = new Date(
          startsAt.getTime() + SHORTEST_VISIT_MINUTES * 60 * 1000,
        );
        const isBooked = groomerBookings.some(
          (appointment) =>
            appointment.startsAt < endsAt && appointment.endsAt > startsAt,
        );
        if (isBooked) continue;

        const key = `${dateKey}T${timeOfDay}`;
        const slot = slots.get(key);

        if (slot) {
          for (const neighborhood of neighborhoods) {
            slot.neighborhoods.add(neighborhood);
          }
        } else {
          slots.set(key, {
            startsAt,
            dateKey,
            neighborhoods: new Set(neighborhoods),
          });
        }
      }
    }
  }

  return [...slots.entries()]
    .sort(([, a], [, b]) => a.startsAt.getTime() - b.startsAt.getTime())
    .map(([id, slot]) => ({
      id,
      startsAt: slot.startsAt.toISOString(),
      dateKey: slot.dateKey,
      dateLabel: formatSeoulDateShort(slot.startsAt),
      timeLabel: formatSeoulTime(slot.startsAt),
      neighborhoods: [...slot.neighborhoods].sort(),
    }));
}

type AppointmentRow = {
  appointment: typeof appointments.$inferSelect;
  groomer: typeof groomers.$inferSelect | null;
  groomingPackage: GroomingPackage;
};

function toAppointmentDetails(row: AppointmentRow): AppointmentDetails {
  return {
    ...row.appointment,
    reference: row.appointment.bookingReference,
    pet: { name: row.appointment.petName, breed: row.appointment.petBreed },
    groomer: row.groomer,
    package: row.groomingPackage,
    startsAt: row.appointment.startsAt.toISOString(),
    endsAt: row.appointment.endsAt.toISOString(),
    createdAt: row.appointment.createdAt.toISOString(),
    updatedAt: row.appointment.updatedAt.toISOString(),
  };
}

export async function getAppointmentByReference(
  reference: string,
): Promise<AppointmentDetails | null> {
  const db = getDatabase();
  const rows = await db
    .select({
      appointment: appointments,
      groomer: groomers,
      groomingPackage: groomingPackages,
    })
    .from(appointments)
    .leftJoin(groomers, eq(appointments.groomerId, groomers.id))
    .innerJoin(
      groomingPackages,
      eq(appointments.packageId, groomingPackages.id),
    )
    .where(eq(appointments.bookingReference, reference))
    .limit(1);

  const row = rows[0];

  return row ? toAppointmentDetails(row) : null;
}

export async function getAppointments(): Promise<AppointmentDetails[]> {
  const db = getDatabase();
  const rows = await db
    .select({
      appointment: appointments,
      groomer: groomers,
      groomingPackage: groomingPackages,
    })
    .from(appointments)
    .leftJoin(groomers, eq(appointments.groomerId, groomers.id))
    .innerJoin(groomingPackages, eq(appointments.packageId, groomingPackages.id))
    .orderBy(desc(appointments.startsAt));

  return rows.map(toAppointmentDetails);
}

export async function getPackageById(
  packageId: string,
): Promise<GroomingPackage | null> {
  const db = getDatabase();
  const [groomingPackage] = await db
    .select()
    .from(groomingPackages)
    .where(eq(groomingPackages.id, packageId))
    .limit(1);

  return groomingPackage ?? null;
}

/** Saves a confirmed appointment and returns its booking reference. */
export async function createAppointment(
  appointment: NewAppointment,
): Promise<string> {
  const db = getDatabase();
  // booking_reference is unique, so keep it wide enough that collisions are
  // not something a customer ever runs into.
  const bookingReference = `CLP-${crypto
    .randomUUID()
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase()}`;
  const now = new Date();

  await db.insert(appointments).values({
    ...appointment,
    id: `apt_${crypto.randomUUID()}`,
    bookingReference,
    status: "confirmed",
    createdAt: now,
    updatedAt: now,
  });

  return bookingReference;
}

/**
 * The arrival times a booked visit may move to: its own neighborhood only, and
 * with its current booking ignored so it does not rule itself out.
 */
export async function getRescheduleSlots(appointment: {
  id: string;
  neighborhood: string;
}): Promise<AvailableSlot[]> {
  const slots = await getAvailableSlots(appointment.id);

  return slots.filter((slot) =>
    slot.neighborhoods.includes(appointment.neighborhood),
  );
}

/** Marks a visit cancelled. The row is kept so the history stays readable. */
export async function cancelAppointment(appointmentId: string): Promise<void> {
  const db = getDatabase();

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, appointmentId));
}

/**
 * Moves a visit to a new time, keeping its booking reference, package and
 * price. The groomer is rewritten because the one originally assigned may not
 * be free at the new time.
 */
export async function rescheduleAppointment(change: {
  appointmentId: string;
  startsAt: Date;
  endsAt: Date;
  groomerId: string;
}): Promise<void> {
  const db = getDatabase();

  await db
    .update(appointments)
    .set({
      startsAt: change.startsAt,
      endsAt: change.endsAt,
      groomerId: change.groomerId,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, change.appointmentId));
}

/**
 * Picks a groomer who covers `neighborhood`, is on shift for the whole visit,
 * and has nothing else booked over it.
 *
 * `excludeAppointmentId` ignores one appointment's own booking, so a visit
 * being rescheduled is not treated as a conflict with itself.
 */
export async function findAvailableGroomer(
  neighborhood: string,
  startsAt: Date,
  endsAt: Date,
  excludeAppointmentId?: string,
): Promise<string | null> {
  const db = getDatabase();
  // Schedules are stored as Seoul wall-clock times, so compare in Seoul time.
  const weekday = seoulWeekday(startsAt);
  const requestedStart = seoulTimeOfDay(startsAt);
  const requestedEnd = seoulTimeOfDay(endsAt);

  const scheduledGroomers = await db
    .select({
      groomerId: groomers.id,
      startTime: groomerSchedules.startTime,
      endTime: groomerSchedules.endTime,
    })
    .from(groomers)
    .innerJoin(
      groomerServiceAreas,
      eq(groomerServiceAreas.groomerId, groomers.id),
    )
    .innerJoin(
      groomerSchedules,
      and(
        eq(groomerSchedules.groomerId, groomers.id),
        eq(groomerSchedules.weekday, weekday),
      ),
    )
    .where(
      and(
        eq(groomers.active, true),
        eq(groomerServiceAreas.neighborhood, neighborhood),
        eq(groomerSchedules.available, true),
      ),
    );

  const candidates = scheduledGroomers.filter(
    (groomer) =>
      groomer.startTime <= requestedStart && groomer.endTime >= requestedEnd,
  );
  if (candidates.length === 0) return null;

  const candidateIds = candidates.map((groomer) => groomer.groomerId);
  const conflictFilters = [
    inArray(appointments.groomerId, candidateIds),
    lt(appointments.startsAt, endsAt),
    gt(appointments.endsAt, startsAt),
    ne(appointments.status, "cancelled"),
  ];

  if (excludeAppointmentId) {
    conflictFilters.push(ne(appointments.id, excludeAppointmentId));
  }

  const conflictingAppointments = await db
    .select({ groomerId: appointments.groomerId })
    .from(appointments)
    .where(and(...conflictFilters));

  const busyGroomerIds = new Set(
    conflictingAppointments
      .map((appointment) => appointment.groomerId)
      .filter((groomerId): groomerId is string => Boolean(groomerId)),
  );

  return (
    candidates.find((groomer) => !busyGroomerIds.has(groomer.groomerId))
      ?.groomerId ?? null
  );
}
