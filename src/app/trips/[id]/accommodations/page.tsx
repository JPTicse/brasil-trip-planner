import { ComingSoon } from "@/components/coming-soon";

export default function AccommodationsPage({
  params,
}: PageProps<"/trips/[id]/accommodations">) {
  return (
    <ComingSoon
      icon={<BedIcon className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />}
      title="Hoteles"
      description="Alojamientos del viaje, reservas, check-in/check-out y reparto por habitaciones."
      features={[
        "Listado de hoteles y apartamentos",
        "Fechas de check-in y check-out",
        "Reserva compartida y enlaces",
        "Reparto de habitaciones",
        "Coste y moneda por noche",
      ]}
    />
  );
}

function BedIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 7v10M2 7h20M2 7a5 5 0 015-5h0M22 7v10M22 7a5 5 0 00-5-5h0M7 7h10M7 7a3 3 0 00-3 3v5M20 10v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
