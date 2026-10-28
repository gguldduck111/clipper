import {
  findAvailableGroomer,
  getAppointmentByReference,
  rescheduleAppointment,
} from "@/lib/clipper/data";
import {
  appointmentChangeBlockReason,
  changeBlockMessages,
  isWithinBookingHorizon,
  BOOKING_HORIZON_DAYS,
} from "@/lib/clipper/policy";

type RescheduleRequest = {
  startsAt?: unknown;
};

type RouteContext = {
  params: Promise<{ reference: string }>;
};

export async function POST(request: Request, { params }: RouteContext) {
  const { reference } = await params;
  let input: RescheduleRequest;

  try {
    input = (await request.json()) as RescheduleRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  if (typeof input.startsAt !== "string" || input.startsAt.trim().length === 0) {
    return Response.json(
      { ok: false, error: "startsAt is required." },
      { status: 400 },
    );
  }

  const startsAt = new Date(input.startsAt.trim());

  if (Number.isNaN(startsAt.getTime())) {
    return Response.json(
      { ok: false, error: "startsAt must be a valid date." },
      { status: 400 },
    );
  }

  if (!isWithinBookingHorizon(startsAt)) {
    return Response.json(
      {
        ok: false,
        error: `startsAt must be in the future and within ${BOOKING_HORIZON_DAYS} days.`,
      },
      { status: 400 },
    );
  }

  const appointment = await getAppointmentByReference(reference);

  if (!appointment) {
    return Response.json(
      { ok: false, error: "That booking reference was not found." },
      { status: 404 },
    );
  }

  // Same check the appointment page uses to decide whether to offer the form,
  // so a stale page cannot slip a change through.
  const blockReason = appointmentChangeBlockReason(appointment);

  if (blockReason) {
    return Response.json(
      { ok: false, error: changeBlockMessages[blockReason], reason: blockReason },
      { status: 409 },
    );
  }

  // The package is fixed, so the visit keeps its length and price.
  const endsAt = new Date(
    startsAt.getTime() + appointment.package.durationMinutes * 60 * 1000,
  );
  // Excluding itself: its current booking must not count as a conflict, which
  // it would whenever the new time overlaps the old one.
  const groomerId = await findAvailableGroomer(
    appointment.neighborhood,
    startsAt,
    endsAt,
    appointment.id,
  );

  if (!groomerId) {
    return Response.json(
      {
        ok: false,
        error: "That time was just taken. Please pick another one.",
      },
      { status: 409 },
    );
  }

  try {
    await rescheduleAppointment({
      appointmentId: appointment.id,
      startsAt,
      endsAt,
      groomerId,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Failed to reschedule booking",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return Response.json(
      { ok: false, error: "We could not move that visit. Please try again." },
      { status: 500 },
    );
  }

  console.info(
    JSON.stringify({
      message: "Clipper booking rescheduled",
      reference: appointment.reference,
      startsAt: startsAt.toISOString(),
    }),
  );

  return Response.json({
    ok: true,
    groomerChanged: groomerId !== appointment.groomerId,
  });
}
