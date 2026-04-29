import { useMemo, useState } from "react";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  Layers,
  Network,
  Search,
  Server,
  Sparkles,
  Timer,
  Workflow,
  Zap,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const AGENT_COLORS = {
  flight_agent: {
    icon: Zap,
    gradient: "from-sky-500 to-blue-600",
    soft: "bg-sky-50 text-sky-700 border-sky-100",
    glow: "shadow-sky-500/20",
  },
  hotel_agent: {
    icon: Server,
    gradient: "from-emerald-500 to-teal-600",
    soft: "bg-emerald-50 text-emerald-700 border-emerald-100",
    glow: "shadow-emerald-500/20",
  },
  weather_agent: {
    icon: Activity,
    gradient: "from-amber-400 to-orange-500",
    soft: "bg-amber-50 text-amber-700 border-amber-100",
    glow: "shadow-amber-500/20",
  },
  activity_agent: {
    icon: Search,
    gradient: "from-pink-500 to-rose-600",
    soft: "bg-pink-50 text-pink-700 border-pink-100",
    glow: "shadow-pink-500/20",
  },
  pricing_agent: {
    icon: Database,
    gradient: "from-green-500 to-emerald-600",
    soft: "bg-green-50 text-green-700 border-green-100",
    glow: "shadow-green-500/20",
  },
  itinerary_agent: {
    icon: Layers,
    gradient: "from-orange-500 to-red-600",
    soft: "bg-orange-50 text-orange-700 border-orange-100",
    glow: "shadow-orange-500/20",
  },
  orchestrator: {
    icon: Workflow,
    gradient: "from-violet-500 to-indigo-600",
    soft: "bg-violet-50 text-violet-700 border-violet-100",
    glow: "shadow-violet-500/20",
  },
};

function getAgentTheme(agent) {
  return (
    AGENT_COLORS[agent] || {
      icon: Network,
      gradient: "from-slate-700 to-slate-950",
      soft: "bg-slate-50 text-slate-700 border-slate-100",
      glow: "shadow-slate-500/20",
    }
  );
}

function formatDuration(value) {
  const number = Number(value || 0);

  if (number >= 1000) {
    return `${(number / 1000).toFixed(2)}s`;
  }

  return `${number.toFixed(0)}ms`;
}

function formatDateTime(value) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function prettyAgentName(agent) {
  if (!agent) return "Unknown Agent";

  return agent
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getEventKey(event, index) {
  return (
    event?.event_id ||
    event?.trace_id ||
    event?.id ||
    `${event?.agent || "agent"}-${event?.metadata?.task_name || "task"}-${index}`
  );
}

export default function AgentWorkflowTimeline({
  agentTrace = [],
  a2aMessages = [],
  executionRecords = [],
}) {
  const [openIndex, setOpenIndex] = useState(0);

  const safeTrace = Array.isArray(agentTrace) ? agentTrace : [];

  const workflowStats = useMemo(() => {
    const totalDuration = safeTrace.reduce(
      (sum, event) => sum + Number(event.duration_ms || 0),
      0,
    );

    const completed = safeTrace.filter(
      (event) => event.status === "completed",
    ).length;

    const uniqueAgents = new Set(safeTrace.map((event) => event.agent)).size;

    return {
      totalDuration,
      completed,
      uniqueAgents,
    };
  }, [safeTrace]);

  if (!safeTrace.length) {
    return <EmptyA2AState />;
  }

  return (
    <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_34px_100px_rgba(15,23,42,0.08)]">
      <div className="relative overflow-hidden bg-slate-950 p-7 text-white lg:p-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.34),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.28),transparent_24%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative z-10 flex flex-col justify-between gap-8 xl:flex-row xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-cyan-100 backdrop-blur-2xl">
              <Network className="h-4 w-4" />
              A2A Agent Timeline
            </div>

            <h3 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.065em] text-white lg:text-6xl">
              Agent workflow timeline.
            </h3>

            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-300">
              See how each specialized travel agent handled the request, from
              route ranking to pricing and itinerary generation.
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-8 grid gap-4 md:grid-cols-3">
          <WorkflowStat
            icon={CheckCircle2}
            label="Completed Agents"
            value={workflowStats.completed}
          />
          <WorkflowStat
            icon={Timer}
            label="Total Runtime"
            value={formatDuration(workflowStats.totalDuration)}
          />
          <WorkflowStat
            icon={Sparkles}
            label="Unique Agents"
            value={workflowStats.uniqueAgents}
          />
        </div>
      </div>

      <div className="bg-slate-50 p-5 lg:p-8">
        <div className="space-y-5">
          {safeTrace.map((event, index) => {
            const isOpen = openIndex === index;

            return (
              <AgentTimelineCard
                key={getEventKey(event, index)}
                event={event}
                index={index}
                isOpen={isOpen}
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WorkflowStat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-2xl">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-cyan-100">
        <Icon className="h-5 w-5" />
      </div>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function AgentTimelineCard({ event, index, isOpen, onClick }) {
  const theme = getAgentTheme(event.agent);
  const Icon = theme.icon;

  return (
    <div
      className={cx(
        "overflow-hidden rounded-[2rem] border bg-white transition-all duration-300",
        isOpen
          ? "border-blue-200 shadow-2xl shadow-blue-600/10"
          : "border-slate-200 shadow-xl shadow-slate-950/5",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "group w-full p-5 text-left transition hover:bg-blue-50/40 lg:p-6",
          isOpen ? "bg-blue-50/70" : "bg-white",
        )}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div
              className={cx(
                "grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-gradient-to-br text-white shadow-xl",
                theme.gradient,
                theme.glow,
              )}
            >
              <Icon className="h-7 w-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Step {String(index + 1).padStart(2, "0")}
              </p>

              <h4 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">
                {event.title || prettyAgentName(event.agent)}
              </h4>

              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
                {event.output_summary ||
                  event.description ||
                  "Agent completed its assigned task."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <MiniBadge icon={Clock3} value={formatDuration(event.duration_ms)} />
                <MiniBadge icon={Code2} value={event.metadata?.task_name || "task"} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span
              className={cx(
                "rounded-full border px-4 py-2 text-xs font-black",
                theme.soft,
              )}
            >
              {event.status || "completed"}
            </span>

            <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500">
              {isOpen ? "Hide details" : "View details"}
            </span>
          </div>
        </div>
      </button>

      {isOpen ? (
        <div className="border-t border-slate-200 bg-slate-950 p-5 text-white lg:p-7">
          <div className="grid gap-4 lg:grid-cols-2">
            <DetailRow label="Agent" value={prettyAgentName(event.agent)} />
            <DetailRow label="Status" value={event.status || "completed"} />
            <DetailRow label="Task" value={event.metadata?.task_name || "Not set"} />
            <DetailRow label="Duration" value={formatDuration(event.duration_ms)} />
            <DetailRow label="Started" value={formatDateTime(event.started_at)} />
            <DetailRow label="Completed" value={formatDateTime(event.completed_at)} />
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Description
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-slate-100">
              {event.description || "No description available."}
            </p>
          </div>

          <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
              Output Summary
            </p>
            <p className="mt-3 text-sm font-semibold leading-7 text-white">
              {event.output_summary || "No output summary available."}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MiniBadge({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600">
      <Icon className="h-3.5 w-3.5" />
      {value}
    </span>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-5 rounded-2xl bg-white/10 p-4">
      <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </span>

      <span className="text-right text-sm font-black text-white">
        {value}
      </span>
    </div>
  );
}

function EmptyA2AState() {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
        <Network className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
        No agent timeline available yet.
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500">
        Generate a new trip plan to see the specialized agents and their
        workflow summaries.
      </p>
    </div>
  );
}