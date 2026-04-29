import { useEffect, useState } from "react";
import {
  CalendarDays,
  Eye,
  Filter,
  Loader2,
  MapPinned,
  Plane,
  RefreshCcw,
  Search,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";

import {
  deleteSavedTripPlan,
  getSavedTripPlan,
  listSavedTripPlans,
} from "../api/tripApi";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function formatCurrency(currency, amount) {
  const value = Number(amount || 0);

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency || "INR"} ${value.toLocaleString("en-IN")}`;
  }
}

function formatDate(value) {
  if (!value) return "Not available";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function SavedTripsPanel({ onLoadSavedTrip }) {
  const [savedTrips, setSavedTrips] = useState([]);
  const [filters, setFilters] = useState({
    limit: 10,
    source_city: "",
    destination_city: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activePlanId, setActivePlanId] = useState("");
  const [error, setError] = useState("");

  async function loadSavedTrips() {
    setIsLoading(true);
    setError("");

    try {
      const trips = await listSavedTripPlans({
        limit: filters.limit,
        source_city: filters.source_city.trim() || undefined,
        destination_city: filters.destination_city.trim() || undefined,
      });

      setSavedTrips(trips);
    } catch (loadError) {
      setError(loadError?.message || "Failed to load saved trips.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleViewTrip(planId) {
    setActivePlanId(planId);
    setError("");

    try {
      const savedPlan = await getSavedTripPlan(planId);

      if (onLoadSavedTrip) {
        onLoadSavedTrip(savedPlan);
      }
    } catch (loadError) {
      setError(loadError?.message || "Failed to open saved trip.");
    } finally {
      setActivePlanId("");
    }
  }

  async function handleDeleteTrip(planId) {
    const shouldDelete = window.confirm(
      "Delete this saved trip plan? This cannot be undone.",
    );

    if (!shouldDelete) return;

    setActivePlanId(planId);
    setError("");

    try {
      await deleteSavedTripPlan(planId);
      setSavedTrips((currentTrips) =>
        currentTrips.filter((trip) => trip.plan_id !== planId),
      );
    } catch (deleteError) {
      setError(deleteError?.message || "Failed to delete saved trip.");
    } finally {
      setActivePlanId("");
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function clearFilters() {
    setFilters({
      limit: 10,
      source_city: "",
      destination_city: "",
    });
  }

  useEffect(() => {
    loadSavedTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-[0_34px_100px_rgba(15,23,42,0.08)] lg:p-8">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
            <MapPinned className="h-4 w-4" />
            Saved Trips
          </div>

          <h2 className="mt-5 text-4xl font-black tracking-[-0.06em] text-slate-950 lg:text-5xl">
            Your generated travel plans.
          </h2>

          <p className="mt-3 max-w-3xl text-base font-medium leading-8 text-slate-600">
            Browse, filter, open, or delete trip plans saved by the backend
            persistence layer.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSavedTrips}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <div className="mt-7 rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
        <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          <Filter className="h-4 w-4 text-blue-600" />
          Filters
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.8fr_1fr_1fr_auto]">
          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Limit
            </span>
            <select
              value={filters.limit}
              onChange={(event) => updateFilter("limit", event.target.value)}
              className="mt-3 w-full border-none bg-transparent text-lg font-black text-slate-950 outline-none"
            >
              <option value="5">5 trips</option>
              <option value="10">10 trips</option>
              <option value="20">20 trips</option>
              <option value="50">50 trips</option>
            </select>
          </label>

          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Source City
            </span>
            <input
              value={filters.source_city}
              onChange={(event) =>
                updateFilter("source_city", event.target.value)
              }
              placeholder="Example: Delhi"
              className="mt-3 w-full border-none bg-transparent text-lg font-black text-slate-950 outline-none placeholder:text-slate-300"
            />
          </label>

          <label className="rounded-3xl border border-slate-200 bg-white p-4">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Destination City
            </span>
            <input
              value={filters.destination_city}
              onChange={(event) =>
                updateFilter("destination_city", event.target.value)
              }
              placeholder="Example: Goa"
              className="mt-3 w-full border-none bg-transparent text-lg font-black text-slate-950 outline-none placeholder:text-slate-300"
            />
          </label>

          <div className="flex gap-3 lg:items-end">
            <button
              type="button"
              onClick={loadSavedTrips}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
            >
              <Search className="h-4 w-4" />
              Apply
            </button>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="mt-7">
        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center rounded-[2rem] border border-slate-200 bg-slate-50">
            <div className="text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
              <p className="mt-4 font-black text-slate-950">
                Loading saved trips...
              </p>
            </div>
          </div>
        ) : savedTrips.length === 0 ? (
          <EmptySavedTrips />
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {savedTrips.map((trip) => (
              <SavedTripCard
                key={trip.plan_id}
                trip={trip}
                activePlanId={activePlanId}
                onView={handleViewTrip}
                onDelete={handleDeleteTrip}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function EmptySavedTrips() {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
        <Plane className="h-8 w-8" />
      </div>

      <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
        No saved trips found.
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500">
        Generate a trip plan first, then refresh this section to see it saved
        here.
      </p>
    </div>
  );
}

function SavedTripCard({ trip, activePlanId, onView, onDelete }) {
  const isActive = activePlanId === trip.plan_id;
  const isOverBudget = Number(trip.remaining_budget || 0) < 0;

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/5 transition hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.12)]">
      <div className="bg-gradient-to-r from-slate-950 to-blue-800 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-200">
              Saved Plan
            </p>

            <h3 className="mt-2 text-3xl font-black tracking-[-0.05em]">
              {trip.source_city || "Unknown"} →{" "}
              {trip.destination_city || "Unknown"}
            </h3>
          </div>

          <span
            className={cx(
              "rounded-full px-3 py-1.5 text-xs font-black",
              isOverBudget
                ? "bg-red-400/20 text-red-100"
                : "bg-emerald-400/20 text-emerald-100",
            )}
          >
            {isOverBudget ? "Over budget" : "Saved"}
          </span>
        </div>

        <p className="mt-4 max-w-xl text-sm font-semibold text-blue-100">
          Plan ID: <span className="font-black text-white">{trip.plan_id}</span>
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <MiniDetail
            icon={CalendarDays}
            label="Travel Dates"
            value={`${formatDate(trip.start_date)} → ${formatDate(
              trip.end_date,
            )}`}
          />
          <MiniDetail
            icon={Users}
            label="Travellers"
            value={trip.travelers || "Not set"}
          />
          <MiniDetail
            icon={Wallet}
            label="Budget"
            value={formatCurrency(trip.currency, trip.budget)}
          />
          <MiniDetail
            icon={Wallet}
            label="Estimated Cost"
            value={formatCurrency(trip.currency, trip.total_estimated_cost)}
          />
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            Saved At
          </div>
          <div className="mt-1 text-sm font-black text-slate-800">
            {formatDate(trip.saved_at)}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => onView(trip.plan_id)}
            disabled={isActive}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isActive ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            Open Plan
          </button>

          <button
            type="button"
            onClick={() => onDelete(trip.plan_id)}
            disabled={isActive}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3 text-sm font-black text-red-700 transition hover:-translate-y-0.5 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function MiniDetail({ icon: Icon, label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </div>

      <div className="mt-2 text-base font-black text-slate-950">{value}</div>
    </div>
  );
}