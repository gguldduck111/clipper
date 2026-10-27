import type { appointments, groomers, groomingPackages } from "@/db/schema";

export type GroomingPackage = typeof groomingPackages.$inferSelect;

export type AvailableSlot = {
  id: string;
  startsAt: string;
  dateKey: string;
  dateLabel: string;
  timeLabel: string;
  /** Every neighborhood some available groomer can cover at this time. */
  neighborhoods: string[];
};

export type BookingOption = {
  packages: GroomingPackage[];
  neighborhoods: string[];
  availableSlots: AvailableSlot[];
};

export type AppointmentDetails = Omit<
  typeof appointments.$inferSelect,
  "startsAt" | "endsAt" | "createdAt" | "updatedAt"
> & {
  reference: string;
  pet: { name: string; breed: string };
  groomer: typeof groomers.$inferSelect | null;
  package: GroomingPackage;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  updatedAt: string;
};

/** The fields a caller supplies; `createAppointment` fills in the rest. */
export type NewAppointment = Omit<
  typeof appointments.$inferInsert,
  "id" | "bookingReference" | "status" | "createdAt" | "updatedAt"
>;
