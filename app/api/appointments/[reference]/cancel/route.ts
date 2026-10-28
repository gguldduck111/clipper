import { cancelAppointment, getAppointmentByReference } from "@/lib/clipper/data";
import {
  appointmentChangeBlockReason,
  changeBlockMessages,
} from "@/lib/clipper/policy";

type RouteContext = {
  params: Promise<{ reference: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const { reference } = await params;
  const appointment = await getAppointmentByReference(reference);

  if (!appointment) {
    return Response.json(
      { ok: false, error: "That booking reference was not found." },
      { status: 404 },
    );
  }

  // Same check the appointment page uses to decide whether to offer the
  // button, so a stale page cannot slip a cancellation through.
  const blockReason = appointmentChangeBlockReason(appointment);

  if (blockReason) {
    return Response.json(
      { ok: false, error: changeBlockMessages[blockReason], reason: blockReason },
      { status: 409 },
    );
  }

  try {
    await cancelAppointment(appointment.id);
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Failed to cancel booking",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return Response.json(
      { ok: false, error: "We could not cancel that visit. Please try again." },
      { status: 500 },
    );
  }

  console.info(
    JSON.stringify({
      message: "Clipper booking cancelled",
      reference: appointment.reference,
    }),
  );

  return Response.json({ ok: true });
}
