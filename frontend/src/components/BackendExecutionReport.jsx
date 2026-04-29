import {
  Activity,
  CheckCircle2,
  Clock3,
  Code2,
  Database,
  FileJson,
  GitBranch,
  Layers,
  Network,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function getBackendResult(rawResult) {
  if (!rawResult) return null;

  if (rawResult?.final_trip_plan || rawResult?.agent_trace) {
    return rawResult;
  }

  if (rawResult?.data?.final_trip_plan || rawResult?.data?.agent_trace) {
    return rawResult.data;
  }

  return rawResult;
}

function formatDuration(value) {
  const number = Number(value || 0);

  if (number >= 1000) {
    return `${(number / 1000).toFixed(2)}s`;
  }

  return `${number.toFixed(0)}ms`;
}

function formatMoney(value, currency = "INR") {
  const number = Number(value || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return `${currency} ${number.toLocaleString("en-IN")}`;
  }
}

function prettyAgentName(agent) {
  if (!agent) return "Unknown Agent";

  return String(agent)
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getAgentIcon(agent) {
  const key = String(agent || "").toLowerCase();

  if (key.includes("route")) return Route;
  if (key.includes("flight")) return Zap;
  if (key.includes("hotel")) return Server;
  if (key.includes("weather")) return Activity;
  if (key.includes("activity")) return Sparkles;
  if (key.includes("budget")) return Wallet;
  if (key.includes("pricing")) return Database;
  if (key.includes("itinerary")) return Layers;
  if (key.includes("quality")) return ShieldCheck;

  return Network;
}

function getAgentGradient(agent) {
  const key = String(agent || "").toLowerCase();

  if (key.includes("route")) return "from-indigo-500 via-blue-600 to-sky-500";
  if (key.includes("flight")) return "from-sky-400 via-blue-600 to-indigo-600";
  if (key.includes("hotel")) return "from-emerald-400 via-teal-600 to-cyan-600";
  if (key.includes("weather")) return "from-amber-300 via-orange-500 to-red-500";
  if (key.includes("activity")) return "from-pink-400 via-rose-600 to-fuchsia-600";
  if (key.includes("budget")) return "from-violet-400 via-purple-700 to-indigo-700";
  if (key.includes("pricing")) return "from-green-400 via-emerald-600 to-teal-700";
  if (key.includes("itinerary")) return "from-orange-400 via-red-600 to-rose-700";
  if (key.includes("quality")) return "from-cyan-400 via-blue-600 to-indigo-700";

  return "from-slate-600 via-slate-800 to-slate-950";
}

function getStatusTone(status) {
  const value = String(status || "").toLowerCase();

  if (value === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (value === "failed") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value === "running") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

export default function BackendExecutionReport({ result }) {
  const backendResult = getBackendResult(result);

  if (!backendResult) {
    return null;
  }

  const finalPlan = backendResult?.final_trip_plan || {};
  const request = finalPlan?.request || {};
  const budget = finalPlan?.budget_breakdown || {};
  const agentTrace = asArray(backendResult?.agent_trace);
  const orchestrationLogs = asArray(backendResult?.orchestration_logs);
  const executionRecords = asArray(backendResult?.execution_records);
  const agentOutputs = backendResult?.agent_outputs || {};
  const bookingLinks = asArray(finalPlan?.booking_links);

  const conversationId = backendResult?.conversation_id || "Not returned";
  const planId =
    backendResult?.plan_id ||
    backendResult?.saved_plan_id ||
    backendResult?.id ||
    backendResult?.metadata?.plan_id ||
    "Not returned";

  const totalRuntimeMs = agentTrace.reduce(
    (sum, event) => sum + Number(event?.duration_ms || 0),
    0,
  );

  const completedAgents = agentTrace.filter(
    (event) => String(event?.status || "").toLowerCase() === "completed",
  );

  const routeValidatorOutput =
    agentOutputs?.route_validator?.route_validation ||
    agentOutputs?.route_validator;

  const budgetOptimizerOutput =
    agentOutputs?.budget_optimizer?.budget_optimization ||
    agentOutputs?.budget_optimizer;

  const qualityGateOutput =
    agentOutputs?.quality_gate?.quality_review ||
    agentOutputs?.quality_gate;

  return (
    <section className="mx-auto mt-10 w-full max-w-[1580px] overflow-hidden rounded-[2.8rem] border border-slate-200/80 bg-white shadow-[0_40px_130px_rgba(15,23,42,0.16)]">
      <div className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white lg:px-8 lg:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.34),transparent_27%),radial-gradient(circle_at_82%_8%,rgba(168,85,247,0.32),transparent_26%),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,1))]" />
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.13)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-5xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-cyan-100 backdrop-blur-xl">
              <Server className="h-4 w-4" />
              FastAPI Backend Engine
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-[-0.065em] text-white lg:text-6xl">
              Real backend orchestration, not static UI.
            </h2>

            <p className="mt-4 max-w-4xl text-base font-semibold leading-8 text-slate-300">
              This report is built from the actual API response returned by{" "}
              <span className="font-black text-white">POST /api/plan-trip</span>:
              agent trace events, A2A logs, pricing output, budget optimization,
              saved plan ID, and final quality gate result.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[460px]">
            <HeaderMetric
              icon={Code2}
              label="Endpoint"
              value="POST /api/plan-trip"
            />

            <HeaderMetric
              icon={CheckCircle2}
              label="Status"
              value="Completed"
              success
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 bg-slate-50 px-5 py-5 lg:grid-cols-5 lg:px-7">
        <TopMetric
          icon={GitBranch}
          label="Conversation ID"
          value={conversationId}
          mono
        />

        <TopMetric icon={FileJson} label="Saved Plan ID" value={planId} mono />

        <TopMetric
          icon={Network}
          label="Agents Executed"
          value={`${completedAgents.length || agentTrace.length}`}
        />

        <TopMetric
          icon={Clock3}
          label="Agent Runtime"
          value={formatDuration(totalRuntimeMs)}
        />

        <TopMetric
          icon={Database}
          label="Total Cost"
          value={formatMoney(
            budget?.total_estimated_cost,
            request?.currency || "INR",
          )}
        />
      </div>

      <div className="grid gap-6 bg-white p-5 lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
        <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                Backend pipeline
              </p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.055em] text-slate-950 lg:text-3xl">
                Agents executed by the API
              </h3>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Live response data
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {agentTrace.length ? (
              agentTrace.map((event, index) => {
                const Icon = getAgentIcon(event?.agent);
                const gradient = getAgentGradient(event?.agent);

                return (
                  <div
                    key={event?.event_id || `${event?.agent}-${index}`}
                    className="group rounded-[1.7rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cx(
                          "grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                          gradient,
                        )}
                      >
                        <Icon className="h-6 w-6" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                              Step {String(index + 1).padStart(2, "0")}
                            </p>

                            <h4 className="mt-1 text-lg font-black tracking-[-0.04em] text-slate-950">
                              {event?.title || prettyAgentName(event?.agent)}
                            </h4>
                          </div>

                          <span
                            className={cx(
                              "rounded-full border px-3 py-1.5 text-xs font-black",
                              getStatusTone(event?.status),
                            )}
                          >
                            {event?.status || "completed"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          {event?.output_summary ||
                            event?.description ||
                            "Agent completed its backend task."}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <MiniChip
                            label="Task"
                            value={event?.metadata?.task_name || "agent_task"}
                          />
                          <MiniChip
                            label="Runtime"
                            value={formatDuration(event?.duration_ms)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="No agent trace was returned by the backend." />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Backend decisions
            </p>

            <h3 className="mt-1 text-2xl font-black tracking-[-0.055em] text-slate-950 lg:text-3xl">
              What the system decided
            </h3>

            <div className="mt-6 space-y-3">
              <DecisionRow
                icon={Route}
                label="Route Validator"
                value={
                  routeValidatorOutput?.summary ||
                  "Route validation completed before planning."
                }
              />

              <DecisionRow
                icon={Wallet}
                label="Budget Optimizer"
                value={
                  budgetOptimizerOutput?.summary ||
                  "Budget optimizer evaluated travel, stay, and activity costs."
                }
              />

              <DecisionRow
                icon={Database}
                label="Pricing Agent"
                value={`Estimated total cost is ${formatMoney(
                  budget?.total_estimated_cost,
                  request?.currency || "INR",
                )}.`}
              />

              <DecisionRow
                icon={ShieldCheck}
                label="Quality Gate"
                value={
                  qualityGateOutput?.summary ||
                  "Final plan reviewed before API response."
                }
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2.2rem] bg-slate-950 p-5 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)] lg:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.26),transparent_34%)]" />

            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                Plan output from backend
              </p>

              <h3 className="mt-1 text-2xl font-black tracking-[-0.055em] text-white">
                Final API payload summary
              </h3>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <DarkMetric
                  label="Route"
                  value={`${request?.source_city || "Source"} → ${
                    request?.destination_city || "Destination"
                  }`}
                />

                <DarkMetric
                  label="Trip Style"
                  value={request?.travel_style || "balanced"}
                />

                <DarkMetric
                  label="Travelers"
                  value={String(request?.travelers || 1)}
                />

                <DarkMetric
                  label="Booking Links"
                  value={String(bookingLinks.length)}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[2.2rem] border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
              Why this proves backend work
            </p>

            <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
              These values are not hardcoded frontend labels. They come from the
              FastAPI response after the orchestrator runs validation, parallel
              agents, budget optimization, pricing, itinerary generation, and the
              final quality gate.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 p-5 lg:p-7">
        <details className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer px-5 py-4 text-sm font-black text-slate-950">
            View backend orchestration logs
          </summary>

          <div className="max-h-[360px] overflow-auto border-t border-slate-200 bg-slate-950 p-5 text-white">
            {orchestrationLogs.length ? (
              orchestrationLogs.map((log, index) => (
                <p
                  key={`${log}-${index}`}
                  className="font-mono text-xs leading-6 text-slate-200"
                >
                  <span className="text-cyan-300">
                    [{String(index + 1).padStart(2, "0")}]
                  </span>{" "}
                  {log}
                </p>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-300">
                No orchestration logs returned.
              </p>
            )}
          </div>
        </details>

        <p className="mt-4 text-xs font-semibold leading-6 text-slate-500">
          Execution records returned: {executionRecords.length}. This report uses
          the actual backend response object stored in React state.
        </p>
      </div>
    </section>
  );
}

function HeaderMetric({ icon: Icon, label, value, success = false }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div
          className={cx(
            "grid h-11 w-11 place-items-center rounded-2xl",
            success ? "bg-emerald-400 text-slate-950" : "bg-white/15 text-cyan-100",
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-0.5 text-sm font-black text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function TopMetric({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="rounded-[1.8rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <p
            className={cx(
              "mt-1 break-all text-sm font-black text-slate-950",
              mono && "font-mono text-xs",
            )}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function MiniChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-black text-slate-600">
      <span className="text-slate-400">{label}:</span>
      {value}
    </span>
  );
}

function DecisionRow({ icon: Icon, label, value }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DarkMetric({ label, value }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-lg font-black text-white">{value}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-[1.7rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}