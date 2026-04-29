import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  ChevronRight,
  MapPinned,
  Navigation,
  Search,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";

import TripTypeTabs from "./TripTypeTabs";

const INTERESTS = ["local food", "culture", "adventure", "beaches", "nightlife"];

const TRAVEL_STYLES = [
  { id: "budget", label: "Budget" },
  { id: "balanced", label: "Balanced" },
  { id: "premium", label: "Premium" },
];

function normalizeCity(value) {
  const clean = String(value || "").trim();
  if (!clean) return "";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function cityCode(city) {
  const clean = normalizeCity(city).toLowerCase();

  const codes = {
    kolkata: "CCU",
    calcutta: "CCU",
    bengaluru: "BLR",
    bangalore: "BLR",
    delhi: "DEL",
    mumbai: "BOM",
    chennai: "MAA",
    hyderabad: "HYD",
    goa: "GOI",
    pune: "PNQ",
    jaipur: "JAI",
    kanpur: "KNU",
    kano: "KAN",
    dubai: "DXB",
    london: "LON",
    paris: "PAR",
    tokyo: "TYO",
    singapore: "SIN",
    bangkok: "BKK",
  };

  if (!clean) return "CITY";
  return codes[clean] || clean.slice(0, 3).toUpperCase();
}

function formatDateParts(value) {
  if (!value) {
    return {
      day: "--",
      monthYear: "Select",
      weekday: "Choose date",
    };
  }

  try {
    const date = new Date(value);

    return {
      day: new Intl.DateTimeFormat("en-IN", { day: "2-digit" }).format(date),
      monthYear: new Intl.DateTimeFormat("en-IN", {
        month: "short",
        year: "2-digit",
      }).format(date),
      weekday: new Intl.DateTimeFormat("en-IN", {
        weekday: "long",
      }).format(date),
    };
  } catch {
    return {
      day: "--",
      monthYear: "Select",
      weekday: "Choose date",
    };
  }
}

function formatBudget(value) {
  const numeric = Number(value || 0);
  if (!numeric) return "Not set";
  return new Intl.NumberFormat("en-IN").format(numeric);
}

function tripTypeLabel(type) {
  if (type === "round_trip") return "Round trip";
  if (type === "multi_city") return "Multi city";
  return "One way";
}

export default function BookingPanelSimple({
  form,
  tripLength,
  productMode,
  isPlanning,
  error,
  onSubmit,
  onFieldChange,
  onToggleInterest,
  onReset,
  onTripTypeChange,
}) {
  const [localForm, setLocalForm] = useState(() => ({
    ...form,
    source_city: form.source_city || "Kolkata",
    destination_city: form.destination_city || "Bengaluru",
    start_date: form.start_date || "2026-05-19",
    end_date: form.end_date || "2026-05-23",
    budget: form.budget || 35000,
    travelers: form.travelers || 1,
    travel_style: form.travel_style || "balanced",
    trip_type: form.trip_type || "one_way",
    interests: Array.isArray(form.interests) ? form.interests : [],
  }));

  useEffect(() => {
    setLocalForm((current) => ({
      ...current,
      trip_type: form.trip_type || current.trip_type || "one_way",
      product_category: form.product_category || current.product_category,
    }));
  }, [form.trip_type, form.product_category]);

  const sourceCity = normalizeCity(localForm.source_city);
  const destinationCity = normalizeCity(localForm.destination_city);

  const routeTitle =
    localForm.trip_type === "round_trip"
      ? `${sourceCity || "Source"} → ${destinationCity || "Destination"} → ${
          sourceCity || "Source"
        }`
      : `${sourceCity || "Source"} → ${destinationCity || "Destination"}`;

  const routeCode =
    localForm.trip_type === "round_trip"
      ? `${cityCode(sourceCity)} → ${cityCode(destinationCity)} → ${cityCode(
          sourceCity,
        )}`
      : `${cityCode(sourceCity)} → ${cityCode(destinationCity)}`;

  function updateField(name, value) {
    setLocalForm((current) => ({
      ...current,
      [name]: value,
    }));

    onFieldChange?.(name, value);
  }

  function handleTripTypeChange(type) {
    setLocalForm((current) => ({
      ...current,
      trip_type: type,
      end_date:
        type === "round_trip" && !current.end_date
          ? current.start_date
          : current.end_date,
    }));

    onTripTypeChange?.(type);
  }

  function handleSwap() {
    const nextSource = localForm.destination_city;
    const nextDestination = localForm.source_city;

    updateField("source_city", nextSource);
    updateField("destination_city", nextDestination);
  }

  function toggleInterest(interest) {
    const current = Array.isArray(localForm.interests)
      ? localForm.interests
      : [];

    const next = current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest];

    setLocalForm((old) => ({
      ...old,
      interests: next,
    }));

    onToggleInterest?.(interest);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      ...form,
      ...localForm,
      source_city: normalizeCity(localForm.source_city),
      destination_city: normalizeCity(localForm.destination_city),
      source_location: null,
      destination_location: null,
      start_date: localForm.start_date,
      end_date: localForm.end_date || localForm.start_date,
      budget: Number(localForm.budget || 0),
      travelers: Number(localForm.travelers || 1),
      interests: Array.isArray(localForm.interests) ? localForm.interests : [],
      travel_style: localForm.travel_style || "balanced",
      trip_type: localForm.trip_type || "one_way",
    };

    onSubmit?.(payload);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto w-full max-w-[1580px] rounded-[2.5rem] border border-white/65 bg-white/95 p-4 shadow-[0_35px_120px_rgba(15,23,42,0.22)] backdrop-blur-3xl sm:p-5 lg:p-7"
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TripTypeTabs
              activeTripType={localForm.trip_type || "one_way"}
              onChange={handleTripTypeChange}
            />

            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700 ring-1 ring-slate-200">
              <Sparkles className="h-4 w-4 text-blue-600" />
              {productMode?.badge || "Trip planner"}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="grid lg:grid-cols-[minmax(0,1.25fr)_84px_minmax(0,1.25fr)_1fr_1fr]">
              <CityInput
                label="From"
                icon={Navigation}
                value={localForm.source_city}
                placeholder="Type any source city"
                onChange={(value) => updateField("source_city", value)}
              />

              <div className="flex items-center justify-center border-b border-slate-200 bg-white px-3 py-4 lg:border-b-0 lg:border-r">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-md transition hover:bg-blue-50 active:scale-[0.98]"
                >
                  <ArrowLeftRight className="h-5 w-5" />
                </button>
              </div>

              <CityInput
                label="To"
                icon={MapPinned}
                value={localForm.destination_city}
                placeholder="Type any destination city"
                onChange={(value) => updateField("destination_city", value)}
              />

              <DateInput
                label="Departure"
                value={localForm.start_date}
                helper={formatDateParts(localForm.start_date).weekday}
                onChange={(value) => updateField("start_date", value)}
              />

              <DateInput
                label={
                  localForm.trip_type === "one_way"
                    ? "Return"
                    : "Return date"
                }
                value={localForm.end_date}
                helper={
                  localForm.trip_type === "one_way"
                    ? "Optional for one-way planning"
                    : "Return journey"
                }
                onChange={(value) => updateField("end_date", value)}
              />
            </div>

            <div className="grid gap-4 border-t border-slate-200 p-4 lg:grid-cols-[1.3fr_1fr] lg:p-5">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Travellers &amp; class
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600">
                      Travellers
                    </span>
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                      <Users className="h-4 w-4 text-blue-600" />
                      <input
                        type="number"
                        min="1"
                        value={localForm.travelers}
                        onChange={(event) =>
                          updateField(
                            "travelers",
                            event.target.value === ""
                              ? ""
                              : Number(event.target.value),
                          )
                        }
                        className="w-full border-none bg-transparent text-lg font-black text-slate-950 outline-none"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600">
                      Travel class
                    </span>
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-bold text-slate-950">
                      Economy / Premium Economy
                    </div>
                  </label>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Budget
                </div>

                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={String(localForm.budget ?? "")}
                  onChange={(event) =>
                    updateField(
                      "budget",
                      event.target.value === ""
                        ? ""
                        : Number(event.target.value),
                    )
                  }
                  className="w-full border-none bg-transparent text-2xl font-black tracking-[-0.04em] text-slate-950 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <RouteSummary
          routeTitle={routeTitle}
          routeCode={routeCode}
          tripLength={tripLength}
          tripType={localForm.trip_type}
          travelStyle={localForm.travel_style}
          budget={localForm.budget}
        />
      </div>

      <div className="mt-5 rounded-[2rem] border border-slate-200 bg-slate-50/90 p-4 lg:p-5">
        <div className="grid gap-5 xl:grid-cols-[1fr_auto] xl:items-start">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Interests
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {INTERESTS.map((interest) => {
                const active = localForm.interests?.includes(interest);

                return (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={[
                      "rounded-full border px-3 py-2 text-sm font-black capitalize transition",
                      active
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    {interest}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Travel style
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {TRAVEL_STYLES.map((style) => {
                const active = localForm.travel_style === style.id;

                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => updateField("travel_style", style.id)}
                    className={[
                      "rounded-2xl border px-4 py-3 text-sm font-black transition",
                      active
                        ? "border-blue-200 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-blue-50",
                    ].join(" ")}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:min-w-[240px]">
            <button
              type="submit"
              disabled={isPlanning}
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-700 px-8 py-4 text-lg font-black text-white shadow-[0_20px_55px_rgba(37,99,235,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(37,99,235,0.42)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPlanning ? (
                <>
                  <Search className="h-5 w-5 animate-pulse" />
                  Planning...
                </>
              ) : (
                <>
                  Search &amp; plan
                  <ChevronRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </>
              )}
            </button>

            {typeof onReset === "function" ? (
              <button
                type="button"
                disabled={isPlanning}
                onClick={onReset}
                className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reset search
              </button>
            ) : null}
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
      </div>
    </form>
  );
}

function CityInput({ label, icon: Icon, value, placeholder, onChange }) {
  return (
    <div className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-blue-600" />
      </div>

      <label className="mt-4 block">
        <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
          City / country
        </span>

        <input
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-xl font-black tracking-[-0.04em] text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
        />
      </label>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
          Current city
        </p>

        <p className="mt-1 break-words text-2xl font-black tracking-[-0.05em] text-slate-950">
          {normalizeCity(value) || "Not selected"}
        </p>

        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
          Manual city input. Type any city or country worldwide.
        </p>
      </div>
    </div>
  );
}

function DateInput({ label, value, helper, onChange }) {
  const dateParts = formatDateParts(value);

  return (
    <div className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
        <span>{label}</span>
        <CalendarDays className="h-4 w-4 text-blue-600" />
      </div>

      <div className="mt-3 flex items-end gap-2 text-slate-950">
        <span className="text-[2.5rem] font-black leading-none tracking-[-0.08em] xl:text-[3rem]">
          {dateParts.day}
        </span>
        <span className="pb-2 text-lg font-semibold tracking-[-0.04em] xl:text-2xl">
          {dateParts.monthYear}
        </span>
      </div>

      <p className="mt-3 min-h-[48px] text-sm font-semibold text-slate-500">
        {helper}
      </p>

      <input
        type="date"
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-300 focus:bg-white"
      />
    </div>
  );
}

function RouteSummary({
  routeTitle,
  routeCode,
  tripLength,
  tripType,
  travelStyle,
  budget,
}) {
  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50 p-5 shadow-xl shadow-blue-950/5">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
        Route summary
      </p>

      <div className="mt-3 text-[1.65rem] font-black leading-[1] tracking-[-0.05em] text-slate-950 sm:text-[1.85rem]">
        {routeTitle.split("→").map((part, index) => (
          <div key={`${part}-${index}`}>
            {index > 0 ? <div className="my-1 text-slate-300">→</div> : null}
            {part.trim()}
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
        {tripLength} day{tripLength > 1 ? "s" : ""} · {tripTypeLabel(tripType)}
      </p>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700">
        {routeCode}
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-white px-4 py-3">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Trip budget
        </div>
        <div className="mt-1 break-words text-xl font-black text-slate-950">
          ₹ {formatBudget(budget)}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          Travel style
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {TRAVEL_STYLES.map((style) => {
            const active = travelStyle === style.id;

            return (
              <div
                key={style.id}
                className={[
                  "rounded-2xl border px-2 py-3 text-center text-sm font-black",
                  active
                    ? "border-blue-200 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-700",
                ].join(" ")}
              >
                {style.label}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}