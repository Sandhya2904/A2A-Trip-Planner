import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LockKeyhole,
  Save,
  Sparkles,
} from "lucide-react";

import { saveTripPlan } from "../api/userStorageApi";

function getCurrentUser() {
  try {
    const rawUser = localStorage.getItem("a2a_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function getPlanId(finalPlan, planId) {
  return (
    planId ||
    finalPlan?.plan_id ||
    finalPlan?.saved_plan_id ||
    finalPlan?.id ||
    finalPlan?.metadata?.plan_id ||
    finalPlan?.metadata?.saved_plan_id ||
    ""
  );
}

function getTripTitle(finalPlan, request) {
  const sourceCity =
    finalPlan?.request?.source_city || request?.source_city || "Source";

  const destinationCity =
    finalPlan?.request?.destination_city ||
    request?.destination_city ||
    "Destination";

  return `${sourceCity} to ${destinationCity}`;
}

export default function SaveTripButton({
  finalPlan,
  request,
  planId,
  onSaved,
  onRequireLogin,
}) {
  const [user, setUser] = useState(getCurrentUser);
  const [status, setStatus] = useState("idle");

  const pendingSaveAfterLoginRef = useRef(false);
  const finalPlanRef = useRef(finalPlan);
  const requestRef = useRef(request);
  const planIdRef = useRef(planId);

  useEffect(() => {
    finalPlanRef.current = finalPlan;
    requestRef.current = request;
    planIdRef.current = planId;
  }, [finalPlan, request, planId]);

  const performSaveTrip = useCallback(() => {
    const activePlan = finalPlanRef.current;
    const activeRequest = requestRef.current;
    const activePlanId = getPlanId(activePlan, planIdRef.current);

    if (!activePlan) return;

    try {
      setStatus("saving");

      const savedTrip = saveTripPlan({
        tripPlan: activePlan,
        request: activeRequest || activePlan?.request || {},
        title: getTripTitle(activePlan, activeRequest),
        backendPlanId: activePlanId || null,
      });

      pendingSaveAfterLoginRef.current = false;
      setStatus("saved");

      if (typeof onSaved === "function") {
        onSaved(savedTrip);
      }

      window.dispatchEvent(
        new CustomEvent("a2a_saved_trips_changed", {
          detail: savedTrip,
        }),
      );

      setTimeout(() => {
        setStatus("idle");
      }, 2600);
    } catch (error) {
      console.error("Trip save failed:", error);
      setStatus("error");

      setTimeout(() => {
        setStatus("idle");
      }, 2600);
    }
  }, [onSaved]);

  function openLoginForSaving() {
    pendingSaveAfterLoginRef.current = true;
    setStatus("login_required");

    if (typeof onRequireLogin === "function") {
      onRequireLogin();
      return;
    }

    window.dispatchEvent(
      new CustomEvent("a2a_open_auth", {
        detail: {
          reason: "save_trip",
          source: "save_trip_button",
        },
      }),
    );
  }

  function handleSaveTrip() {
    if (!finalPlan) return;

    const currentUser = getCurrentUser();
    setUser(currentUser);

    if (!currentUser) {
      openLoginForSaving();
      return;
    }

    performSaveTrip();
  }

  useEffect(() => {
    function refreshUserAndMaybeSave() {
      const currentUser = getCurrentUser();
      setUser(currentUser);

      if (currentUser && pendingSaveAfterLoginRef.current) {
        performSaveTrip();
      }
    }

    window.addEventListener("storage", refreshUserAndMaybeSave);
    window.addEventListener("a2a_auth_changed", refreshUserAndMaybeSave);

    return () => {
      window.removeEventListener("storage", refreshUserAndMaybeSave);
      window.removeEventListener("a2a_auth_changed", refreshUserAndMaybeSave);
    };
  }, [performSaveTrip]);

  useEffect(() => {
    setUser(getCurrentUser());
    setStatus("idle");
    pendingSaveAfterLoginRef.current = false;
  }, [finalPlan]);

  if (!finalPlan) {
    return null;
  }

  const baseClass =
    "inline-flex min-h-[52px] min-w-[160px] items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-black shadow-xl transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70";

  if (!user) {
    return (
      <button
        type="button"
        onClick={handleSaveTrip}
        className={`${baseClass} border-slate-200 bg-white text-slate-950 hover:bg-blue-50`}
        title="Login to save this trip"
      >
        <LockKeyhole className="h-4 w-4 shrink-0 text-blue-600" />
        <span className="whitespace-nowrap">
          {status === "login_required" ? "Login Opened" : "Login to Save"}
        </span>
      </button>
    );
  }

  if (status === "saving") {
    return (
      <button
        type="button"
        disabled
        className={`${baseClass} border-blue-100 bg-white text-slate-950`}
        title="Saving trip"
      >
        <Sparkles className="h-4 w-4 shrink-0 animate-pulse text-blue-600" />
        <span className="whitespace-nowrap">Saving...</span>
      </button>
    );
  }

  if (status === "saved") {
    return (
      <button
        type="button"
        onClick={handleSaveTrip}
        className={`${baseClass} border-emerald-200 bg-emerald-50 text-emerald-700`}
        title="Trip saved"
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
        <span className="whitespace-nowrap">Trip Saved</span>
      </button>
    );
  }

  if (status === "error") {
    return (
      <button
        type="button"
        onClick={handleSaveTrip}
        className={`${baseClass} border-red-200 bg-red-50 text-red-700`}
        title="Try saving again"
      >
        <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
        <span className="whitespace-nowrap">Try Again</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleSaveTrip}
      className={`${baseClass} border-slate-200 bg-white text-slate-950 hover:bg-blue-50`}
      title="Save this trip"
    >
      <Save className="h-4 w-4 shrink-0 text-blue-600" />
      <span className="whitespace-nowrap">Save Trip</span>
    </button>
  );
}