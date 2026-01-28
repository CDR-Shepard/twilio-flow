/* eslint-disable @typescript-eslint/no-explicit-any */
import { differenceInSeconds, parseISO } from "date-fns";
import type { Database } from "./types/supabase";

type Filters = {
  from?: string;
  to?: string;
  tracked_number_id?: string;
  agent_id?: string;
};

type CallRow = Database["public"]["Tables"]["calls"]["Row"] & {
  tracked_numbers?: { friendly_name?: string | null; twilio_phone_number?: string | null } | null;
  call_attempts?: { status?: string | null; agent_id?: string | null; started_at?: string | null; ended_at?: string | null }[] | null;
};

export type MetricsResult = {
  summary: {
    total: number;
    answered: number;
    missed: number;
    abandoned: number;
    voicemail: number;
    avg_answer_sec: number | null;
    avg_handle_sec: number | null;
  };
  trends: { date: string; total: number; answered: number; missed: number; voicemail: number }[];
  agents: { id: string; name: string; answered: number; avg_answer_sec: number | null }[];
  numbers: { id: string; label: string; answered: number; missed: number; voicemail: number }[];
  hours: { hour: number; answered: number; missed: number; voicemail: number }[];
};

function classify(call: CallRow) {
  const attempts = call.call_attempts ?? [];
  const answeredAttempt = attempts.find((a) => ["answered", "completed"].includes((a.status ?? "").toLowerCase()));
  const answered = ["connected", "completed"].includes(call.status?.toLowerCase?.() ?? "") || !!answeredAttempt;
  const voicemail = !!call.voicemail_url;
  const missed = !answered && !voicemail;
  const abandoned = missed && (call.status?.toLowerCase?.() ?? "") === "failed";
  const speedToAnswer = answeredAttempt?.started_at
    ? differenceInSeconds(parseISO(answeredAttempt.started_at), parseISO(call.started_at))
    : null;
  const handleTime = call.ended_at ? differenceInSeconds(parseISO(call.ended_at), parseISO(call.started_at)) : null;
  const answeringAgentId = answeredAttempt?.agent_id ?? call.connected_agent_id ?? null;

  return { answered, voicemail, missed, abandoned, speedToAnswer, handleTime, answeringAgentId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadMetrics(
  supabase: any,
  { from, to, tracked_number_id, agent_id }: Filters
): Promise<MetricsResult> {
  const fromIso = from ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const toIso = to ?? new Date().toISOString();

  let query = supabase
    .from("calls")
    .select(
      "id, status, started_at, ended_at, voicemail_url, recording_url, connected_agent_id, tracked_number_id, tracked_numbers:tracked_number_id(friendly_name, twilio_phone_number), call_attempts:call_attempts(status, agent_id, started_at, ended_at)"
    )
    .gte("started_at", fromIso)
    .lte("started_at", toIso)
    .order("started_at", { ascending: false })
    .limit(1000);

  if (tracked_number_id) query = query.eq("tracked_number_id", tracked_number_id);

  const { data, error } = await query;
  if (error) throw error;

  let calls = (data as CallRow[]) ?? [];
  if (agent_id) {
    calls = calls.filter((c) =>
      c.connected_agent_id === agent_id || (c.call_attempts ?? []).some((a) => a.agent_id === agent_id)
    );
  }

  const dailyMap = new Map<string, { total: number; answered: number; missed: number; voicemail: number }>();
  const agentMap = new Map<string, { name: string; answered: number; totalAnswerTime: number; answers: number }>();
  const numberMap = new Map<string, { label: string; answered: number; missed: number; voicemail: number }>();
  const hourMap = Array.from({ length: 24 }).map(() => ({ answered: 0, missed: 0, voicemail: 0 }));

  let answeredCount = 0;
  let missedCount = 0;
  let abandonedCount = 0;
  let voicemailCount = 0;
  let totalAnswerTime = 0;
  let answerSamples = 0;
  let totalHandleTime = 0;
  let handleSamples = 0;

  for (const call of calls) {
    const { answered, voicemail, missed, abandoned, speedToAnswer, handleTime, answeringAgentId } = classify(call);
    answeredCount += answered ? 1 : 0;
    missedCount += missed ? 1 : 0;
    abandonedCount += abandoned ? 1 : 0;
    voicemailCount += voicemail ? 1 : 0;
    if (speedToAnswer != null && speedToAnswer >= 0) {
      totalAnswerTime += speedToAnswer;
      answerSamples += 1;
    }
    if (handleTime != null && handleTime >= 0) {
      totalHandleTime += handleTime;
      handleSamples += 1;
    }

    const dateKey = call.started_at.slice(0, 10);
    const entry = dailyMap.get(dateKey) ?? { total: 0, answered: 0, missed: 0, voicemail: 0 };
    entry.total += 1;
    entry.answered += answered ? 1 : 0;
    entry.missed += missed ? 1 : 0;
    entry.voicemail += voicemail ? 1 : 0;
    dailyMap.set(dateKey, entry);

    const numberLabel = call.tracked_numbers?.friendly_name || call.to_number || "Unknown";
    const numberKey = call.tracked_number_id || call.to_number || "unknown";
    const numEntry = numberMap.get(numberKey) ?? { label: numberLabel, answered: 0, missed: 0, voicemail: 0 };
    numEntry.answered += answered ? 1 : 0;
    numEntry.missed += missed ? 1 : 0;
    numEntry.voicemail += voicemail ? 1 : 0;
    numberMap.set(numberKey, numEntry);

    const hour = parseISO(call.started_at).getHours();
    const hourEntry = hourMap[hour];
    hourEntry.answered += answered ? 1 : 0;
    hourEntry.missed += missed ? 1 : 0;
    hourEntry.voicemail += voicemail ? 1 : 0;

    if (answeringAgentId) {
      const agentEntry = agentMap.get(answeringAgentId) ?? {
        name: "",
        answered: 0,
        totalAnswerTime: 0,
        answers: 0
      };
      agentEntry.answered += 1;
      if (speedToAnswer != null && speedToAnswer >= 0) {
        agentEntry.totalAnswerTime += speedToAnswer;
        agentEntry.answers += 1;
      }
      agentMap.set(answeringAgentId, agentEntry);
    }
  }

  // hydrate agent names
  const agentIds = Array.from(agentMap.keys());
  if (agentIds.length) {
    const { data: agentData }: { data: { id: string; full_name: string | null }[] | null } = await supabase
      .from("agents")
      .select("id, full_name")
      .in("id", agentIds);
    agentData?.forEach((a: { id: string; full_name: string | null }) => {
      const entry = agentMap.get(a.id);
      if (entry) entry.name = a.full_name ?? "Agent";
    });
  }

  // ensure all seven days present
  const trends: MetricsResult["trends"] = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));

  const agents: MetricsResult["agents"] = Array.from(agentMap.entries()).map(([id, v]) => ({
    id,
    name: v.name || "Agent",
    answered: v.answered,
    avg_answer_sec: v.answers ? Math.round(v.totalAnswerTime / v.answers) : null
  }));

  const numbers: MetricsResult["numbers"] = Array.from(numberMap.entries()).map(([id, v]) => ({
    id,
    label: v.label,
    answered: v.answered,
    missed: v.missed,
    voicemail: v.voicemail
  }));

  const hours: MetricsResult["hours"] = hourMap.map((v, i) => ({
    hour: i,
    answered: v.answered,
    missed: v.missed,
    voicemail: v.voicemail
  }));

  return {
    summary: {
      total: calls.length,
      answered: answeredCount,
      missed: missedCount,
      abandoned: abandonedCount,
      voicemail: voicemailCount,
      avg_answer_sec: answerSamples ? Math.round(totalAnswerTime / answerSamples) : null,
      avg_handle_sec: handleSamples ? Math.round(totalHandleTime / handleSamples) : null
    },
    trends,
    agents,
    numbers,
    hours
  };
}
