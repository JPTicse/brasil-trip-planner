import { notFound } from "next/navigation";
import { getTrip } from "@/lib/data";
import { isTripMember } from "@/lib/data";
import { NewActivityWizard } from "@/components/new-activity-wizard";

export default async function NewActivityPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const [trip, member] = await Promise.all([getTrip(id), isTripMember(id)]);

  if (!trip || !member) notFound();

  return (
    <NewActivityWizard
      tripId={id}
      tripDestination={trip.destination ?? "Brasil"}
      tripStartDate={trip.start_date ?? undefined}
      tripEndDate={trip.end_date ?? undefined}
    />
  );
}
