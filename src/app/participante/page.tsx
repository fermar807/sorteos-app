import ParticipanteView from "./ParticipanteView";

export default async function ParticipantePage({
  searchParams,
}: {
  searchParams: Promise<{ codigo?: string }>;
}) {
  const { codigo } = await searchParams;
  return <ParticipanteView codigo={codigo ?? null} />;
}