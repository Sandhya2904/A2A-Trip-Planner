import {
  CheckCircle2,
  Loader2,
  MapPinned,
  Plane,
  Hotel,
  CloudSun,
  Sparkles,
  Wallet,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";

const USER_AGENT_STEPS = [
  {
    key: "route",
    loadingLabel: "Checking your route",
    doneLabel: "Route checked",
    description:
      "We verified your cities, trip type, dates, and whether the route is practical.",
    icon: MapPinned,
  },
  {
    key: "flight",
    loadingLabel: "Comparing travel options",
    doneLabel: "Travel options compared",
    description:
      "We estimated practical route options based on your destination and trip style.",
    icon: Plane,
  },
  {
    key: "hotel",
    loadingLabel: "Ranking stays",
    doneLabel: "Stay matched",
    description:
      "We matched the stay with your destination, nights, comfort level, and budget.",
    icon: Hotel,
  },
  {
    key: "weather",
    loadingLabel: "Reviewing weather",
    doneLabel: "Weather reviewed",
    description:
      "We checked daily weather patterns and added useful travel advice.",
    icon: CloudSun,
  },
  {
    key: "activities",
    loadingLabel: "Choosing experiences",
    doneLabel: "Experiences selected",
    description:
      "We picked activities based on your interests and destination fit.",
    icon: Sparkles,
  },
  {
    key: "budget",
    loadingLabel: "Optimizing budget",
    doneLabel: "Budget optimized",
    description:
      "We balanced flights, stay, food, transport, activities, and buffer cost.",
    icon: Wallet,
  },
  {
    key: "itinerary",
    loadingLabel: "Building itinerary",
    doneLabel: "Itinerary created",
    description:
      "We created a day-by-day plan with activities, travel notes, and estimated costs.",
    icon: CalendarDays,
  },
  {
    key: "quality",
    loadingLabel: "Running final quality check",
    doneLabel: "Final plan verified",
    description:
      "We checked that the plan is complete, logical, and ready to show.",
    icon: ShieldCheck,
  },
];

function getProgressCount(isPlanning, result, error) {
  if (error) return 0;
  if (result) return USER_AGENT_STEPS.length;
  if (isPlanning) return 4;
  return 0;
}

export default function AgentPlanningProgress({
  isPlanning = false,
  result = null,
  error = "",
}) {
  const completedCount = getProgressCount(isPlanning, result, error);

  if (!isPlanning && !result && !error) {
    return null;
  }

  const isDone = Boolean(result) && !isPlanning && !error;

  return (
    <section className="mx-auto mt-8 w-full max-w-[1580px] rounded-[2.5rem] border border-white/70 bg-white/95 p-5 shadow-[0_30px_110px_rgba(15,23,42,0.12)] backdrop-blur-3xl lg:p-7">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
            {isPlanning ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDone ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Smart planning checks
          </div>

          <h3 className="mt-4 text-3xl font-black tracking-[-0.06em] text-slate-950 lg:text-5xl">
            {isPlanning
              ? "Your trip is being checked and planned."
              : isDone
                ? "Your trip passed 8 planning checks."
                : "Planning needs attention."}
          </h3>

          <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-600 lg:text-base">
            {isPlanning
              ? "Before showing your trip, our backend agents are checking your route, comparing travel options, optimizing the budget, building the itinerary, and verifying the final plan."
              : isDone
                ? "Before this plan was shown, the system checked your route, travel options, stay, weather, experiences, budget, itinerary, and final plan quality."
                : "Something stopped the planning flow. Check the message below and try again."}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Checks passed
          </p>
          <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950">
            {completedCount}/{USER_AGENT_STEPS.length}
          </p>
        </div>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-700 transition-all duration-700"
          style={{
            width: `${(completedCount / USER_AGENT_STEPS.length) * 100}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {USER_AGENT_STEPS.map((step, index) => {
          const Icon = step.icon;
          const stepDone = index < completedCount;
          const stepActive = isPlanning && index === completedCount;

          return (
            <div
              key={step.key}
              className={[
                "rounded-[1.5rem] border p-4 transition",
                stepDone
                  ? "border-blue-100 bg-blue-50/70"
                  : stepActive
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-white",
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <div
                  className={[
                    "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                    stepDone
                      ? "bg-blue-600 text-white"
                      : stepActive
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 text-slate-500",
                  ].join(" ")}
                >
                  {stepDone ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : stepActive ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-black text-slate-950">
                      {stepDone ? step.doneLabel : step.loadingLabel}
                    </h4>

                    {stepDone ? (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                        Done
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isDone ? (
        <div className="mt-6 rounded-[1.75rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
          <p className="text-sm font-black text-emerald-800">
            Why this matters
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-emerald-700">
            The plan below is not just displayed directly. It passed backend route
            validation, budget optimization, itinerary creation, and final quality
            review before being shown to you.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}
    </section>
  );
}