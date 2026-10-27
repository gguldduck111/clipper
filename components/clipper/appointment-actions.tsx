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

const ink = "#0a2540";
const accent = "#635bff";

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
          <p className="font-semibold" style={{ color: ink }}>
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
          <p className="font-semibold" style={{ color: ink }}>
            Cancel {appointment.pet.name}&apos;s visit?
          </p>
          <p className="mt-1">
            {formatSeoulDateLong(appointment.startsAt)} at{" "}
            {formatSeoulTime(appointment.startsAt)} KST. This cannot be undone —
            you would need to book again.
          </p>
        </div>
        {error && (
          <Alert className="border-[#f3aaa0] bg-[#fff3f0] text-[#8f3d30]">
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
            className="h-11 rounded-full px-5 text-sm font-bold !text-white shadow-none"
            style={{ background: "#9f3f38" }}
          >
            {pending ? "Cancelling…" : "Yes, cancel this visit"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={close}
            className="h-11 rounded-full border-[#dbe3ef] bg-white px-5 text-sm font-bold text-[#53627a]"
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
          <p className="font-semibold" style={{ color: ink }}>
            Pick a new arrival time
          </p>
          <p className="mt-1">
            All times KST · {appointment.neighborhood} ·{" "}
            {appointment.package.durationMinutes} minute visit. Your service and
            price stay the same.
          </p>
        </div>

        {error && (
          <Alert className="border-[#f3aaa0] bg-[#fff3f0] text-[#8f3d30]">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {slots.length ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {Object.entries(groupedSlots).map(([dateKey, dateSlots]) => (
              <div key={dateKey}>
                <p className="mb-2 text-sm font-bold" style={{ color: ink }}>
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
                          ? "text-white"
                          : "border-[#dbe3ef] bg-white text-[#425466]",
                      )}
                      style={
                        selectedSlotId === slot.id
                          ? { background: accent, borderColor: accent }
                          : undefined
                      }
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
            className="h-11 rounded-full px-5 text-sm font-bold !text-white shadow-none"
            style={{ background: accent }}
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
            className="h-11 rounded-full border-[#dbe3ef] bg-white px-5 text-sm font-bold text-[#53627a]"
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
        <p className="font-semibold" style={{ color: ink }}>
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
          className="h-11 rounded-full px-5 text-sm font-bold !text-white shadow-none"
          style={{ background: accent }}
        >
          <CalendarClock aria-hidden="true" className="size-4" /> Change time
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => open("cancel")}
          className="h-11 rounded-full border-[#f3c4c0] bg-white px-5 text-sm font-bold text-[#9f3f38]"
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
        "mt-8 flex flex-col gap-4 rounded-2xl border border-[#dbe3ef] bg-white px-5 py-5 text-sm text-[#53627a] sm:px-7",
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
        "inline-flex items-center gap-2 font-bold text-[#635bff] hover:text-[#0a2540]",
        className,
      )}
    >
      <Phone aria-hidden="true" className="size-4" /> {PHONE_NUMBER}
    </a>
  );
}
