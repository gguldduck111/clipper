"use client";

import { CalendarClock, Phone, X } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, AlertDescription, Button } from "@/components/ui";
import { changeBlockMessages, type ChangeBlockReason } from "@/lib/clipper/policy";
import { formatSeoulDateLong, formatSeoulTime } from "@/lib/clipper/time";
import type { AppointmentDetails, AvailableSlot } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppointmentActionsProps = {
  appointment: AppointmentDetails;
  /** Arrival times this visit may move to; empty when it cannot be changed. */
  slots: AvailableSlot[];
  /** Decided on the server, so the buttons match what the API will accept. */
  blockReason: ChangeBlockReason | null;
};

const PHONE_NUMBER = "02-555-0142";
const PHONE_HREF = "tel:+8225550142";

export function AppointmentActions({
  appointment,
  slots,
  blockReason,
}: AppointmentActionsProps) {
  const [mode, setMode] = useState<"idle" | "reschedule" | "cancel">("idle");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const groupedSlots = useMemo(
    () =>
      slots.reduce<Record<string, AvailableSlot[]>>((groups, slot) => {
        (groups[slot.dateKey] ??= []).push(slot);
        return groups;
      }, {}),
    [slots],
  );
  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId);
  const basePath = `/appointments/${encodeURIComponent(appointment.reference)}`;

  function open(next: "reschedule" | "cancel") {
    setMode(next);
    setError("");
    setSelectedSlotId("");
  }

  function close() {
    setMode("idle");
    setError("");
    setSelectedSlotId("");
  }

  // A full navigation rather than a client refresh: the page re-reads the
  // appointment, and the query parameter survives so the banner still shows.
  async function send(path: string, body: object | null, done: string) {
    setPending(true);
    setError("");

    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; groomerChanged?: boolean }
        | null;

      if (!response.ok || !data?.ok) {
        setPending(false);
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      window.location.assign(
        done === "changed" && data.groomerChanged
          ? `${basePath}?changed=groomer`
          : `${basePath}?${done}=1`,
      );
    } catch {
      setPending(false);
      setError("We could not reach Clipper. Please check your connection.");
    }
  }

  if (blockReason) {
    return (
      <Shell>
        <div>
          <p className="font-semibold text-ink">
            This visit can no longer be changed online
          </p>
          <p className="mt-1">{changeBlockMessages[blockReason]}</p>
        </div>
        <PhoneLink />
      </Shell>
    );
  }

  if (mode === "cancel") {
    return (
      <Shell stacked>
        <div>
          <p className="font-semibold text-ink">
            Cancel {appointment.pet.name}&apos;s visit?
          </p>
          <p className="mt-1">
            {formatSeoulDateLong(appointment.startsAt)} at{" "}
            {formatSeoulTime(appointment.startsAt)} KST. This cannot be undone —
            you would need to book again.
          </p>
        </div>
        {error && (
          <Alert className="border-danger-border bg-danger-bg text-danger-fg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              send(`/api/appointments/${encodeURIComponent(appointment.reference)}/cancel`, null, "cancelled")
            }
            className="h-11 rounded-full bg-danger-fg px-5 text-sm font-bold !text-ink-inverse shadow-none"
          >
            {pending ? "Cancelling…" : "Yes, cancel this visit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
            className="h-11 rounded-full border-line bg-surface-card px-5 text-sm font-bold text-ink-muted"
          >
            Keep my visit
          </Button>
        </div>
      </Shell>
    );
  }

  if (mode === "reschedule") {
    return (
      <Shell stacked>
        <div>
          <p className="font-semibold text-ink">
            Pick a new arrival time
          </p>
          <p className="mt-1">
            All times KST · {appointment.neighborhood} ·{" "}
            {appointment.package.durationMinutes} minute visit. Your service and
            price stay the same.
          </p>
        </div>

        {error && (
          <Alert className="border-danger-border bg-danger-bg text-danger-fg">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {slots.length ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
              <div key={dateKey}>
                <p className="mb-2 text-sm font-bold text-ink">
                  {dateSlots[0]?.dateLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {dateSlots.map((slot) => (
                    <button
                      type="button"
                      key={slot.id}
                      onClick={() => {
                        setSelectedSlotId(slot.id);
                        setError("");
                      }}
                      className={cn(
                        "rounded-md border px-3 py-3 text-sm font-bold",
                        selectedSlotId === slot.id
                          ? "border-brand bg-brand text-brand-on"
                          : "border-line bg-surface-card text-ink-muted",
                      )}
                    >
                      {slot.timeLabel}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>
            No other times are open on our routes right now. Give us a call and
            we&apos;ll find one for you.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={pending || !selectedSlot}
            onClick={() =>
              selectedSlot &&
              send(
                `/api/appointments/${encodeURIComponent(appointment.reference)}/reschedule`,
                { startsAt: selectedSlot.startsAt },
                "changed",
              )
            }
            className="h-11 rounded-full bg-brand px-5 text-sm font-bold !text-brand-on shadow-none hover:bg-brand-hover"
          >
            {pending
              ? "Moving your visit…"
              : selectedSlot
                ? `Move to ${selectedSlot.dateLabel}, ${selectedSlot.timeLabel}`
                : "Choose a time"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
            className="h-11 rounded-full border-line bg-surface-card px-5 text-sm font-bold text-ink-muted"
          >
            Never mind
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div>
        <p className="font-semibold text-ink">
          Need to change something?
        </p>
        <p className="mt-1">
          You can move or cancel this visit up to 24 hours before we arrive.
        </p>
        <PhoneLink className="mt-2 sm:hidden" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() => open("reschedule")}
          className="h-11 rounded-full bg-brand px-5 text-sm font-bold !text-brand-on shadow-none hover:bg-brand-hover"
        >
          <CalendarClock aria-hidden="true" className="size-4" /> Change time
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => open("cancel")}
          className="h-11 rounded-full border-danger-border bg-surface-card px-5 text-sm font-bold text-danger-fg"
        >
          <X aria-hidden="true" className="size-4" /> Cancel visit
        </Button>
      </div>
    </Shell>
  );
}

function Shell({
  children,
  stacked = false,
}: {
  children: React.ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-surface-card px-5 py-5 text-sm text-ink-muted sm:px-7",
        !stacked && "sm:flex-row sm:items-center sm:justify-between",
      )}
    >
      {children}
    </div>
  );
}

function PhoneLink({ className }: { className?: string }) {
  return (
    <a
      href={PHONE_HREF}
      className={cn(
        "inline-flex items-center gap-2 font-bold text-brand hover:text-ink",
        className,
      )}
    >
      <Phone aria-hidden="true" className="size-4" /> {PHONE_NUMBER}
    </a>
  );
}
