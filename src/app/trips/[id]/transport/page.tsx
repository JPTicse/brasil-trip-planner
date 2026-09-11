import { ComingSoon } from "@/components/coming-soon";

export default function TransportPage({
  params,
}: PageProps<"/trips/[id]/transport">) {
  return (
    <ComingSoon
      icon={<PlaneIcon className="h-8 w-8 text-zinc-500 dark:text-zinc-400" />}
      title="Transporte"
      description="Vuelos, autobuses, coches y traslados entre ciudades durante el viaje."
      features={[
        "Vuelos y billetes",
        "Autobuses y trenes",
        "Coches y traslados compartidos",
        "Horarios y aeropuertos",
        "Reserva y coste por persona",
      ]}
    />
  );
}

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M22 12h-6l-3 9L4 5l3 9H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
