import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe2, Loader2, MapPin, Search, X } from "lucide-react";

import { searchLocations } from "../api/tripApi";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getDisplayValue(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return value.label || value.name || "";
}

function getPayloadValue(location) {
  if (!location) return "";

  if (typeof location === "string") {
    return location;
  }

  return location.name || location.label || "";
}

export default function LocationAutocomplete({
  label = "City",
  value,
  onChange,
  placeholder = "Search any city worldwide",
  disabled = false,
}) {
  const wrapperRef = useRef(null);

  // IMPORTANT:
  // This component is now fully controlled by parent value.
  // It cannot display Dubai while parent still holds Bengaluru.
  const inputValue = useMemo(() => getDisplayValue(value), [value]);

  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [hasFocusedOrTyped, setHasFocusedOrTyped] = useState(false);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapperRef.current) return;

      if (!wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const cleanQuery = inputValue.trim();

    if (disabled) return;
    if (!hasFocusedOrTyped) return;

    if (cleanQuery.length < 2) {
      setResults([]);
      setIsSearching(false);
      setError("");
      return;
    }

    let cancelled = false;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        setError("");

        const locations = await searchLocations(cleanQuery, 8);

        if (cancelled) return;

        setResults(locations);
        setIsOpen(true);
      } catch (searchError) {
        if (cancelled) return;

        console.error(searchError);
        setResults([]);
        setError("Could not load worldwide locations.");
        setIsOpen(true);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [inputValue, disabled, hasFocusedOrTyped]);

  function handleInputChange(event) {
    const nextValue = event.target.value;

    setHasFocusedOrTyped(true);
    setIsOpen(true);
    setError("");

    // Parent is the single source of truth.
    onChange?.(nextValue, null);

    if (nextValue.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
    }
  }

  function handleFocus() {
    if (disabled) return;

    setHasFocusedOrTyped(true);

    if (inputValue.trim().length >= 2) {
      setIsOpen(true);
    }
  }

  function handleSelect(location) {
    const nextPayload = getPayloadValue(location);

    setIsOpen(false);
    setResults([]);
    setError("");
    setIsSearching(false);
    setHasFocusedOrTyped(false);

    onChange?.(nextPayload, location);
  }

  function handleClear() {
    setResults([]);
    setIsOpen(false);
    setError("");
    setIsSearching(false);
    setHasFocusedOrTyped(true);

    onChange?.("", null);
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>

      <div
        className={cx(
          "group flex min-h-[58px] items-center gap-3 rounded-2xl border bg-white px-4 shadow-sm transition",
          isOpen
            ? "border-blue-300 ring-4 ring-blue-500/10"
            : "border-slate-200 hover:border-slate-300",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Search className="h-4 w-4" />
        </div>

        <input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm font-black text-slate-950 outline-none placeholder:text-slate-400"
        />

        {isSearching ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
        ) : inputValue ? (
          <button
            type="button"
            onClick={handleClear}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Clear city"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <Globe2 className="h-4 w-4 shrink-0 text-slate-400" />
        )}
      </div>

      {isOpen ? (
        <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[90] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
              Worldwide location search
            </p>
          </div>

          {error ? (
            <div className="px-4 py-4 text-sm font-bold text-red-600">
              {error}
            </div>
          ) : null}

          {!error && isSearching ? (
            <div className="flex items-center gap-3 px-4 py-4 text-sm font-bold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              Searching cities worldwide...
            </div>
          ) : null}

          {!error &&
          !isSearching &&
          hasFocusedOrTyped &&
          inputValue.trim().length >= 2 &&
          results.length === 0 ? (
            <div className="px-4 py-4 text-sm font-semibold leading-6 text-slate-500">
              No matching city found. Try a different spelling.
            </div>
          ) : null}

          {!error &&
          !isSearching &&
          hasFocusedOrTyped &&
          inputValue.trim().length < 2 ? (
            <div className="px-4 py-4 text-sm font-semibold leading-6 text-slate-500">
              Type at least 2 letters to search any city worldwide.
            </div>
          ) : null}

          {!error && results.length > 0 ? (
            <div className="max-h-[330px] overflow-auto p-2">
              {results.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => handleSelect(location)}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-blue-50"
                >
                  <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-950">
                        {location.label}
                      </p>

                      {location.country_code ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
                          {location.country_code}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {location.continent || "Unknown continent"}
                      {location.timezone ? ` · ${location.timezone}` : ""}
                    </p>
                  </div>

                  {inputValue === location.name ||
                  inputValue === location.label ? (
                    <Check className="mt-2 h-4 w-4 shrink-0 text-blue-600" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}