import {
  createAppointment,
  findAvailableGroomer,
  getPackageById,
} from "@/lib/clipper/data";

type BookingRequest = {
  petName?: unknown;
  petBreed?: unknown;
  packageId?: unknown;
  neighborhood?: unknown;
  address?: unknown;
  startsAt?: unknown;
  notes?: unknown;
};

export async function POST(request: Request) {
  let input: BookingRequest;

  try {
    input = (await request.json()) as BookingRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const requiredFields = [
    "petName",
    "petBreed",
    "packageId",
    "neighborhood",
    "address",
    "startsAt",
  ] as const;
  const missingFields = requiredFields.filter((field) => {
    const value = input[field];
    return typeof value !== "string" || value.trim().length === 0;
  });

  if (missingFields.length > 0) {
    return Response.json(
      {
        ok: false,
        error: `Missing required fields: ${missingFields.join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Trimmed once here, so everything downstream works with stored values.
  const petName = (input.petName as string).trim();
  const petBreed = (input.petBreed as string).trim();
  const packageId = (input.packageId as string).trim();
  const neighborhood = (input.neighborhood as string).trim();
  const address = (input.address as string).trim();
  const startsAt = new Date((input.startsAt as string).trim());
  const notes =
    typeof input.notes === "string" ? input.notes.trim() || null : null;

  if (Number.isNaN(startsAt.getTime())) {
    return Response.json(
      { ok: false, error: "startsAt must be a valid date." },
      { status: 400 },
    );
  }

  if (startsAt <= new Date()) {
    return Response.json(
      { ok: false, error: "startsAt must be in the future." },
      { status: 400 },
    );
  }

  const groomingPackage = await getPackageById(packageId);

  if (!groomingPackage) {
    return Response.json(
      { ok: false, error: "Grooming package was not found." },
      { status: 404 },
    );
  }

  const endsAt = new Date(
    startsAt.getTime() + groomingPackage.durationMinutes * 60 * 1000,
  );
  const groomerId = await findAvailableGroomer(neighborhood, startsAt, endsAt);

  if (!groomerId) {
    return Response.json(
      {
        ok: false,
        error: "No groomer is available for that neighborhood and time.",
      },
      { status: 409 },
    );
  }

  let bookingReference: string;

  try {
    bookingReference = await createAppointment({
      petName,
      petBreed,
      groomerId,
      packageId,
      address,
      neighborhood,
      startsAt,
      endsAt,
      priceCents: groomingPackage.priceCents,
      notes,
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "Failed to save booking",
        error: error instanceof Error ? error.message : String(error),
      }),
    );

    return Response.json(
      { ok: false, error: "We could not save that visit. Please try again." },
      { status: 500 },
    );
  }

  console.info(
    JSON.stringify({
      message: "Clipper booking created",
      bookingReference,
      petName,
    }),
  );

  return Response.json({ ok: true, reference: bookingReference });
}
