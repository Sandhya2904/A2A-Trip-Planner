import { CircleDot, MapPinned, Repeat2 } from "lucide-react";

const TRIP_TYPES = [
  {
    id: "one_way",
    label: "One Way",
    icon: CircleDot,
    helper: "Single route",
  },
  {
    id: "round_trip",
    label: "Round Trip",
    icon: Repeat2,
    helper: "Return included",
  },
  {
    id: "multi_city",
    label: "Multi City",
    icon: MapPinned,
    helper: "Multiple stops",
  },
];

export default function TripTypeTabs({ activeTripType = "one_way", onChange }) {
  function handleChange(nextTripType) {
    if (typeof onChange === "function") {
      onChange(nextTripType);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {TRIP_TYPES.map((tripType) => {
        const Icon = tripType.icon;
        const isActive = activeTripType === tripType.id;

        return (
          <button
            key={tripType.id}
            type="button"
            onClick={() => handleChange(tripType.id)}
            aria-pressed={isActive}
            className={[
              "group inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-black transition-all duration-300",
              isActive
                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/25"
                : "border border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
            ].join(" ")}
            title={tripType.helper}
          >
            <Icon
              className={[
                "h-4 w-4 transition",
                isActive
                  ? "text-white"
                  : "text-slate-400 group-hover:text-blue-600",
              ].join(" ")}
            />
            <span>{tripType.label}</span>
          </button>
        );
      })}
    </div>
  );
}
