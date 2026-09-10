import Link from "next/link";
import { createTrip } from "@/lib/actions";
import { Field, TextInput, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default function NewTripPage() {
  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/trips"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
          >
            <BackIcon />
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Nuevo viaje</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <form action={createTrip} className="space-y-4">
          <Field label="Nombre del viaje *">
            <TextInput
              name="name"
              required
              placeholder="Ej: Brasil 2026 🇧🇷"
            />
          </Field>

          <Field label="Destino">
            <TextInput
              name="destination"
              placeholder="Ej: Río de Janeiro, São Paulo"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha inicio">
              <TextInput name="start_date" type="date" />
            </Field>
            <Field label="Fecha fin">
              <TextInput name="end_date" type="date" />
            </Field>
          </div>

          <Field label="Descripción">
            <TextArea
              name="description"
              rows={3}
              placeholder="Notas generales del viaje..."
            />
          </Field>

          <div className="pt-2">
            <SubmitButton>Crear viaje</SubmitButton>
          </div>
        </form>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
