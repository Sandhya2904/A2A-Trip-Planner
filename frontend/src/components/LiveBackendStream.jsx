import {
  Activity,
  CheckCircle2,
  Clock3,
  Database,
  Hotel,
  Layers,
  Loader2,
  MapPinned,
  Network,
  Plane,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function prettyAgentName(agent) {
  if (!agent) return "Backend Agent";

  return String(agent)
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getEventKey(event, index) {
  return (
    event?.id ||
    event?.event_id ||
    event?.receivedAt ||
    `${event?.event || "event"}-${event?.data?.agent || "backend"}-${index}`
  );
}

function getIcon(agentOrEvent) {
  const key = String(agentOrEvent || "").toLowerCase();

  if (key.includes("route")) return Route;
  if (key.includes("flight")) return Plane;
  if (key.includes("hotel")) return Hotel;
  if (key.includes("weather")) return Activity;
  if (key.includes("activity")) return Sparkles;
  if (key.includes("budget")) return Wallet;
  if (key.includes("pricing")) return Database;
  if (key.includes("itinerary")) return Layers;
  if (key.includes("quality")) return ShieldCheck;
  if (key.includes("backend")) return Server;
  if (key.includes("start")) return MapPinned;

  return Network;
}

function getTone(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return {
      card: "border-emerald-200 bg-emerald-50",
      icon: "bg-emerald-600 text-white",
      pill: "bg-emerald-600 text-white",
    };
  }

  if (value === "running" || value === "started") {
    return {
      card: "border-blue-200 bg-blue-50",
      icon: "bg-blue-600 text-white",
      pill: "bg-blue-600 text-white",
    };
  }

  if (value === "failed") {
    return {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-600 text-white",
      pill: "bg-red-600 text-white",
    };
  }

  return {
    card: "border-slate-200 bg-white",
    icon: "bg-slate-100 text-slate-600",
    pill: "bg-slate-100 text-slate-600",
  };
}

export default function LiveBackendStream({
  events = [],
  isPlanning = false,
  error = "",
}) {
  const streamEvents = asArray(events);

  if (!isPlanning && !streamEvents.length && !error) {
    return null;
  }

  const latestEvent = streamEvents[streamEvents.length - 1];
  const latestData = latestEvent?.data || {};
  const progressPercent = Number(latestData?.progress_percent || 0);

  return (
    <section className="mx-auto mt-8 w-full max-w-[1580px] overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white shadow-[0_34px_110px_rgba(15,23,42,0.13)]">
      <div className="relative overflow-hidden bg-slate-950 p-6 text-white lg:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.35),transparent_28%),radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.22),transparent_25%)]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:42px_42px]" />

        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-cyan-100 backdrop-blur-xl">
              {isPlanning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Live FastAPI stream
            </div>

            <h3 className="mt-4 text-3xl font-black tracking-[-0.06em] text-white lg:text-5xl">
              {isPlanning
                ? "Backend agents are running now."
                : "Backend stream completed."}
            </h3>

            <p className="mt-3 max-w-4xl text-sm font-semibold leading-7 text-slate-300 lg:text-base">
              {latestData?.description ||
                "This panel shows live server-sent events from the FastAPI streaming endpoint while the trip is being planned."}
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Stream progress
            </p>
            <p className="mt-1 text-3xl font-black tracking-[-0.05em] text-white">
              {Math.max(0, Math.min(100, progressPercent))}%
            </p>
          </div>
        </div>

        <div className="relative z-10 mt-6 h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-emerald-400 transition-all duration-500"
            style={{
              width: `${Math.max(0, Math.min(100, progressPercent))}%`,
            }}
          />
        </div>
      </div>

      <div className="grid gap-6 bg-slate-50 p-5 lg:grid-cols-[1fr_0.8fr] lg:p-7">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Live events
              </p>
              <h4 className="mt-1 text-2xl font-black tracking-[-0.05em] text-slate-950">
                Server-sent backend workflow
              </h4>
            </div>

            <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-black text-blue-700">
              {streamEvents.length} events
            </span>
          </div>

          <div className="mt-5 max-h-[520px] space-y-3 overflow-auto pr-1">
            {streamEvents.length ? (
              streamEvents.map((event, index) => {
                const data = event?.data || {};
                const agentKey = data?.agent || event?.event || "backend";
                const Icon = getIcon(agentKey);
                const tone = getTone(data?.status);

                return (
                  <div
                    key={getEventKey(event, index)}
                    className={cx(
                      "rounded-[1.5rem] border p-4 transition",
                      tone.card,
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cx(
                          "grid h-11 w-11 shrink-0 place-items-center rounded-2xl",
                          tone.icon,
                        )}
                      >
                        {data?.status === "running" ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Icon className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                              {event?.event || "message"}
                              {data?.step ? ` · step ${data.step}` : ""}
                            </p>

                            <h5 className="mt-1 text-base font-black text-slate-950">
                              {data?.title ||
                                prettyAgentName(data?.agent || event?.event)}
                            </h5>
                          </div>

                          <span
                            className={cx(
                              "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.12em]",
                              tone.pill,
                            )}
                          >
                            {data?.status || "event"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          {data?.description ||
                            `${prettyAgentName(agentKey)} emitted a backend stream event.`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
                Waiting for backend stream events...
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
              <Server className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Backend endpoint
              </p>
              <h4 className="text-xl font-black tracking-[-0.04em]">
                /api/plan-trip/stream
              </h4>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <DarkInfo
              label="Current event"
              value={latestEvent?.event || "Waiting"}
            />
            <DarkInfo
              label="Current agent"
              value={prettyAgentName(latestData?.agent || "Backend")}
            />
            <DarkInfo
              label="Status"
              value={latestData?.status || (isPlanning ? "running" : "idle")}
            />
            <DarkInfo
              label="Protocol"
              value="Server-Sent Events over Fetch stream"
            />
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-bold leading-6 text-red-100">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function DarkInfo({ label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-white">{value}</p>
    </div>
  );
}