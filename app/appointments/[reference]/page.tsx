import { ArrowLeft, ArrowUpRight, Phone } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentCard } from "@/components/clipper/appointment-card";
import { BookingConfirmation } from "@/components/clipper/booking-confirmation";
import { getAppointmentByReference } from "@/lib/clipper/data";

type AppointmentPageProps = {
  params: Promise<{ reference: string }>;
};

export const dynamic = "force-dynamic";

export default async function AppointmentPage({ params }: AppointmentPageProps) {
  const { reference } = await params;
  const appointment = await getAppointmentByReference(reference);

  if (!appointment) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f9fc] text-[#0a2540]">
      <div aria-hidden="true" className="absolute -right-[18rem] -top-[24rem] h-[40rem] w-[40rem] rotate-[24deg] sm:-right-[28rem] sm:-top-[35rem] sm:h-[62rem] sm:w-[62rem] bg-[linear-gradient(135deg,#ffdb80,#ff8f70_28%,#d783ff_52%,#7a73ff_74%,#68d5ff)] opacity-55 blur-[3px]" />
      <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 lg:px-12">
        <header className="relative flex items-center justify-between gap-3 py-5 sm:py-8">
          <Link href="/" className="inline-flex min-h-11 shrink-0 items-center text-xl font-black tracking-[-0.07em] text-[#0a2540] sm:text-2xl">clipper</Link>
          <Link href="/#book-prism" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#635bff] px-4 py-2 text-xs font-bold !text-white transition-colors hover:bg-[#0a2540] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm">
            Book another visit <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </header>

        <div className="relative mx-auto max-w-4xl pt-6 sm:pt-14">
          <Link href="/appointments" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#53627a] sm:mb-6 transition-colors hover:text-[#635bff]">
            <ArrowLeft aria-hidden="true" className="size-4" /> All appointments
          </Link>
          <BookingConfirmation appointment={appointment} />

          <div className="mt-7">
            <AppointmentCard appointment={appointment} />
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#dbe3ef] bg-white px-5 py-5 text-sm text-[#53627a] sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div>
              <p className="font-semibold text-[#0a2540]">Need to change something?</p>
              <p className="mt-1">Give our tiny team a call and we&apos;ll take care of it.</p>
            </div>
            <a href="tel:+8225550142" className="inline-flex min-h-11 items-center gap-2 font-bold text-[#635bff] hover:text-[#0a2540]">
              <Phone aria-hidden="true" className="size-4" /> 02-555-0142
            </a>
          </div>
        </div>

        <footer className="relative mx-auto mt-16 flex max-w-4xl flex-col gap-2 border-t border-[#dbe3ef] pt-5 text-xs text-[#8898aa] sm:flex-row sm:items-center sm:justify-between">
          <span>Clipper · Seoul, Korea</span>
          <span>Thoughtful grooming, right at home.</span>
        </footer>
      </div>
    </main>
  );
}
