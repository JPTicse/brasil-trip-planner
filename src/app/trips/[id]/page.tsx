import { redirect } from "next/navigation";

export default async function TripOverviewPage({
  params,
}: PageProps<"/trips/[id]">) {
  const { id } = await params;
  redirect(`/trips/${id}/itinerary`);
}
