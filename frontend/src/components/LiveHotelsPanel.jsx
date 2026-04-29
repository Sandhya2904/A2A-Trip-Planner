import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Hotel,
  Loader2,
  MapPinned,
  RefreshCcw,
  Star,
} from "lucide-react";

import { getLiveHotels } from "../api/tripApi";

const FALLBACK_HOTEL_IMAGES = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1400&q=90",
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function normalizeCity(city) {
  const value = String(city || "").trim();

  if (!value) return "Destination";

  const lower = value.toLowerCase();

  if (["bangalore", "bengaluru", "blr"].includes(lower)) return "Bengaluru";
  if (lower === "calcutta") return "Kolkata";
  if (lower === "bombay") return "Mumbai";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getImage(hotel, index) {
  return hotel?.image || FALLBACK_HOTEL_IMAGES[index % FALLBACK_HOTEL_IMAGES.length];
}

function getRatingLabel(hotel) {
  if (!hotel?.rating) return "Live result";

  if (typeof hotel.rating === "number") {
    return `${hotel.rating.toFixed(1)} rating`;
  }

  return String(hotel.rating);
}

export default function LiveHotelsPanel({ destinationCity }) {
  const city = useMemo(() => normalizeCity(destinationCity), [destinationCity]);

  const [hotels, setHotels] = useState([]);
  const [provider, setProvider] = useState("");
  const [locationName, setLocationName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadHotels() {
    setIsLoading(true);
    setError("");

    try {
      const response = await getLiveHotels(city, 10);

      setHotels(response.data || []);
      setProvider(response.provider || "live provider");
      setLocationName(response.location?.name || city);
    } catch (loadError) {
      setHotels([]);
      setError(loadError?.message || "Failed to load live hotels.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city]);

  return (
    <section id="live-hotels" className="scroll-mt-8">
      <div className="mb-8 flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">
            Live Hotel Provider
          </p>

          <h2 className="mt-3 max-w-5xl text-4xl font-black tracking-[-0.065em] text-slate-950 lg:text-6xl">
            Hotels in {city}
          </h2>

          <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-slate-600">
            These hotel names and map locations are loaded from the backend live
            provider for your selected destination.
          </p>
        </div>

        <button
          type="button"
          onClick={loadHotels}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh Live Hotels
        </button>
      </div>

      <div className="mb-6 rounded-[2rem] border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
              <Hotel className="h-5 w-5" />
            </div>

            <div>
              <p className="font-black text-blue-950">
                Provider: {provider || "Loading..."}
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-blue-800">
                Location resolved as: {locationName || city}
              </p>
            </div>
          </div>

          <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-blue-700 ring-1 ring-blue-100">
            {hotels.length} live results
          </span>
        </div>
      </div>

      {error && (
        <div className="rounded-[2rem] border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="font-black text-red-800">Live hotels failed</p>
              <p className="mt-1 text-sm font-semibold text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid min-h-[320px] place-items-center rounded-[2.5rem] border border-slate-200 bg-white">
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-blue-600" />
            <p className="mt-4 text-lg font-black text-slate-950">
              Loading live hotels...
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Searching destination data from backend provider.
            </p>
          </div>
        </div>
      ) : hotels.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {hotels.map((hotel, index) => (
            <LiveHotelCard key={hotel.id || `${hotel.name}-${index}`} hotel={hotel} index={index} />
          ))}
        </div>
      ) : !error ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-blue-50 text-blue-700">
            <Hotel className="h-8 w-8" />
          </div>

          <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-slate-950">
            No live hotels found.
          </h3>

          <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-7 text-slate-500">
            Try a larger city name like Bengaluru, Mumbai, Delhi, Goa, Kolkata,
            Pune, Chennai, or Hyderabad.
          </p>
        </div>
      ) : null}
    </section>
  );
}

function LiveHotelCard({ hotel, index }) {
  const image = getImage(hotel, index);
  const ratingLabel = getRatingLabel(hotel);

  return (
    <article className="group overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_110px_rgba(15,23,42,0.14)]">
      <div className="relative h-64 overflow-hidden">
        <img
          src={image}
          alt={hotel.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/16 to-transparent" />

        <div className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-950 shadow-xl backdrop-blur-xl">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
          {ratingLabel}
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h3 className="line-clamp-2 text-2xl font-black tracking-[-0.055em]">
            {hotel.name}
          </h3>

          <p className="mt-1 line-clamp-2 text-sm font-bold text-slate-200">
            {hotel.location}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {(hotel.highlights || ["Live result"]).slice(0, 3).map((highlight) => (
            <span
              key={highlight}
              className={cx(
                "rounded-full px-3 py-1.5 text-xs font-black",
                highlight.toLowerCase().includes("website")
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-blue-50 text-blue-700",
              )}
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Source
            </p>
            <p className="mt-1 text-xl font-black text-slate-950">
              {hotel.source || "Live Provider"}
            </p>
          </div>

          <div className="flex gap-2">
            {hotel.website_url && (
              <a
                href={hotel.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                Site
              </a>
            )}

            <a
              href={hotel.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5"
            >
              Map
              <MapPinned className="h-4 w-4" />
            </a>
          </div>
        </div>

        {hotel.latitude && hotel.longitude && (
          <p className="mt-4 text-xs font-bold text-slate-400">
            {Number(hotel.latitude).toFixed(4)}, {Number(hotel.longitude).toFixed(4)}
          </p>
        )}
      </div>
    </article>
  );
}