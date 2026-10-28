"use client";

import { useMemo, useState } from "react";

import { Alert, AlertDescription, Button, Input } from "@/components/ui";
import { BOOKING_SECTION_ID } from "@/lib/clipper/constants";
import { formatMoney } from "@/lib/clipper/format";
import type { AvailableSlot, BookingOption } from "@/lib/types";
import { cn } from "@/lib/utils";

type BookingFlowProps = {
  options: BookingOption;
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
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    validateAndSubmit();
  }

  function validateAndSubmit() {
    if (!petName.trim() || !petBreed || !selectedPackageId || !selectedNeighborhood || !address.trim() || !selectedSlot) {
      setFormError("Please complete each step before booking your Clipper visit.");
      return;
    }
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
            <form onSubmit={handleSubmit} className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="space-y-10 p-5 sm:p-8 lg:p-10">
                {formError && <Alert className="border-danger-border bg-danger-bg text-danger-fg"><AlertDescription>{formError}</AlertDescription></Alert>}

                <fieldset>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">1. Who are we grooming?</legend>
                  <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-bold text-ink-muted">Pet name<Input aria-label="Pet name" value={petName} onChange={(event) => setPetName(event.target.value)} placeholder="e.g. Luna" className="mt-2 h-12 rounded-md border-line bg-surface-card px-4 text-base font-normal text-ink focus-visible:ring-brand" /></label><label className="text-xs font-bold text-ink-muted">Breed<select aria-label="Breed" value={petBreed} onChange={(event) => setPetBreed(event.target.value)} className="mt-2 h-12 w-full rounded-md border border-line bg-surface-card px-4 text-base font-normal text-ink outline-none focus:border-brand"><option value="">Choose a breed</option><option>Golden Retriever</option><option>Labrador Retriever</option><option>French Bulldog</option><option>German Shepherd</option><option>Poodle</option><option>Miniature Poodle</option><option>Pomeranian</option><option>Pekinese</option><option>Chihuahua</option><option>Jindo</option><option>Shiba Inu</option><option>Welsh Corgi</option><option>Yorkshire Terrier</option><option>Mixed Breed</option></select></label></div>
                </fieldset>

                <fieldset>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">2. Choose a service</legend>
                  <div className="divide-y divide-line-soft border-y border-line-soft">{options.packages.map((pkg) => <button type="button" key={pkg.id} onClick={() => { setSelectedPackageId(pkg.id); setFormError(""); }} className={cn("grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-1 py-4 text-left sm:gap-5 sm:py-5", selectedPackageId === pkg.id ? "" : "opacity-70 hover:opacity-100")}><span><span className="flex items-center gap-2 font-bold text-ink"><span className={cn("size-2 rounded-full", selectedPackageId === pkg.id ? "bg-brand" : "bg-line")} />{pkg.name}</span><span className="mt-1 block pl-4 text-xs leading-5 text-ink-subtle">{pkg.description}</span></span><span className="shrink-0 text-right"><span className="block font-bold text-ink">{formatMoney(pkg.priceCents)}</span><span className="text-xs text-ink-subtle">{pkg.durationMinutes} min</span></span></button>)}</div>
                </fieldset>

                <fieldset>
                  <legend className="mb-4 text-lg font-bold tracking-[-0.025em] text-ink">3. Where should we arrive?</legend>
                  <div className="grid gap-3 sm:grid-cols-[1.25fr_0.75fr]"><Input aria-label="Street address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street address" className="h-12 rounded-md border-line bg-surface-card px-4 focus-visible:ring-brand" /><select aria-label="Neighborhood" value={selectedNeighborhood} onChange={(event) => changeNeighborhood(event.target.value)} className="h-12 w-full min-w-0 rounded-md border border-line bg-surface-card px-3 text-base outline-none focus:border-brand sm:px-4 sm:text-sm"><option value="">Neighborhood</option>{options.neighborhoods.map((neighborhood) => <option key={neighborhood} value={neighborhood}>{neighborhood}</option>)}</select></div>
                  <Input aria-label="Apartment, floor, or gate code" value={accessNotes} onChange={(event) => setAccessNotes(event.target.value)} placeholder="Apartment, floor, or gate code (optional)" className="mt-3 h-11 rounded-md border-line bg-surface-card px-4" />
                </fieldset>

                <fieldset>
                  <legend className="mb-1 text-lg font-bold tracking-[-0.025em] text-ink">4. Pick an arrival time</legend>
                  <p className="mb-4 text-xs text-ink-subtle">All times KST · matched against live groomer routes</p>
                  <div className="grid gap-5 sm:grid-cols-2">{Object.entries(groupedSlots).map(([dateKey, dateSlots]) => <div key={dateKey}><p className="mb-2 text-sm font-bold text-ink">{dateSlots[0]?.dateLabel}</p><div className="grid grid-cols-2 gap-2">{dateSlots.map((slot) => <button type="button" key={slot.id} onClick={() => { setSelectedSlotId(slot.id); setFormError(""); }} className={cn("min-h-11 rounded-md border px-2 py-3 text-sm font-bold sm:px-3", selectedSlotId === slot.id ? "border-brand bg-brand text-brand-on" : "border-line bg-surface-card text-ink-muted")}>{slot.timeLabel}</button>)}</div></div>)}{!slots.length && <p className="text-sm text-ink-muted">{selectedNeighborhood ? "No routes are open for this address yet." : "Choose a neighborhood to see the arrival times we can cover."}</p>}</div>
                </fieldset>
              </div>

              <aside className="border-t border-line-soft bg-surface-muted p-5 sm:p-7 lg:border-l lg:border-t-0">
                <div className="lg:sticky lg:top-6">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Visit summary</p>
                  <p className="mt-5 text-2xl font-bold tracking-[-0.04em] text-ink">{petName || "Your pet"}</p>
                  <p className="mt-1 text-sm text-ink-muted">{selectedPackage?.name ?? "Choose a service"}</p>
                  <dl className="mt-7 space-y-4 border-y border-line py-5 text-sm"><div className="flex justify-between gap-3"><dt className="text-ink-subtle">Arrival</dt><dd className="text-right font-semibold text-ink">{selectedSlot ? `${selectedSlot.dateLabel}, ${selectedSlot.timeLabel}` : "Not selected"}</dd></div><div className="flex justify-between"><dt className="text-ink-subtle">Duration</dt><dd className="font-semibold text-ink">{durationMinutes} min</dd></div><div className="flex justify-between"><dt className="text-ink-subtle">Neighborhood</dt><dd className="font-semibold text-ink">{selectedNeighborhood || "Not selected"}</dd></div></dl>
                  <div className="my-6 flex flex-wrap items-end justify-between gap-2"><span className="text-sm font-semibold text-ink-muted">Total</span><span className="text-3xl font-bold tracking-[-0.05em] text-ink">{formatMoney(totalPrice)}</span></div>
                  <Button type="submit" disabled={submitting} className="h-12 w-full rounded-md bg-brand text-sm font-bold !text-brand-on shadow-none hover:bg-brand-hover">{submitting ? "Saving your spot…" : "Confirm visit →"}</Button>
                  <p className="mt-3 text-center text-[0.68rem] leading-5 text-ink-subtle">No charge until your groomer is confirmed.</p>
                </div>
              </aside>
            </form>
          </div>
        </div>
      </section>
  );
}
