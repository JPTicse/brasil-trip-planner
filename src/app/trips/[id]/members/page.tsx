import { getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AddMemberForm } from "@/components/add-member-form";
import { DeleteButton } from "@/components/ui";
import { removeTripMember, deleteTrip } from "@/lib/actions";
import type { TripMember } from "@/lib/types";

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Miembros</h2>
        <span className="text-sm text-zinc-400">
          {members.length} {members.length === 1 ? "persona" : "personas"}
        </span>
      </div>

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
