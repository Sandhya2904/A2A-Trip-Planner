import { useEffect, useRef, useState } from "react";
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
import LocationAutocomplete from "./LocationAutocomplete";

const TRAVEL_STYLE_OPTIONS = [
  { id: "budget", label: "Budget" },
  { id: "balanced", label: "Balanced" },
  { id: "premium", label: "Premium" },
];

const CITY_CODES = {
  kolkata: "CCU",
  calcutta: "CCU",
  bengaluru: "BLR",
  bangalore: "BLR",
  chennai: "MAA",
  delhi: "DEL",
  mumbai: "BOM",
  bombay: "BOM",
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
  "new york": "NYC",
};

function normalizeCity(value) {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value.name || value.city || value.label || "").trim();
  }

  const clean = String(value || "").trim();
  if (!clean) return "";

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function getLocationCity(location) {
  if (!location || typeof location !== "object") return "";
  return normalizeCity(location.name || location.city || location.label || "");
}

function locationMatchesCity(location, city) {
  const locationCity = getLocationCity(location);
  const cleanCity = normalizeCity(city);

  if (!locationCity || !cleanCity) return false;
  return locationCity.toLowerCase() === cleanCity.toLowerCase();
}

function getCityCode(city) {
  const clean = normalizeCity(city);
  const key = clean.toLowerCase();

  if (!clean) return "CITY";
  return CITY_CODES[key] || clean.slice(0, 3).toUpperCase();
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

function tripTypeLabel(tripType) {
  if (tripType === "round_trip") return "Round trip";
  if (tripType === "multi_city") return "Multi city";
  return "One way";
}

function safeInterests(value) {
  return Array.isArray(value) ? value : [];
}

function getCurrencySymbol(currency) {
  const cleanCurrency = String(currency || "INR").toUpperCase();

  if (cleanCurrency === "USD") return "$";
  if (cleanCurrency === "EUR") return "€";
  if (cleanCurrency === "GBP") return "£";
  if (cleanCurrency === "INR") return "₹";

  return cleanCurrency;
}
function getSavedRuntimeCurrency(fallback = "INR") {
  try {
    const settings = JSON.parse(
      localStorage.getItem("a2a_travel_settings") || "{}",
    );

    return String(settings.currency || fallback || "INR").toUpperCase();
  } catch {
    return String(fallback || "INR").toUpperCase();
  }
}

function buildInitialLocalForm(form) {
  return {
    ...form,
    source_city: normalizeCity(form.source_city || "Kolkata"),
    destination_city: normalizeCity(form.destination_city || "Bengaluru"),
    multi_city_stop: normalizeCity(form.multi_city_stop || "Mumbai"),
    source_location: form.source_location || null,
    destination_location: form.destination_location || null,
    multi_city_stop_location: form.multi_city_stop_location || null,
    travelers: form.travelers || 1,
    budget: form.budget ?? 35000,
    currency: form.currency || "INR",
    start_date: form.start_date || "2026-05-19",
    end_date: form.end_date || form.start_date || "2026-05-19",
    trip_type: form.trip_type || "one_way",
    travel_style: form.travel_style || "balanced",
    interests: Array.isArray(form.interests) ? form.interests : [],
  };
}

export default function BookingPanelFixed({
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
  onSwapRoute,
}) {
  const submitLockRef = useRef(false);
  const budgetInputRef = useRef(null);
  const budgetDraftRef = useRef(String(form?.budget ?? 35000));

  const [localForm, setLocalForm] = useState(() => buildInitialLocalForm(form));
  const [runtimeCurrency, setRuntimeCurrency] = useState(() =>
  getSavedRuntimeCurrency(form?.currency || "INR"),
);

  useEffect(() => {
    setLocalForm((current) => {
      const next = buildInitialLocalForm(form);

      return {
        ...next,
        source_city: current.source_city || normalizeCity(form.source_city),
        destination_city:
          current.destination_city || normalizeCity(form.destination_city),
        multi_city_stop:
          current.multi_city_stop ||
          normalizeCity(form.multi_city_stop || "Mumbai"),
        budget: current.budget ?? next.budget,
      };
    });
  }, [
  form.trip_type,
  form.start_date,
  form.end_date,
  form.budget,
  form.currency,
  form.travelers,
  form.travel_style,
  form.product_category,
]);
useEffect(() => {
  function syncRuntimeCurrency(event) {
    const nextCurrency =
      event.detail?.currency || getSavedRuntimeCurrency(form?.currency || "INR");

    setRuntimeCurrency(String(nextCurrency || "INR").toUpperCase());
  }

  window.addEventListener("a2a_settings_changed", syncRuntimeCurrency);
  window.addEventListener("storage", syncRuntimeCurrency);

  setRuntimeCurrency(getSavedRuntimeCurrency(form?.currency || "INR"));

  return () => {
    window.removeEventListener("a2a_settings_changed", syncRuntimeCurrency);
    window.removeEventListener("storage", syncRuntimeCurrency);
  };
}, [form?.currency]);

  const sourceCity = normalizeCity(localForm.source_city);
  const destinationCity = normalizeCity(localForm.destination_city);
  const thirdCity = normalizeCity(localForm.multi_city_stop || "Mumbai");

  const routeTitle =
    localForm.trip_type === "multi_city"
      ? `${sourceCity || "Source"} → ${destinationCity || "Stop 1"} → ${
          thirdCity || "Stop 2"
        }`
      : localForm.trip_type === "round_trip"
        ? `${sourceCity || "Source"} → ${
            destinationCity || "Destination"
          } → ${sourceCity || "Source"}`
        : `${sourceCity || "Source"} → ${destinationCity || "Destination"}`;

  const routeCode =
    localForm.trip_type === "multi_city"
      ? `${getCityCode(sourceCity)} → ${getCityCode(
          destinationCity,
        )} → ${getCityCode(thirdCity)}`
      : localForm.trip_type === "round_trip"
        ? `${getCityCode(sourceCity)} → ${getCityCode(
            destinationCity,
          )} → ${getCityCode(sourceCity)}`
        : `${getCityCode(sourceCity)} → ${getCityCode(destinationCity)}`;

  const interests = safeInterests(localForm.interests);
const currencySymbol = getCurrencySymbol(localForm.currency || form.currency || "INR");

  function syncField(name, value) {
    setLocalForm((current) => {
      const next = {
        ...current,
        [name]: value,
      };

      if (name === "source_city") next.source_location = null;
      if (name === "destination_city") next.destination_location = null;
      if (name === "multi_city_stop") next.multi_city_stop_location = null;

      return next;
    });

    onFieldChange?.(name, value);
  }

  function syncCity(cityField, locationField, cityName, selectedLocation) {
    const cleanCity = normalizeCity(cityName);

    setLocalForm((current) => ({
      ...current,
      [cityField]: cleanCity,
      [locationField]: selectedLocation || null,
    }));

    onFieldChange?.(cityField, cleanCity);
    onFieldChange?.(locationField, selectedLocation || null);
  }

  function handleTripType(nextTripType) {
    setLocalForm((current) => ({
      ...current,
      trip_type: nextTripType,
      end_date:
        nextTripType === "round_trip" && !current.end_date
          ? current.start_date
          : current.end_date,
    }));

    onTripTypeChange?.(nextTripType);
  }

  function handleSwap(event) {
    event.preventDefault();

    const swapped = {
      ...localForm,
      source_city: localForm.destination_city,
      destination_city: localForm.source_city,
      source_location: localForm.destination_location || null,
      destination_location: localForm.source_location || null,
    };

    setLocalForm(swapped);

    onFieldChange?.("source_city", swapped.source_city);
    onFieldChange?.("destination_city", swapped.destination_city);
    onFieldChange?.("source_location", swapped.source_location);
    onFieldChange?.("destination_location", swapped.destination_location);

    if (typeof onSwapRoute === "function") {
      onSwapRoute(swapped);
    }
  }

  function buildSubmitForm() {
    const budgetValue =
      budgetInputRef.current?.value ||
      budgetDraftRef.current ||
      localForm.budget ||
      form.budget ||
      0;

    const submitForm = {
      ...form,
      ...localForm,
      source_city: normalizeCity(localForm.source_city),
      destination_city: normalizeCity(localForm.destination_city),
      multi_city_stop: normalizeCity(localForm.multi_city_stop || "Mumbai"),
      start_date: localForm.start_date,
      end_date: localForm.end_date || localForm.start_date,
      budget: Number(budgetValue),
currency: String(localForm.currency || form.currency || "INR").toUpperCase(),
travelers: Number(localForm.travelers || 1),
      interests,
      travel_style: localForm.travel_style || "balanced",
      trip_type: localForm.trip_type || "one_way",
    };

    if (submitForm.trip_type === "multi_city") {
      submitForm.end_date =
        submitForm.multi_city_date ||
        submitForm.end_date ||
        submitForm.start_date;
    }

    return submitForm;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (submitLockRef.current || isPlanning) return;

    submitLockRef.current = true;
    onSubmit?.(buildSubmitForm());

    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 700);
  }

  function handlePlanPointerDown(event) {
    event.preventDefault();

    if (submitLockRef.current || isPlanning) return;

    submitLockRef.current = true;
    onSubmit?.(buildSubmitForm());

    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 700);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative mx-auto w-full max-w-[1580px] overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/95 p-4 shadow-[0_35px_120px_rgba(15,23,42,0.22)] backdrop-blur-3xl sm:p-5 lg:p-7"
    >
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-8 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative z-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-stretch">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TripTypeTabs
              activeTripType={localForm.trip_type || "one_way"}
              onChange={handleTripType}
            />

            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-black text-slate-700 shadow-sm">
              <Sparkles className="h-4 w-4 text-blue-600" />
              {productMode?.badge || "Trip planner"}
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
            {localForm.trip_type === "multi_city" ? (
              <div className="p-5">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                  <MapPinned className="h-4 w-4" />
                  Multi-city route builder
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  <CityCard
                    label="City 1"
                    icon={Navigation}
                    value={localForm.source_city}
                    location={localForm.source_location}
                    placeholder="Search City 1 worldwide"
                    disabled={isPlanning}
                    onChange={(cityName, location) =>
                      syncCity("source_city", "source_location", cityName, location)
                    }
                  />

                  <CityCard
                    label="City 2"
                    icon={MapPinned}
                    value={localForm.destination_city}
                    location={localForm.destination_location}
                    placeholder="Search City 2 worldwide"
                    disabled={isPlanning}
                    onChange={(cityName, location) =>
                      syncCity(
                        "destination_city",
                        "destination_location",
                        cityName,
                        location,
                      )
                    }
                  />

                  <CityCard
                    label="City 3"
                    icon={MapPinned}
                    value={localForm.multi_city_stop}
                    location={localForm.multi_city_stop_location}
                    placeholder="Search City 3 worldwide"
                    disabled={isPlanning}
                    onChange={(cityName, location) =>
                      syncCity(
                        "multi_city_stop",
                        "multi_city_stop_location",
                        cityName,
                        location,
                      )
                    }
                  />
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                  <DateCard
                    label="Leg 1 date"
                    value={localForm.start_date || ""}
                    helper="First departure"
                    onChange={(value) => syncField("start_date", value)}
                  />

                  <DateCard
                    label="Leg 2 date"
                    value={localForm.multi_city_date || localForm.end_date || ""}
                    helper="Next city departure"
                    onChange={(value) => {
                      syncField("multi_city_date", value);
                      syncField("end_date", value);
                    }}
                  />

                  <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Route flow
                    </div>

                    <div className="mt-3 text-[1.8rem] font-black leading-tight tracking-[-0.05em] text-slate-950">
                      {sourceCity || "City 1"}
                    </div>
                    <div className="text-slate-300">↓</div>
                    <div className="text-[1.8rem] font-black leading-tight tracking-[-0.05em] text-slate-950">
                      {destinationCity || "City 2"}
                    </div>
                    <div className="text-slate-300">↓</div>
                    <div className="text-[1.8rem] font-black leading-tight tracking-[-0.05em] text-slate-950">
                      {thirdCity || "City 3"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid overflow-visible lg:grid-cols-[minmax(0,1.3fr)_80px_minmax(0,1.3fr)_0.92fr_0.92fr]">
                  <CityCard
                    label="From"
                    icon={Navigation}
                    value={localForm.source_city}
                    location={localForm.source_location}
                    placeholder="Search source city worldwide"
                    disabled={isPlanning}
                    onChange={(cityName, location) =>
                      syncCity("source_city", "source_location", cityName, location)
                    }
                    className="lg:rounded-l-[2rem]"
                  />

                  <div className="flex items-center justify-center border-b border-slate-200 bg-white px-3 py-4 lg:border-b-0 lg:border-r">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="grid h-14 w-14 place-items-center rounded-full border border-slate-200 bg-white text-blue-600 shadow-md transition hover:bg-blue-50 active:scale-[0.98]"
                      title="Swap route"
                    >
                      <ArrowLeftRight className="h-5 w-5" />
                    </button>
                  </div>

                  <CityCard
                    label="To"
                    icon={MapPinned}
                    value={localForm.destination_city}
                    location={localForm.destination_location}
                    placeholder="Search destination city worldwide"
                    disabled={isPlanning}
                    onChange={(cityName, location) =>
                      syncCity(
                        "destination_city",
                        "destination_location",
                        cityName,
                        location,
                      )
                    }
                  />

                  <DateCard
                    label="Departure"
                    value={localForm.start_date || ""}
                    helper={
                      localForm.trip_type === "round_trip"
                        ? "Outbound journey"
                        : formatDateParts(localForm.start_date || "").weekday
                    }
                    onChange={(value) => syncField("start_date", value)}
                  />

                  <DateCard
                    label="Return"
                    value={localForm.end_date || ""}
                    helper={
                      localForm.trip_type === "round_trip"
                        ? "Return journey required"
                        : "Optional for one-way planning"
                    }
                    onChange={(value) => syncField("end_date", value)}
                  />
                </div>

                {localForm.trip_type === "round_trip" ? (
                  <div className="border-t border-slate-200 bg-blue-50/60 px-5 py-4 text-sm font-bold text-blue-700">
                    Round-trip mode is active. Departure and return are both part
                    of the booking flow now.
                  </div>
                ) : null}
              </>
            )}

            <div className="grid items-stretch gap-4 border-t border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 p-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-5">
              <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-sm">
                <div className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  Travellers &amp; class
                </div>

                <div className="grid items-start gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-600">
                      Travellers
                    </span>

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <Users className="h-4 w-4 text-blue-600" />

                      <input
                        type="number"
                        min="1"
                        step="1"
                        inputMode="numeric"
                        value={localForm.travelers}
                        onChange={(event) =>
                          syncField(
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

                  <div className="rounded-[1.5rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 px-4 py-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                        <Sparkles className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black uppercase tracking-[0.14em] text-blue-700">
                          Smart price guard
                        </p>

                        <p className="mt-1 max-w-xl text-sm font-semibold leading-6 text-slate-600">
                          Checks live fares, stay prices, route type and budget
                          buffer before building the final plan.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 ring-1 ring-blue-100">
                            Live pricing
                          </span>

                          <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700 ring-1 ring-blue-100">
                            Budget check
                          </span>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 ring-1 ring-emerald-100">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50/55 to-cyan-50/55 px-5 py-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  Budget
                </div>

                <div className="flex min-h-[122px] flex-col justify-center">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    Total trip budget
                  </p>

                  <div
  data-no-runtime-translate="true"
  className="mt-3 flex items-center gap-2"
>
<span className="text-[40px] font-black leading-none tracking-[-0.07em] text-slate-950">
  {currencySymbol}
</span>

                    <input
                      ref={budgetInputRef}
                      type="number"
                      min="1000"
                      step="500"
                      inputMode="numeric"
                      value={String(localForm.budget ?? "")}
                      onChange={(event) => {
                        const rawValue = event.target.value;

                        budgetDraftRef.current = rawValue;

                        setLocalForm((current) => ({
                          ...current,
                          budget: rawValue,
                        }));
                      }}
                      placeholder="35000"
                      className="min-w-0 flex-1 border-none bg-transparent !text-[40px] !font-black !leading-none tracking-[-0.07em] text-slate-950 outline-none placeholder:text-slate-300 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>

                  <p className="mt-3 text-xs font-semibold text-slate-500">
                    Used by pricing agents to keep the plan realistic.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <RouteSummaryCard
            routeTitle={routeTitle}
            routeCode={routeCode}
            tripLength={tripLength}
            tripType={localForm.trip_type}
            travelStyle={localForm.travel_style}
          />

          <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.06)] backdrop-blur-xl">
            <button
              type="button"
              disabled={isPlanning}
              onPointerDown={handlePlanPointerDown}
              onClick={(event) => event.preventDefault()}
              className="group inline-flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-sky-400 to-blue-700 px-8 py-4 text-base font-black text-white shadow-[0_20px_55px_rgba(37,99,235,0.32)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(37,99,235,0.42)] disabled:cursor-not-allowed disabled:opacity-70"
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

            <p className="mt-3 text-center text-xs font-semibold leading-5 text-slate-500">
              Runs route validation, live pricing, budget checks and itinerary build.
            </p>

            {error ? (
              <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.05)]">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                <Sparkles className="h-4 w-4" />
              </div>

              <div>
                <p className="text-sm font-black text-slate-950">
                  Smart planning active
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
                  Your route, budget and dates are checked together before the final plan is built.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function CityCard({
  label,
  icon: Icon,
  value,
  location,
  placeholder,
  onChange,
  disabled = false,
  className = "",
}) {
  const city = normalizeCity(value);

  const isSourceCard =
    String(label || "").toLowerCase().includes("from") ||
    String(label || "").toLowerCase().includes("city 1");

  const title = isSourceCard ? "Route origin" : "Trip destination";
  const status = isSourceCard ? "Transport ready" : "Stay ready";

  return (
    <div
      className={[
        "relative overflow-visible border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r",
        className,
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-blue-600" />
      </div>

      <div className="mt-4">
        <LocationAutocomplete
          label="Worldwide city search"
          value={city}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(cityName, selectedLocation) => {
            onChange?.(normalizeCity(cityName), selectedLocation || null);
          }}
        />
      </div>

      <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/70 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20">
            <Sparkles className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black tracking-[-0.03em] text-slate-950">
              {title}
            </p>

            <p className="mt-0.5 text-xs font-bold text-blue-700">{status}</p>
          </div>

          <span className="hidden rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 sm:inline-flex">
            Agent ready
          </span>
        </div>
      </div>
    </div>
  );
}

function RouteSummaryCard({
  routeTitle,
  routeCode,
  tripLength,
  tripType,
  travelStyle,
}) {
  const activeStyle =
    TRAVEL_STYLE_OPTIONS.find((style) => style.id === travelStyle)?.label ||
    "Balanced";

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-xl shadow-blue-950/5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-600">
          Route summary
        </p>

        <span className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-blue-700">
          {tripTypeLabel(tripType)}
        </span>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-blue-100 bg-white/80 px-4 py-4">
        <div className="text-[1.45rem] font-black leading-tight tracking-[-0.05em] text-slate-950">
          {routeTitle.split("→").map((part, index) => (
            <span key={`${part}-${index}`}>
              {index > 0 ? <span className="mx-2 text-slate-300">→</span> : null}
              {part.trim()}
            </span>
          ))}
        </div>

        <p className="mt-3 text-sm font-semibold text-slate-500">
          {tripLength} day{tripLength > 1 ? "s" : ""} · {activeStyle} style
        </p>
      </div>

      <div className="mt-4 rounded-2xl border border-blue-100 bg-white px-4 py-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Route code
        </p>
        <p className="mt-1 text-sm font-black text-slate-950">{routeCode}</p>
      </div>
    </div>
  );
}

function DateCard({ label, value, helper, onChange }) {
  const dateParts = formatDateParts(value);

  return (
    <div className="border-b border-slate-200 bg-white p-5 lg:border-b-0 lg:border-r">
      <div className="flex items-center justify-between gap-3 text-sm font-semibold text-slate-500">
        <span>{label}</span>
        <CalendarDays className="h-4 w-4 text-blue-600" />
      </div>

      <div
        key={value || "empty-date"}
        className="mt-3 flex items-end gap-2 text-slate-950"
      >
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