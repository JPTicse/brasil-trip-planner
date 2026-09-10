import { getTripMembers, getPendingAccessRequests } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AddMemberForm } from "@/components/add-member-form";
import { DeleteButton } from "@/components/ui";
import { LocationTracker } from "@/components/location-tracker";
import { MembersMap } from "@/components/members-map";
import { removeTripMember, deleteTrip, resolveAccessRequest } from "@/lib/actions";
import type { TripMember, TripAccessRequest } from "@/lib/types";

export default async function MembersPage({
  params,
}: PageProps<"/trips/[id]/members">) {
  const { id } = await params;
  const [members, user] = await Promise.all([
    getTripMembers(id),
    getCurrentUser(),
  ]);

  const currentUserMember = members.find((m) => m.user_id === user?.id);
  const isOwner = currentUserMember?.role === "owner";

  // Obtener solicitudes pendientes (solo para owners)
  const pendingRequests = isOwner ? await getPendingAccessRequests(id) : [];

  // Perfiles con ubicación para el mapa
  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Miembros</h2>
        <span className="text-sm text-zinc-400">
          {members.length} {members.length === 1 ? "persona" : "personas"}
        </span>
      </div>

      {/* Tracker de ubicación (invisible pero activo) */}
      <LocationTracker />

      {/* Mapa de ubicaciones */}
      <section>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
          <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ubicación del grupo
        </h3>
        <MembersMap members={memberProfiles} />
      </section>

      {/* Solicitudes de acceso pendientes */}
      {isOwner && pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-amber-700">
            Solicitudes de acceso ({pendingRequests.length})
          </h3>
          {pendingRequests.map((req) => (
            <AccessRequestCard key={req.id} request={req} tripId={id} />
          ))}
        </div>
      )}

      <div className="space-y-2">
        {members.map((m) => (
          <MemberCard
            key={m.id}
            member={m}
            isCurrentUser={m.user_id === user?.id}
            canRemove={isOwner}
          />
        ))}
      </div>

      {isOwner && <AddMemberForm tripId={id} />}

      {/* Zona de peligro: eliminar viaje */}
      {isOwner && (
        <div className="mt-8 rounded-xl border border-red-200 bg-red-50/50 p-4">
          <h3 className="text-sm font-semibold text-red-700">Zona de peligro</h3>
          <p className="mt-1 text-xs text-red-500">
            Eliminar el viaje borrará permanentemente todo el itinerario,
            hoteles, transporte y gastos.
          </p>
          <form action={deleteTrip} className="mt-3">
            <input type="hidden" name="trip_id" value={id} />
            <button
              type="submit"
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              Eliminar viaje
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function AccessRequestCard({
  request,
  tripId,
}: {
  request: TripAccessRequest;
  tripId: string;
}) {
  const name = request.profile?.name ?? "Usuario";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-amber-600 text-sm font-semibold text-white">
          {request.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={request.profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">{name}</p>
          {request.message && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">
              &ldquo;{request.message}&rdquo;
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <form action={resolveAccessRequest} className="flex-1">
          <input type="hidden" name="request_id" value={request.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <input type="hidden" name="action" value="approve" />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            Aprobar
          </button>
        </form>
        <form action={resolveAccessRequest} className="flex-1">
          <input type="hidden" name="request_id" value={request.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <input type="hidden" name="action" value="reject" />
          <button
            type="submit"
            className="w-full rounded-lg border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            Rechazar
          </button>
        </form>
      </div>
    </div>
  );
}

function MemberCard({
  member,
  isCurrentUser,
  canRemove,
}: {
  member: TripMember;
  isCurrentUser: boolean;
  canRemove: boolean;
}) {
  const name = member.profile?.name ?? "Usuario";
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const isOwner = member.role === "owner";

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-semibold text-white">
          {member.profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-900">
            {name}
            {isCurrentUser && (
              <span className="ml-1.5 text-xs text-zinc-400">(tú)</span>
            )}
          </p>
          <div className="flex items-center gap-1.5">
            {isOwner && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                Creador
              </span>
            )}
          </div>
        </div>
      </div>
      {canRemove && !isOwner && (
        <form action={removeTripMember}>
          <input type="hidden" name="trip_id" value={member.trip_id} />
          <input type="hidden" name="member_id" value={member.id} />
          <DeleteButton>Expulsar</DeleteButton>
        </form>
      )}
    </div>
  );
}
