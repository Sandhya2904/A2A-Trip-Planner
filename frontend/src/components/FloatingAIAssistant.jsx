import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clipboard,
  Copy,
  Hotel,
  Loader2,
  MapPinned,
  MessageCircle,
  Plane,
  Route,
  Send,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react";

import { askAITravelAssistant, buildTripContext } from "../api/aiChatApi";

const QUICK_ACTIONS = [
  {
    icon: Route,
    label: "Check my route",
    helper: "Best way to travel",
    prompt: "Check if this route is realistic and tell me the best travel mode.",
  },
  {
    icon: Wallet,
    label: "Lower my budget",
    helper: "Save without ruining the trip",
    prompt:
      "How can I make this trip cheaper without ruining the experience?",
  },
  {
    icon: Hotel,
    label: "Help me choose stays",
    helper: "Hotels and stay advice",
    prompt:
      "Help me choose better stays for this trip based on my budget and destination.",
  },
  {
    icon: MapPinned,
    label: "Improve my plan",
    helper: "Better itinerary ideas",
    prompt: "Improve this trip plan and tell me the most useful changes.",
  },
  {
    icon: Clipboard,
    label: "Trip checklist",
    helper: "Packing and documents",
    prompt: "Create a practical packing and document checklist for this trip.",
  },
  {
    icon: Sparkles,
    label: "Suggest for me",
    helper: "Let AI guide me",
    prompt: "Suggest the best next steps for my current trip plan.",
  },
];

function cleanAssistantReply(text) {
  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .trim();
}

function formatTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function getTripSummary(tripContext) {
  const source = tripContext?.source_city || "";
  const destination = tripContext?.destination_city || "";
  const budget = tripContext?.budget || "";
  const currency = tripContext?.currency || "INR";

  if (!source && !destination) {
    return "Ask about routes, hotels, flights, budget or trip planning";
  }

  return `${source || "Source"} → ${destination || "Destination"}${
    budget ? ` · ${currency} ${budget}` : ""
  }`;
}

function MessageText({ text }) {
  const lines = String(text || "").split("\n");

  return (
    <div className="space-y-3">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={index} className="h-1" />;
        }

        const isNumbered = /^\d+\./.test(trimmed);
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("• ");
        const isHeading =
          trimmed.endsWith(":") ||
          trimmed.toLowerCase().includes("reality check") ||
          trimmed.toLowerCase().includes("best recommendation") ||
          trimmed.toLowerCase().includes("action steps") ||
          trimmed.toLowerCase().includes("budget") ||
          trimmed.toLowerCase().includes("documents") ||
          trimmed.toLowerCase().includes("route");

        if (isHeading) {
          return (
            <p
              key={index}
              className="pt-1 text-[16px] font-black leading-7 tracking-[-0.025em] text-slate-950"
            >
              {trimmed}
            </p>
          );
        }

        if (isBullet || isNumbered) {
          return (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] font-semibold leading-7 text-slate-700"
            >
              {trimmed}
            </div>
          );
        }

        return (
          <p
            key={index}
            className="text-[15px] font-medium leading-8 text-slate-700"
          >
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-900 [animation-delay:-0.2s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-600 [animation-delay:-0.1s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400" />
    </div>
  );
}

function FloatingLauncher({ onClick }) {
  return (
    <div className="fixed bottom-6 right-6 z-[150]">
      <button
        type="button"
        onClick={onClick}
        aria-label="Open A2A trip support"
        className="group relative grid h-16 w-16 place-items-center rounded-full bg-[#17242d] text-white shadow-[0_20px_60px_rgba(2,6,23,0.38)] ring-1 ring-black/5 transition duration-300 hover:scale-[1.04] hover:bg-[#101c24] active:scale-[0.98]"
      >
        <span className="absolute inset-0 rounded-full bg-white/[0.06]" />
        <span className="absolute -inset-1 rounded-full bg-slate-900/10 blur-xl" />
        <span className="relative grid h-16 w-16 place-items-center rounded-full">
          <MessageCircle className="h-6 w-6 stroke-[2.2]" />
        </span>

        <span className="absolute bottom-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]" />
        </span>
      </button>

    
    </div>
  );
}

export default function FloatingAIAssistant({
  form,
  result,
  finalPlan,
  productMode,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState("home");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);

  const inputRef = useRef(null);
  const loadingRef = useRef(null);
  const latestAssistantRef = useRef(null);

  const tripContext = useMemo(() => {
    return buildTripContext({
      form,
      result,
      finalPlan,
      productMode,
    });
  }, [form, result, finalPlan, productMode]);

  const tripSummary = useMemo(() => {
    return getTripSummary(tripContext);
  }, [tripContext]);

  useEffect(() => {
    if (isOpen && screen === "chat") {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 180);
    }
  }, [isOpen, screen]);

  useEffect(() => {
    if (isLoading) {
      setTimeout(() => {
        loadingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
    }
  }, [isLoading]);

  async function sendMessage(customMessage = "") {
    const userText = String(customMessage || message).trim();
    if (!userText || isLoading) return;

    setScreen("chat");

    const nextHistory = [
      ...chatHistory,
      {
        role: "user",
        content: userText,
        time: formatTime(),
      },
    ];

    setChatHistory(nextHistory);
    setMessage("");
    setIsLoading(true);

    try {
      const payloadHistory = nextHistory
        .filter((item) => item.role === "user" || item.role === "assistant")
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: item.content,
        }));

      const response = await askAITravelAssistant({
        message: userText,
        tripContext,
        history: payloadHistory,
      });

      const replyText = cleanAssistantReply(
        response?.reply ||
          response?.message ||
          "I generated a response, but it looks empty.",
      );

      setChatHistory((current) => [
        ...current,
        {
          role: "assistant",
          content: replyText,
          time: formatTime(),
          model: response?.model,
        },
      ]);

      setTimeout(() => {
        latestAssistantRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } catch (error) {
      setChatHistory((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error?.message ||
            "Sorry, I could not get a response right now.",
          time: formatTime(),
        },
      ]);

      setTimeout(() => {
        latestAssistantRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 150);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  async function copyMessage(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 1300);
    } catch {
      setCopiedIndex(null);
    }
  }

  function clearChat() {
    setChatHistory([]);
    setScreen("home");
    setMessage("");
  }

  if (!isOpen) {
    return <FloatingLauncher onClick={() => setIsOpen(true)} />;
  }

  return (
    <section className="fixed bottom-5 right-5 z-[150] h-[min(86vh,820px)] w-[min(540px,calc(100vw-28px))] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_35px_120px_rgba(15,23,42,0.42)]">
      <div className="flex h-full flex-col bg-white">
        <header className="border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {screen === "chat" ? (
                <button
                  type="button"
                  onClick={() => setScreen("home")}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                  title="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : (
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-950">
                  <Plane className="h-5 w-5" />
                </div>
              )}

              <div className="min-w-0">
                <h3 className="truncate text-xl font-black tracking-[-0.04em] text-slate-950">
                  A2A Trip Support
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
                  <p className="text-sm font-bold text-emerald-700">Online</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {screen === "home" ? (
          <main className="flex-1 overflow-y-auto bg-white px-5 py-7">
            <section className="pb-6">
              <p className="text-4xl font-black leading-[1.05] tracking-[-0.06em] text-slate-950">
                Hey <span className="inline-block">👋</span>
              </p>

              <h2 className="mt-2 text-4xl font-black leading-[1.05] tracking-[-0.06em] text-slate-950">
                How can we help?
              </h2>

              <p className="mt-4 max-w-md text-base font-semibold leading-8 text-slate-500">
                Ask about your route, hotels, flights, budget, documents,
                packing, safety, or anything else before you travel.
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Using your current trip details
              </div>
            </section>

            <button
              type="button"
              onClick={() => setScreen("chat")}
              className="group flex w-full items-center justify-between rounded-2xl border border-slate-950 bg-white px-5 py-4 text-left transition hover:bg-slate-950 hover:text-white"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-950 transition group-hover:bg-white group-hover:text-slate-950">
                  <Bot className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-lg font-black">Ask a question</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500 group-hover:text-white/70">
                    {tripSummary}
                  </p>
                </div>
              </div>

              <Send className="h-5 w-5" />
            </button>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_ACTIONS.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => sendMessage(item.prompt)}
                    className="group flex min-h-[92px] items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-xl"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-base font-black leading-5 text-slate-950">
                          {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                          {item.helper}
                        </p>
                      </div>
                    </div>

                    <Send className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-slate-950" />
                  </button>
                );
              })}
            </div>
          </main>
        ) : (
          <>
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">
                Current trip
              </p>
              <p className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-slate-950">
                {tripSummary}
              </p>
            </div>

            <main className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
              {chatHistory.length === 0 && (
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <p className="text-2xl font-black tracking-[-0.04em] text-slate-950">
                    Ask anything.
                  </p>
                  <p className="mt-2 text-base font-semibold leading-8 text-slate-500">
                    I can help with your route, hotels, flights, documents,
                    packing list, budget, safety, or general travel doubts.
                  </p>
                </div>
              )}

              <div className="space-y-5">
                {chatHistory.map((item, index) => {
                  const isUser = item.role === "user";
                  const isLastAssistant =
                    item.role === "assistant" &&
                    index === chatHistory.length - 1;

                  return (
                    <div
                      key={`${item.role}-${index}-${item.time}`}
                      ref={isLastAssistant ? latestAssistantRef : null}
                      className={`flex ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div className="group max-w-[92%]">
                        <div
                          className={`mb-2 flex items-center gap-2 ${
                            isUser ? "justify-end pr-1" : "justify-start pl-1"
                          }`}
                        >
                          {!isUser && (
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-white">
                              <Bot className="h-4 w-4" />
                            </div>
                          )}

                          <p
                            className={`text-sm font-black ${
                              isUser ? "text-slate-400" : "text-slate-950"
                            }`}
                          >
                            {isUser ? "You" : "A2A Support"}
                          </p>

                          <span className="text-xs font-semibold text-slate-400">
                            {item.time}
                          </span>
                        </div>

                        <div
                          className={[
                            "rounded-[1.5rem] px-5 py-4 shadow-sm",
                            isUser
                              ? "rounded-tr-md bg-slate-950 text-white"
                              : "rounded-tl-md border border-slate-200 bg-white text-slate-800",
                          ].join(" ")}
                        >
                          {isUser ? (
                            <p className="whitespace-pre-wrap text-base font-medium leading-8">
                              {item.content}
                            </p>
                          ) : (
                            <MessageText text={item.content} />
                          )}
                        </div>

                        {!isUser && (
                          <button
                            type="button"
                            onClick={() => copyMessage(item.content, index)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 opacity-0 shadow-sm transition hover:text-slate-950 group-hover:opacity-100"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            {copiedIndex === index ? "Copied" : "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div ref={loadingRef} className="flex justify-start">
                    <div className="rounded-[1.5rem] rounded-tl-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                      <div className="mb-3 flex items-center gap-2">
                        <div className="grid h-8 w-8 place-items-center rounded-full bg-slate-950 text-white">
                          <Bot className="h-4 w-4" />
                        </div>
                        <p className="text-sm font-black text-slate-950">
                          A2A Support
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <TypingDots />
                        <p className="text-base font-semibold text-slate-600">
                          Checking your trip details...
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>

            <footer className="border-t border-slate-200 bg-white p-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="Ask about route, hotel, budget, visa, packing..."
                  className="max-h-32 min-h-[58px] w-full resize-none border-0 bg-transparent text-base font-medium leading-7 text-slate-950 outline-none placeholder:text-slate-400"
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={clearChat}
                    className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Trash2 className="h-4 w-4" />
                    New chat
                  </button>

                  <button
                    type="button"
                    onClick={() => sendMessage()}
                    disabled={isLoading || !message.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </button>
                </div>
              </div>

              <div className="mt-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Enter sends · Shift + Enter adds a new line
              </div>
            </footer>
          </>
        )}
      </div>
    </section>
  );
}