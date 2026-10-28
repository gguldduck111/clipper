"use client";

import { useMemo, useRef, useState } from "react";

import { Alert, AlertDescription, Button, Input } from "@/components/ui";
import { BOOKING_SECTION_ID } from "@/lib/clipper/constants";
import { formatMoney } from "@/lib/clipper/format";
import type { AvailableSlot, BookingOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookingFlowProps = {
  options: BookingOption;
};

type FieldKey = "petName" | "petBreed" | "package" | "neighborhood" | "address" | "slot";

const fieldMessages: Record<FieldKey, string> = {
  petName: "Pet name is required.",
  petBreed: "Choose a breed.",
  package: "Choose a service.",
  neighborhood: "Choose a neighborhood.",
  address: "Street address is required.",
  slot: "Pick an arrival time.",
};

export function BookingFlow({ options }: BookingFlowProps) {
  const [petName, setPetName] = useState("");
  const [petBreed, setPetBreed] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState(options.packages[0]?.id ?? "");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [accessNotes, setAccessNotes] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [invalidFields, setInvalidFields] = useState<Set<FieldKey>>(new Set());

  const petNameRef = useRef<HTMLInputElement>(null);
  const breedRef = useRef<HTMLSelectElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const neighborhoodRef = useRef<HTMLSelectElement>(null);
  const packageSectionRef = useRef<HTMLFieldSetElement>(null);
  const slotSectionRef = useRef<HTMLFieldSetElement>(null);

  function clearInvalid(key: FieldKey) {
    setInvalidFields((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }

  const selectedPackage = options.packages.find((pkg) => pkg.id === selectedPackageId);
  const totalPrice = selectedPackage?.priceCents ?? 0;
  const durationMinutes = selectedPackage?.durationMinutes ?? 0;

  // A slot is offered only where the groomer covering it serves this neighborhood.
  const { slots, groupedSlots } = useMemo(() => {
    const slots = selectedNeighborhood
      ? options.availableSlots.filter((slot) => slot.neighborhoods.includes(selectedNeighborhood))
      : [];
    const groupedSlots = slots.reduce<Record<string, AvailableSlot[]>>((groups, slot) => {
      (groups[slot.dateKey] ??= []).push(slot);
      return groups;
    }, {});

    return { slots, groupedSlots };
  }, [options.availableSlots, selectedNeighborhood]);
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);

  function changeNeighborhood(neighborhood: string) {
    setSelectedNeighborhood(neighborhood);
    setSelectedSlotId("");
    setFormError("");
    clearInvalid("neighborhood");
  }

  function validateAndSubmit() {
    const missing = new Set<FieldKey>();
    if (!petName.trim()) missing.add("petName");
    if (!petBreed) missing.add("petBreed");
    if (!selectedPackageId) missing.add("package");
    if (!selectedNeighborhood) missing.add("neighborhood");
    if (!address.trim()) missing.add("address");
    if (!selectedSlot) missing.add("slot");

    if (missing.size > 0) {
      setInvalidFields(missing);
      setFormError("Please complete each step before booking your Clipper visit.");

      if (missing.has("petName")) petNameRef.current?.focus();
      else if (missing.has("petBreed")) breedRef.current?.focus();
      else if (missing.has("address")) addressRef.current?.focus();
      else if (missing.has("neighborhood")) neighborhoodRef.current?.focus();
      else if (missing.has("package")) packageSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      else if (missing.has("slot")) slotSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }
    if (!selectedSlot) return;

    setInvalidFields(new Set());
    setSubmitting(true);
    setFormError("");
    fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ petName: petName.trim(), petBreed, packageId: selectedPackageId, neighborhood: selectedNeighborhood, address: address.trim(), startsAt: selectedSlot.startsAt, notes: accessNotes.trim() }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Could not create booking");
        return response.json() as Promise<{ reference?: string }>;
      })
      .then((data) => {
        if (!data.reference) throw new Error("Booking reference missing");
        window.location.assign(`/appointments/${encodeURIComponent(data.reference)}`);
      })
      .catch(() => {
        setSubmitting(false);
        setFormError("We couldn’t save that visit. Please check your details and try again.");
      });
  }

  return (
      <section id={BOOKING_SECTION_ID} className="clipper-booking clipper-booking--prism scroll-mt-5">
        <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-8 sm:pb-24 lg:px-12">
          <div className="mb-8 max-w-3xl pt-2 sm:mb-10">
            <p className="text-sm font-bold text-brand">Book a Clipper visit</p>
            <h2 className="mt-3 break-words text-[clamp(2rem,7vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.045em] text-ink sm:leading-[0.95] sm:tracking-[-0.06em]">
              Everything your pet needs. One calm visit.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ink-muted sm:mt-5 sm:text-base sm:leading-7">Choose the pet, service, location, and time. We’ll match the route with a trusted Seoul groomer.</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-line bg-surface-card shadow-[0_32px_90px_var(--shadow-card-strong)]">
            <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-10 p-5 sm:p-8 lg:p-10">
                {formError && <Alert className="border-danger-border bg-danger-bg text-danger-fg"><AlertDescription>{formError}</AlertDescription></Alert>}

                <fieldset>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">1. Who are we grooming?</legend>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-bold text-ink-muted">
                      Pet name *
                      <Input ref={petNameRef} aria-label="Pet name" aria-invalid={invalidFields.has("petName")} value={petName} onChange={(event) => { setPetName(event.target.value); clearInvalid("petName"); }} placeholder="e.g. Luna" className={cn("mt-2 h-12 rounded-md border-line bg-surface-card px-4 text-base font-normal text-ink focus-visible:ring-brand", invalidFields.has("petName") && "border-danger-border")} />
                      {invalidFields.has("petName") && <span className="mt-1 block text-xs font-normal normal-case text-danger-fg">{fieldMessages.petName}</span>}
                    </label>
                    <label className="text-xs font-bold text-ink-muted">
                      Breed *
                      <select ref={breedRef} aria-label="Breed" aria-invalid={invalidFields.has("petBreed")} value={petBreed} onChange={(event) => { setPetBreed(event.target.value); clearInvalid("petBreed"); }} className={cn("mt-2 h-12 w-full rounded-md border border-line bg-surface-card px-4 text-base font-normal text-ink outline-none focus:border-brand", invalidFields.has("petBreed") && "border-danger-border")}><option value="">Choose a breed</option><option>Golden Retriever</option><option>Labrador Retriever</option><option>French Bulldog</option><option>German Shepherd</option><option>Poodle</option><option>Miniature Poodle</option><option>Pomeranian</option><option>Pekinese</option><option>Chihuahua</option><option>Jindo</option><option>Shiba Inu</option><option>Welsh Corgi</option><option>Yorkshire Terrier</option><option>Mixed Breed</option></select>
                      {invalidFields.has("petBreed") && <span className="mt-1 block text-xs font-normal normal-case text-danger-fg">{fieldMessages.petBreed}</span>}
                    </label>
                  </div>
                </fieldset>

                <fieldset ref={packageSectionRef}>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">2. Choose a service</legend>
                  <div className="divide-y divide-line-soft border-y border-line-soft">{options.packages.map((pkg) => <button type="button" key={pkg.id} onClick={() => { setSelectedPackageId(pkg.id); setFormError(""); clearInvalid("package"); }} className={cn("grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1 py-4 text-left sm:gap-5 sm:py-5", selectedPackageId === pkg.id ? "" : "opacity-70 hover:opacity-100")}><span><span className="flex items-center gap-2 font-bold text-ink"><span className={cn("size-2 rounded-full", selectedPackageId === pkg.id ? "bg-brand" : "bg-line")} />{pkg.name}</span><span className="mt-1 block pl-4 text-xs leading-5 text-ink-subtle">{pkg.description}</span></span><span className="shrink-0 text-right"><span className="block font-bold text-ink">{formatMoney(pkg.priceCents)}</span><span className="text-xs text-ink-subtle">{pkg.durationMinutes} min</span></span></button>)}</div>
                  {invalidFields.has("package") && <p className="mt-2 text-xs font-semibold text-danger-fg">{fieldMessages.package}</p>}
                </fieldset>

                <fieldset>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">3. Where should we arrive?</legend>
                  <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]">
                    <div>
                      <Input ref={addressRef} aria-label="Street address" aria-invalid={invalidFields.has("address")} value={address} onChange={(event) => { setAddress(event.target.value); clearInvalid("address"); }} placeholder="Street address" className={cn("h-12 rounded-md border-line bg-surface-card px-4 focus-visible:ring-brand", invalidFields.has("address") && "border-danger-border")} />
                      {invalidFields.has("address") && <span className="mt-1 block text-xs font-normal text-danger-fg">{fieldMessages.address}</span>}
                    </div>
                    <div>
                      <select ref={neighborhoodRef} aria-label="Neighborhood" aria-invalid={invalidFields.has("neighborhood")} value={selectedNeighborhood} onChange={(event) => changeNeighborhood(event.target.value)} className={cn("h-12 w-full min-w-0 rounded-md border border-line bg-surface-card px-3 text-base outline-none focus:border-brand sm:px-4 sm:text-sm", invalidFields.has("neighborhood") && "border-danger-border")}><option value="">Neighborhood</option>{options.neighborhoods.map((neighborhood) => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}</select>
                      {invalidFields.has("neighborhood") && <span className="mt-1 block text-xs font-normal text-danger-fg">{fieldMessages.neighborhood}</span>}
                    </div>
                  </div>
                  <Input aria-label="Apartment, floor, or gate code" value={accessNotes} onChange={(event) => setAccessNotes(event.target.value)} placeholder="Apartment, floor, or gate code (optional)" className="mt-3 h-11 rounded-md border-line bg-surface-card px-4" />
                </fieldset>

                <fieldset ref={slotSectionRef}>
                  <legend className="mb-1 text-lg font-bold tracking-[-0.025em] text-ink">4. Pick an arrival time</legend>
                  <p className="mb-4 text-xs text-ink-subtle">All times KST · matched against live groomer routes</p>
                  <div className="grid gap-5 sm:grid-cols-2">{Object.entries(groupedSlots).map(([dateKey, dateSlots]) => <div key={dateKey}><p className="mb-2 text-sm font-bold text-ink">{dateSlots[0]?.dateLabel}</p><div className="grid grid-cols-2 gap-2">{dateSlots.map((slot) => <button type="button" key={slot.id} onClick={() => { setSelectedSlotId(slot.id); setFormError(""); clearInvalid("slot"); }} className={cn("min-h-11 rounded-md border px-2 py-3 text-sm font-bold sm:px-3", selectedSlotId === slot.id ? "border-brand bg-brand text-brand-on" : "border-line bg-surface-card text-ink-muted")}>{slot.timeLabel}</button>)}</div></div>)}{!slots.length && <p className="text-sm text-ink-muted">{selectedNeighborhood ? "No routes are open for this address yet." : "Choose a neighborhood to see the arrival times we can cover."}</p>}</div>
                  {invalidFields.has("slot") && <p className="mt-2 text-xs font-semibold text-danger-fg">{fieldMessages.slot}</p>}
                </fieldset>
              </div>

              <aside className="border-t border-line-soft bg-surface-muted p-5 sm:p-7 lg:border-l lg:border-t-0">
                <div className="lg:sticky lg:top-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Visit summary</p>
                  <p className="mt-5 text-2xl font-bold tracking-[-0.04em] text-ink">{petName || "Your pet"}</p>
                  <p className="mt-1 text-sm text-ink-muted">{selectedPackage?.name ?? "Choose a service"}</p>
                  <dl className="mt-7 space-y-4 border-y border-line py-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-subtle">Arrival</dt><dd className="text-right font-semibold text-ink">{selectedSlot ? `${selectedSlot.dateLabel}, ${selectedSlot.timeLabel}` : "Not selected"}</dd></div><div className="flex justify-between"><dt className="text-ink-subtle">Duration</dt><dd className="font-semibold text-ink">{durationMinutes} min</dd></div><div className="flex justify-between"><dt className="text-ink-subtle">Neighborhood</dt><dd className="font-semibold text-ink">{selectedNeighborhood || "Not selected"}</dd></div></dl>
                  <div className="my-6 flex flex-wrap items-end justify-between gap-2"><span className="text-sm font-semibold text-ink-muted">Total</span><span className="text-3xl font-bold tracking-[-0.05em] text-ink">{formatMoney(totalPrice)}</span></div>
                  <Button type="button" onClick={validateAndSubmit} disabled={submitting} className="h-12 w-full rounded-md bg-brand text-sm font-bold !text-brand-on shadow-none hover:bg-brand-hover">{submitting ? "Saving your spot…" : "Confirm visit →"}</Button>
                  <p className="mt-3 text-center text-[0.68rem] leading-5 text-ink-subtle">No charge until your groomer is confirmed.</p>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </section>
  );
}
