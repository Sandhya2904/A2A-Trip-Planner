import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AgentPlanningProgress from "./components/AgentPlanningProgress";
import BackendExecutionReport from "./components/BackendExecutionReport";
import {
  Activity,
  ArrowRight,
  BadgeDollarSign,
  BrainCircuit,
  BriefcaseBusiness,
  Bus,
  CalendarDays,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  Clipboard,
  CloudSun,
  Compass,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Gauge,
  Globe2,
  Heart,
  Home,
  Hotel,
  Info,
  Layers,
  Loader2,
  Map,
  MapPinned,
  Menu,
  Navigation,
  Palmtree,
  Plane,
  RefreshCcw,
  Route,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Train,
  TrendingUp,
  Users,
  Wallet,
  Workflow,
} from "lucide-react";

import { generateTripPlan, streamTripPlan } from "./api/tripApi";
import SavedTripsPanel from "./components/SavedTripsPanel";
import AgentWorkflowTimeline from "./components/AgentWorkflowTimeline";
import TravelCatalogPanel from "./components/TravelCatalogPanel";
import TopNavBar from "./components/TopNavBar";
import TripTypeTabs from "./components/TripTypeTabs";
import FloatingAIAssistant from "./components/FloatingAIAssistant";
import SaveTripButton from "./components/SaveTripButton";
import AirlineSearchPanel from "./components/BookingPanelFixed";
import LiveBackendStream from "./components/LiveBackendStream";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2400&q=90";

const DEFAULT_FORM = {
  source_city: "Kolkata",
  source_location: null,
  destination_city: "Bengaluru",
  destination_location: null,
  multi_city_stop: "Mumbai",
  multi_city_stop_location: null,
  start_date: "2026-05-19",
  end_date: "2026-05-23",
  budget: 35000,
  currency: "INR",
  travelers: 1,
  interests: ["culture", "local food"],
  travel_style: "balanced",
  product_category: "Hotels",
  trip_type: "one_way",
};

const CURRENCIES = ["INR", "USD", "EUR", "GBP"];
const TRIP_TYPE_LABELS = {
  one_way: "One Way",
  round_trip: "Round Trip",
  multi_city: "Multi City",
};

function getTripTypeLabel(tripType) {
  return TRIP_TYPE_LABELS[tripType] || "One Way";
}

const PRODUCT_CATEGORIES = [
  {
    label: "Flights",
    icon: Plane,
    helper: "Best for city-to-city and international trips",
  },
  {
    label: "Hotels",
    icon: Hotel,
    helper: "Find stays at your destination",
  },
  {
    label: "Homes",
    icon: Home,
    helper: "Private stays, villas and homestays",
  },
  {
    label: "Packages",
    icon: Palmtree,
    helper: "Stay + travel + activities in one bundle",
  },
  {
    label: "Trains",
    icon: Train,
    helper: "Shown only for practical rail routes",
  },
  {
    label: "Buses",
    icon: Bus,
    helper: "Shown only for practical road routes",
  },
  {
    label: "Cabs",
    icon: Car,
    helper: "Road trips and private transfers",
  },
  {
    label: "Tours",
    icon: MapPinned,
    helper: "Real places and things to do",
  },
  {
    label: "Insurance",
    icon: Shield,
    helper: "Trip safety and protection options",
  },
];

const INTERESTS = [
  { id: "beaches", label: "Beaches", icon: Palmtree },
  { id: "nightlife", label: "Nightlife", icon: Sparkles },
  { id: "local food", label: "Local Food", icon: Activity },
  { id: "culture", label: "Culture", icon: Map },
  { id: "adventure", label: "Adventure", icon: Route },
];

const TRAVEL_STYLES = [
  { id: "budget", label: "Budget", description: "Smart savings", icon: Wallet },
  { id: "balanced", label: "Balanced", description: "Best value", icon: Gauge },
  { id: "premium", label: "Premium", description: "Comfort first", icon: Star },
];

const MODE_COPY = {
  Flights: {
    title: "Find flight options for your route",
    subtitle:
      "Search route-specific flights and then generate a complete trip plan with stay, budget and itinerary.",
    cta: "Plan Flight Trip",
    badge: "Route flights",
  },
  Hotels: {
    title: "Choose stays in your destination city",
    subtitle:
      "Hotel cards are generated for the destination you entered, so Kolkata to Bengaluru shows Bengaluru stays only.",
    cta: "Plan With This Stay",
    badge: "Destination stays",
  },
  Homes: {
    title: "Browse homes and villas in your destination",
    subtitle:
      "Find private stays, apartments and villas based on where you are actually travelling.",
    cta: "Plan Homestay Trip",
    badge: "Homes and villas",
  },
  Packages: {
    title: "Build a holiday package for your destination",
    subtitle:
      "Package ideas are based on your destination and trip style, not random cities.",
    cta: "Build Package",
    badge: "Holiday packages",
  },
  Trains: {
    title: "Explore train options for your route",
    subtitle:
      "Train cards are built from your source and destination cities.",
    cta: "Plan Train Trip",
    badge: "Rail route",
  },
  Buses: {
    title: "Explore bus options for your route",
    subtitle:
      "Bus cards are created for the exact route you entered.",
    cta: "Plan Bus Trip",
    badge: "Bus route",
  },
  Cabs: {
    title: "Plan a cab or road trip",
    subtitle:
      "Cab cards use your source and destination to create route-specific road options.",
    cta: "Plan Road Trip",
    badge: "Road route",
  },
  Tours: {
    title: "Discover activities in your destination",
    subtitle:
      "Tours and experiences are destination-specific and shown as internal cards.",
    cta: "Plan Experience Trip",
    badge: "Destination tours",
  },
  Insurance: {
    title: "Add protection to your trip",
    subtitle:
      "Review travel protection ideas based on your trip location and travel type.",
    cta: "Check Trip Safety",
    badge: "Trip protection",
  },
};

const CITY_IMAGES = {
  Bengaluru:
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=90",
  Bangalore:
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1400&q=90",
  Goa: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=90",
  Mumbai:
    "https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&w=1400&q=90",
  Delhi:
    "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1400&q=90",
  Kolkata:
    "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=1400&q=90",
  Dubai:
    "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=90",
  Default:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
};

const HOTEL_IMAGES = [
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

const HOME_IMAGES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1400&q=90",
];

const TOUR_IMAGES = [
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1400&q=90",
  "https://images.unsplash.com/photo-1527295110-5145f6b148d0?auto=format&fit=crop&w=1400&q=90",
];

const BENGALURU_HOTELS = [
  "The Leela Palace Bengaluru",
  "The Oberoi Bengaluru",
  "Taj MG Road Bengaluru",
  "ITC Gardenia Bengaluru",
  "JW Marriott Hotel Bengaluru",
  "Conrad Bengaluru",
  "Sheraton Grand Bengaluru Whitefield",
  "Radisson Blu Atria Bengaluru",
  "Hyatt Centric MG Road Bengaluru",
  "Hilton Bengaluru Embassy Manyata Business Park",
];

const AGENT_STEPS = [
  {
    title: "Orchestrator",
    description: "Coordinates specialized planning tasks.",
    icon: Workflow,
    gradient: "from-violet-500 to-indigo-600",
  },
  {
    title: "Flight Agent",
    description: "Ranks route options.",
    icon: Plane,
    gradient: "from-sky-500 to-blue-600",
  },
  {
    title: "Hotel Agent",
    description: "Selects destination stays.",
    icon: Hotel,
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "Weather Agent",
    description: "Adds weather notes.",
    icon: CloudSun,
    gradient: "from-amber-400 to-orange-500",
  },
  {
    title: "Activity Agent",
    description: "Finds local experiences.",
    icon: Activity,
    gradient: "from-pink-500 to-rose-600",
  },
  {
    title: "Pricing Agent",
    description: "Calculates cost breakdown.",
    icon: BadgeDollarSign,
    gradient: "from-green-500 to-emerald-600",
  },
  {
    title: "Itinerary Agent",
    description: "Builds day-wise plan.",
    icon: MapPinned,
    gradient: "from-orange-500 to-red-600",
  },
];

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function encode(value) {
  return encodeURIComponent(value || "");
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
function normalizeLocationCity(location) {
  if (!location || typeof location !== "object") return "";

  return normalizeCity(
    location.name || location.city || location.label || "",
  );
}

function locationMatchesCity(location, city) {
  const locationCity = normalizeLocationCity(location);
  const cleanCity = normalizeCity(city);

  if (!locationCity || !cleanCity || cleanCity === "Destination") {
    return false;
  }

  return locationCity.toLowerCase() === cleanCity.toLowerCase();
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

function safeDateLabel(value) {
  if (!value) return "Not set";

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

function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diff = end.getTime() - start.getTime();

  if (Number.isNaN(diff)) return 1;

  return Math.max(Math.round(diff / (1000 * 60 * 60 * 24)) + 1, 1);
}

function parsePositiveNumber(value, fallback = 0) {
  const normalized = String(value ?? "").replace(/[^0-9.]/g, "");
  const number = Number(normalized);

  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function normalizeTripFormForSubmit(rawForm) {
  const cleanSource = String(rawForm.source_city || "").trim();
  const cleanDestination = String(rawForm.destination_city || "").trim();
  const startDate = rawForm.start_date || DEFAULT_FORM.start_date;
  const endDate = rawForm.end_date || startDate;
  const tripType = rawForm.trip_type || "one_way";
  const travelers = Math.max(
    1,
    Math.round(parsePositiveNumber(rawForm.travelers, 1)),
  );
  const budget = Math.max(
    1000,
    Math.round(parsePositiveNumber(rawForm.budget, DEFAULT_FORM.budget)),
  );

  return {
    ...rawForm,
    source_city: cleanSource,
    source_location: locationMatchesCity(rawForm.source_location, cleanSource)
      ? rawForm.source_location
      : null,
    destination_city: cleanDestination,
    destination_location: locationMatchesCity(
      rawForm.destination_location,
      cleanDestination,
    )
      ? rawForm.destination_location
      : null,
    multi_city_stop: String(rawForm.multi_city_stop || "").trim(),
    multi_city_stop_location: locationMatchesCity(
      rawForm.multi_city_stop_location,
      rawForm.multi_city_stop,
    )
      ? rawForm.multi_city_stop_location
      : null,
    start_date: startDate,
    end_date: endDate,
    budget,
    currency: String(rawForm.currency || "INR").toUpperCase(),
    travelers,
    interests: Array.isArray(rawForm.interests) ? rawForm.interests : [],
    travel_style: rawForm.travel_style || "balanced",
    travel_class: rawForm.travel_class || "Economy / Premium Economy",
    product_category: rawForm.product_category || "Hotels",
    trip_type: tripType,
  };
}

function getBudgetTone(finalPlan) {
  const budget = finalPlan?.budget_breakdown;
  const request = finalPlan?.request;

  if (!budget || !request) {
    return {
      label: "Pending",
      className: "border-slate-200 bg-white text-slate-700",
      icon: Info,
    };
  }

  if (budget.remaining_budget < 0) {
    return {
      label: "Over Budget",
      className: "border-red-200 bg-red-50 text-red-700",
      icon: Shield,
    };
  }

  if (budget.remaining_budget <= request.budget * 0.1) {
    return {
      label: "Tight Budget",
      className: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Gauge,
    };
  }

  return {
    label: "Healthy Budget",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
  };
}
function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function getTripIntelligenceScore(finalPlan) {
  const request = finalPlan?.request || {};
  const budget = finalPlan?.budget_breakdown || {};
  const pricing = finalPlan?.pricing_metadata || {};

  const totalCost = Number(budget.total_estimated_cost || 0);
  const remaining = Number(budget.remaining_budget || 0);
  const userBudget = Number(request.budget || 0);

  const hasFlight = Boolean(finalPlan?.selected_flight);
  const hasHotel = Boolean(finalPlan?.selected_hotel);
  const itineraryDays = Array.isArray(finalPlan?.itinerary)
    ? finalPlan.itinerary.length
    : 0;

  const budgetScore =
    userBudget > 0
      ? remaining >= 0
        ? 100
        : clampScore(100 - (Math.abs(remaining) / userBudget) * 100)
      : 60;

  const coverageScore = clampScore(
    (hasFlight ? 30 : 0) +
      (hasHotel ? 30 : 0) +
      (itineraryDays > 0 ? 40 : 0),
  );

  const pricingScore =
    pricing.price_source === "live_api"
      ? 100
      : pricing.price_source === "mixed_live_and_fallback"
        ? 78
        : 62;

  const practicalityScore = clampScore(
    budgetScore * 0.45 + coverageScore * 0.35 + pricingScore * 0.2,
  );

  let label = "Needs Review";
  if (practicalityScore >= 85) label = "Excellent Plan";
  else if (practicalityScore >= 70) label = "Strong Plan";
  else if (practicalityScore >= 55) label = "Usable Plan";

  return {
    score: practicalityScore,
    label,
    budgetScore,
    coverageScore,
    pricingScore,
  };
}
function getBudgetHealthScore(finalPlan) {
  const request = finalPlan?.request || {};
  const budget = finalPlan?.budget_breakdown || {};

  const userBudget = Number(request.budget || 0);
  const totalCost = Number(budget.total_estimated_cost || 0);
  const remaining = Number(budget.remaining_budget || userBudget - totalCost);

  if (!userBudget || userBudget <= 0) {
    return {
      score: 50,
      label: "Budget not set",
      status: "neutral",
      usagePercent: 0,
      remaining,
      message: "Add a trip budget to unlock budget health analysis.",
    };
  }

  const usagePercent = Math.round((totalCost / userBudget) * 100);

  let score = 100;
  let label = "Healthy Budget";
  let status = "healthy";
  let message = "Your budget has enough room for the current trip plan.";

  if (remaining < 0) {
    const overPercent = Math.abs(remaining) / userBudget;
    score = clampScore(55 - overPercent * 100);
    label = "Over Budget";
    status = "danger";
    message = "Your plan is above the selected budget. Reduce stay, travel class, or activities.";
  } else if (usagePercent >= 90) {
    score = 68;
    label = "Tight Budget";
    status = "warning";
    message = "The plan fits, but there is very little buffer left.";
  } else if (usagePercent >= 75) {
    score = 82;
    label = "Balanced Budget";
    status = "balanced";
    message = "The plan fits well with a practical buffer.";
  }

  return {
    score: clampScore(score),
    label,
    status,
    usagePercent: clampScore(usagePercent),
    remaining,
    message,
  };
}
function getRouteFeasibilityScore(finalPlan) {
  const request = finalPlan?.request || {};
  const pricing = finalPlan?.pricing_metadata || {};

  const sourceCity = String(request.source_city || "").trim();
  const destinationCity = String(request.destination_city || "").trim();
  const tripType = request.trip_type || "one_way";
  const travelClass = request.travel_class || "Economy / Premium Economy";

  const hasSource = sourceCity.length >= 2;
  const hasDestination = destinationCity.length >= 2;
  const sameCity =
    sourceCity && destinationCity &&
    sourceCity.toLowerCase() === destinationCity.toLowerCase();

  const hasFlight = Boolean(finalPlan?.selected_flight);
  const hasHotel = Boolean(finalPlan?.selected_hotel);

  const priceSource = pricing.price_source || "unknown";

  let score = 100;
  const issues = [];

  if (!hasSource || !hasDestination) {
    score -= 35;
    issues.push("Route cities need review.");
  }

  if (sameCity) {
    score -= 30;
    issues.push("Source and destination are the same.");
  }

  if (!hasFlight) {
    score -= 18;
    issues.push("Flight option is missing.");
  }

  if (!hasHotel) {
    score -= 14;
    issues.push("Stay option is missing.");
  }

  if (priceSource !== "live_api") {
    score -= priceSource === "mixed_live_and_fallback" ? 8 : 14;
    issues.push("Live price confidence can be improved.");
  }

  if (tripType === "round_trip" && !request.end_date) {
    score -= 10;
    issues.push("Return date should be confirmed.");
  }

  if (String(travelClass).toLowerCase().includes("first")) {
    score -= 4;
  }

  const finalScore = clampScore(score);

  let label = "Needs Review";
  if (finalScore >= 88) label = "Highly Feasible";
  else if (finalScore >= 72) label = "Feasible Route";
  else if (finalScore >= 55) label = "Possible With Checks";

  return {
    score: finalScore,
    label,
    issues,
    status:
      finalScore >= 88
        ? "excellent"
        : finalScore >= 72
          ? "good"
          : finalScore >= 55
            ? "warning"
            : "danger",
  };
}
function getPriceConfidenceScore(finalPlan) {
  const pricing = finalPlan?.pricing_metadata || {};
  const flightPricing = pricing.flight_pricing || {};
  const hotelPricing = pricing.hotel_pricing || {};

  const priceSource = pricing.price_source || "unknown";
  const confidence = pricing.confidence || "unknown";

  let score = 62;
  const signals = [];

  if (priceSource === "live_api") {
    score = 96;
    signals.push("Flight and stay prices were checked live.");
  } else if (priceSource === "mixed_live_and_fallback") {
    score = 78;
    signals.push("Some prices were checked live, while others need a final recheck.");
  } else {
    score = 62;
    signals.push("Prices are useful for planning but should be rechecked before booking.");
  }

  if (flightPricing?.source === "live_api") {
    score += 2;
    signals.push("Flight pricing has live-provider support.");
  }

  if (hotelPricing?.source === "live_api") {
    score += 2;
    signals.push("Stay pricing has live-provider support.");
  }

  if (String(confidence).toLowerCase().includes("high")) {
    score += 2;
  }

  const finalScore = clampScore(score);

  let label = "Planning Estimate";
  if (finalScore >= 90) label = "High Confidence";
  else if (finalScore >= 75) label = "Good Confidence";
  else if (finalScore >= 60) label = "Recheck Recommended";

  return {
    score: finalScore,
    label,
    signals,
    priceSource,
    confidence,
  };
}
function getPlanQualityScore(finalPlan) {
  const itinerary = Array.isArray(finalPlan?.itinerary) ? finalPlan.itinerary : [];
  const bookingLinks = finalPlan?.booking_links || {};
  const flight = finalPlan?.selected_flight || null;
  const hotel = finalPlan?.selected_hotel || null;
  const budget = finalPlan?.budget_breakdown || {};

  let score = 0;
  const signals = [];

  if (flight) {
    score += 20;
    signals.push("Flight recommendation is available.");
  }

  if (hotel) {
    score += 20;
    signals.push("Stay recommendation is available.");
  }

  if (itinerary.length > 0) {
    score += 25;
    signals.push("Day-wise itinerary is generated.");
  }

  if (bookingLinks && Object.keys(bookingLinks).length > 0) {
    score += 15;
    signals.push("Booking continuation links are available.");
  }

  if (Number(budget.total_estimated_cost || 0) > 0) {
    score += 20;
    signals.push("Budget breakdown is available.");
  }

  const finalScore = clampScore(score);

  let label = "Needs More Detail";
  if (finalScore >= 90) label = "Complete Plan";
  else if (finalScore >= 75) label = "Strong Plan";
  else if (finalScore >= 60) label = "Usable Plan";

  return {
    score: finalScore,
    label,
    signals,
  };
}
function getWeatherRiskScore(finalPlan) {
  const weather = finalPlan?.weather || finalPlan?.weather_summary || {};
  const itinerary = Array.isArray(finalPlan?.itinerary) ? finalPlan.itinerary : [];

  const rawText = JSON.stringify({
    weather,
    itinerary,
  }).toLowerCase();

  let risk = 20;
  const signals = [];

  if (!rawText || rawText === "{}") {
    return {
      score: 65,
      label: "Weather Check Needed",
      riskLevel: "medium",
      signals: ["Weather details were not fully available for this plan."],
    };
  }

  if (
    rawText.includes("rain") ||
    rawText.includes("storm") ||
    rawText.includes("thunder") ||
    rawText.includes("cyclone")
  ) {
    risk += 25;
    signals.push("Rain or storm-related conditions may affect outdoor plans.");
  }

  if (
    rawText.includes("hot") ||
    rawText.includes("heat") ||
    rawText.includes("humid")
  ) {
    risk += 12;
    signals.push("Heat or humidity may affect daytime activities.");
  }

  if (
    rawText.includes("cold") ||
    rawText.includes("snow") ||
    rawText.includes("fog")
  ) {
    risk += 14;
    signals.push("Cold, snow or fog may affect travel comfort.");
  }

  if (!signals.length) {
    signals.push("No major weather risk detected from the available plan details.");
  }

  const finalRisk = clampScore(risk);
  const score = clampScore(100 - finalRisk);

  let label = "Low Weather Risk";
  let riskLevel = "low";

  if (finalRisk >= 65) {
    label = "High Weather Risk";
    riskLevel = "high";
  } else if (finalRisk >= 40) {
    label = "Moderate Weather Risk";
    riskLevel = "medium";
  }

  return {
    score,
    label,
    riskLevel,
    signals,
  };
}

function buildMapsSearchUrl(query) {
  return `https://www.google.com/maps/search/?api=1&query=${encode(query)}`;
}

function buildSearchUrl(query) {
  return `https://www.google.com/search?q=${encode(query)}`;
}

function buildMarketplaceItems(category, form) {
  const source = normalizeCity(form.source_city);
  const destination = normalizeCity(form.destination_city);
  const route = `${source} to ${destination}`;

  if (category === "Hotels") {
    const names =
      destination === "Bengaluru"
        ? BENGALURU_HOTELS
        : [
            `Grand Meridian ${destination}`,
            `The Horizon ${destination}`,
            `Taj ${destination} City Centre`,
            `Radisson Blu ${destination}`,
            `Novotel ${destination}`,
            `Hyatt Place ${destination}`,
            `The Park ${destination}`,
            `Lemon Tree Premier ${destination}`,
            `Marriott ${destination}`,
            `Fairfield by Marriott ${destination}`,
          ];

    return names.map((name, index) => ({
      name,
      location: `${destination}`,
      rating: (4.2 + (index % 6) * 0.1).toFixed(1),
      price: `₹${(4200 + index * 850).toLocaleString("en-IN")} / night`,
      image: HOTEL_IMAGES[index % HOTEL_IMAGES.length],
      highlights: [
        index % 2 === 0 ? "Breakfast" : "City centre",
        index % 3 === 0 ? "Pool" : "WiFi",
        index % 4 === 0 ? "Airport access" : "High rated",
      ],
      action: "View Hotel",
      url: buildMapsSearchUrl(`${name} ${destination}`),
    }));
  }

  if (category === "Homes") {
    const labels = [
      "Skyline Serviced Apartment",
      "Garden View Homestay",
      "Premium City Villa",
      "Executive Studio Stay",
      "Family Comfort Apartment",
      "Urban Nest Residence",
      "Terrace House Stay",
      "Long Stay Business Home",
      "Boutique Private Villa",
      "Calm Corner Homestay",
    ];

    return labels.map((name, index) => ({
      name: `${name}, ${destination}`,
      location: `${destination}`,
      rating: (4.1 + (index % 7) * 0.1).toFixed(1),
      price: `₹${(3200 + index * 700).toLocaleString("en-IN")} / night`,
      image: HOME_IMAGES[index % HOME_IMAGES.length],
      highlights: [
        index % 2 === 0 ? "Kitchen" : "Work desk",
        index % 3 === 0 ? "Family friendly" : "Long stay",
        index % 4 === 0 ? "Private space" : "Local area",
      ],
      action: "View Home",
      url: buildSearchUrl(`${destination} ${name} vacation rental homestay`),
    }));
  }

  if (category === "Packages") {
    const labels = [
      "Weekend City Break",
      "Premium Stay Package",
      "Food and Culture Package",
      "Family Holiday Bundle",
      "Workation Package",
      "Luxury Escape",
      "Budget Smart Package",
      "Adventure Add-on Package",
      "Couple Friendly Package",
      "All-in-One Holiday",
    ];

    return labels.map((name, index) => ({
      name: `${destination} ${name}`,
      location: `${route}`,
      rating: index % 2 === 0 ? "Best value" : "Popular",
      price: `From ₹${(18500 + index * 4200).toLocaleString("en-IN")}`,
      image: index % 2 === 0 ? CITY_IMAGES[destination] || CITY_IMAGES.Default : HOTEL_IMAGES[index % HOTEL_IMAGES.length],
      highlights: [
        "Stay included",
        index % 2 === 0 ? "Activities" : "Transfers",
        index % 3 === 0 ? "Breakfast" : "Flexible dates",
      ],
      action: "Explore Package",
      url: buildSearchUrl(`${route} ${destination} holiday package`),
    }));
  }

  if (category === "Flights") {
    const types = [
      "Morning Saver",
      "Evening Direct",
      "Business Flex",
      "Weekend Fare",
      "Premium Comfort",
      "Early Bird",
      "Smart Economy",
      "Fastest Route",
      "Flexible Return",
      "Value Fare",
    ];

    return types.map((name, index) => ({
      name: `${route} ${name}`,
      location: route,
      rating: index % 2 === 0 ? "Direct" : "Flexible",
      price: `From ₹${(5400 + index * 900).toLocaleString("en-IN")}`,
      image: [
        "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=1400&q=90",
      ][index % 3],
      highlights: [
        index % 2 === 0 ? "Direct route" : "Flexible timing",
        "Route specific",
        index % 3 === 0 ? "Low fare" : "Good timing",
      ],
      action: "Check Flights",
      url: `https://www.google.com/travel/flights?q=${encode(route)}`,
    }));
  }

  if (category === "Trains") {
    const types = [
      "Express Route",
      "Overnight Rail",
      "AC Chair Car",
      "Sleeper Option",
      "Premium Rail",
      "Budget Rail",
      "Fast Connection",
      "Flexible Timing",
      "City Station Route",
      "Return Friendly",
    ];

    return types.map((name, index) => ({
      name: `${route} ${name}`,
      location: route,
      rating: index % 2 === 0 ? "Rail route" : "Budget",
      price: `From ₹${(650 + index * 220).toLocaleString("en-IN")}`,
      image: [
        "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1527295110-5145f6b148d0?auto=format&fit=crop&w=1400&q=90",
      ][index % 3],
      highlights: ["Route specific", "Station transfer", index % 2 === 0 ? "AC option" : "Budget option"],
      action: "Check Trains",
      url: buildSearchUrl(`${route} train schedule booking`),
    }));
  }

  if (category === "Buses") {
    const types = [
      "Volvo Sleeper",
      "AC Seater",
      "Premium Sleeper",
      "Night Coach",
      "Budget Bus",
      "Semi Sleeper",
      "Weekend Coach",
      "Flexible Boarding",
      "Business Class Bus",
      "Value Bus",
    ];

    return types.map((name, index) => ({
      name: `${route} ${name}`,
      location: route,
      rating: index % 2 === 0 ? "Sleeper" : "Value",
      price: `From ₹${(900 + index * 260).toLocaleString("en-IN")}`,
      image: [
        "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1563299796-17596ed6b017?auto=format&fit=crop&w=1400&q=90",
      ][index % 3],
      highlights: ["Exact route", index % 2 === 0 ? "Sleeper coach" : "Seater coach", "Boarding options"],
      action: "Check Buses",
      url: buildSearchUrl(`${route} bus tickets`),
    }));
  }

  if (category === "Cabs") {
    const types = [
      "Private Sedan",
      "SUV Road Trip",
      "Premium Cab",
      "Family Cab",
      "Airport Transfer",
      "One-way Cab",
      "Round Trip Cab",
      "Driver Included",
      "Comfort Ride",
      "Flexible Stops",
    ];

    return types.map((name, index) => ({
      name: `${route} ${name}`,
      location: route,
      rating: index % 2 === 0 ? "Private" : "Flexible",
      price: `From ₹${(5200 + index * 850).toLocaleString("en-IN")}`,
      image: [
        "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
        "https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?auto=format&fit=crop&w=1400&q=90",
      ][index % 3],
      highlights: ["Exact route", "Private travel", index % 3 === 0 ? "Stopovers" : "Door pickup"],
      action: "View Route",
      url: `https://www.google.com/maps/dir/${encode(source)}/${encode(destination)}`,
    }));
  }

  if (category === "Tours") {
    const tours =
      destination === "Bengaluru"
        ? [
            "Lalbagh Botanical Garden Walk",
            "Bangalore Palace Visit",
            "Cubbon Park Morning Trail",
            "Church Street Food Walk",
            "Nandi Hills Sunrise Trip",
            "Commercial Street Shopping Walk",
            "Vidhana Soudha Photo Route",
            "Indiranagar Cafe Trail",
            "Museum and Culture Circuit",
            "Brewery and Nightlife Trail",
          ]
        : [
            `${destination} City Highlights Tour`,
            `${destination} Food Walk`,
            `${destination} Heritage Circuit`,
            `${destination} Evening Experience`,
            `${destination} Local Market Walk`,
            `${destination} Nature Trail`,
            `${destination} Photography Route`,
            `${destination} Cultural Tour`,
            `${destination} Family Activity`,
            `${destination} Premium Day Tour`,
          ];

    return tours.map((name, index) => ({
      name,
      location: destination,
      rating: (4.3 + (index % 6) * 0.1).toFixed(1),
      price: `₹${(900 + index * 350).toLocaleString("en-IN")}`,
      image: TOUR_IMAGES[index % TOUR_IMAGES.length],
      highlights: [
        "Destination specific",
        index % 2 === 0 ? "Guided route" : "Local experience",
        index % 3 === 0 ? "Photo friendly" : "Flexible timing",
      ],
      action: "View Tour",
      url: buildSearchUrl(`${name} ${destination}`),
    }));
  }

  const insuranceTypes = [
    "Domestic Travel Shield",
    "Trip Delay Cover",
    "Medical Emergency Cover",
    "Lost Baggage Cover",
    "Family Travel Cover",
    "Premium Trip Protection",
    "Budget Safety Cover",
    "Weather Risk Cover",
  ];

  return insuranceTypes.map((name, index) => ({
    name: `${name} for ${destination}`,
    location: `${route}`,
    rating: index % 2 === 0 ? "Essential" : "Premium",
    price: `From ₹${(399 + index * 180).toLocaleString("en-IN")}`,
    image: [
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1400&q=90",
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=90",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=90",
    ][index % 3],
    highlights: ["Trip safety", "Budget buffer", "Travel support"],
    action: "Explore Cover",
    url: buildSearchUrl(`${destination} travel insurance ${source} to ${destination}`),
  }));
}

function getMarketplaceHeader(category, form) {
  const source = normalizeCity(form.source_city);
  const destination = normalizeCity(form.destination_city);
  const route = `${source} → ${destination}`;

  const headers = {
    Flights: {
      eyebrow: "Route Flights",
      title: `Flights for ${route}`,
      description: `Showing route-specific flight options for your ${source} to ${destination} trip.`,
    },
    Hotels: {
      eyebrow: "Destination Hotels",
      title: `Hotels in ${destination}`,
      description: `Only ${destination} stays are shown because your destination is ${destination}.`,
    },
    Homes: {
      eyebrow: "Destination Homes",
      title: `Homes and villas in ${destination}`,
      description: `Private stays, apartments and homestays for your ${destination} trip.`,
    },
    Packages: {
      eyebrow: "Holiday Packages",
      title: `${destination} packages from ${source}`,
      description: `Holiday ideas built around your actual route: ${route}.`,
    },
    Trains: {
      eyebrow: "Rail Options",
      title: `Trains for ${route}`,
      description: `Train-style options based on your exact source and destination.`,
    },
    Buses: {
      eyebrow: "Bus Options",
      title: `Buses for ${route}`,
      description: `Bus cards are generated for the route you entered, not random cities.`,
    },
    Cabs: {
      eyebrow: "Cab Routes",
      title: `Cabs for ${route}`,
      description: `Road trip and cab options for your exact route.`,
    },
    Tours: {
      eyebrow: "Destination Activities",
      title: `Things to do in ${destination}`,
      description: `Tours and activities based on your destination city.`,
    },
    Insurance: {
      eyebrow: "Trip Protection",
      title: `Protection ideas for ${route}`,
      description: `Travel safety options shaped around your route and destination.`,
    },
  };

  return headers[category] || headers.Flights;
}

export default function App() {
  const [form, setForm] = useState(DEFAULT_FORM);
  const formDraftRef = useRef(DEFAULT_FORM);

useEffect(() => {
  function handleRuntimeSettingsChanged(event) {
    const nextCurrency = String(event.detail?.currency || "").toUpperCase();

    if (!nextCurrency) return;

    setForm((current) => {
      const updatedForm = {
        ...current,
        currency: nextCurrency,
      };

      formDraftRef.current = updatedForm;
      return updatedForm;
    });
  }

  window.addEventListener("a2a_settings_changed", handleRuntimeSettingsChanged);

  return () => {
    window.removeEventListener(
      "a2a_settings_changed",
      handleRuntimeSettingsChanged,
    );
  };
}, [])
  const [result, setResult] = useState(null);
  const latestSearchIdRef = useRef(0);
  const [lastSubmittedForm, setLastSubmittedForm] = useState(null);
  const [streamEvents, setStreamEvents] = useState([]);
  const [isStreamingBackend, setIsStreamingBackend] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isPlanning, setIsPlanning] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const commitForm = useCallback((updater) => {
    const baseForm = formDraftRef.current || DEFAULT_FORM;

    const nextForm = typeof updater === "function" ? updater(baseForm) : updater;

    formDraftRef.current = nextForm;
    setForm(nextForm);

    return nextForm;
  }, []);

  const tripLength = useMemo(
    () => daysBetween(form.start_date, form.end_date),
    [form.start_date, form.end_date],
  );

const productMode = MODE_COPY[form.product_category || "Flights"];
const rawFinalPlan = result?.final_trip_plan || null;

const finalPlan = useMemo(() => {
  if (!rawFinalPlan) return null;

  const submittedForm =
    formDraftRef.current ||
    lastSubmittedForm ||
    form ||
    rawFinalPlan.request ||
    {};

  const budgetBreakdown = rawFinalPlan.budget_breakdown || {};
  const totalCost = Number(budgetBreakdown.total_estimated_cost || 0);

  const submittedBudget = parsePositiveNumber(
    submittedForm.budget,
    parsePositiveNumber(rawFinalPlan.request?.budget, 0),
  );

  return {
    ...rawFinalPlan,
    request: {
      ...(rawFinalPlan.request || {}),
      ...submittedForm,
      budget: submittedBudget,
      currency:
        submittedForm.currency ||
        rawFinalPlan.request?.currency ||
        form.currency ||
        "INR",
    },
    budget_breakdown: {
      ...budgetBreakdown,
      remaining_budget: submittedBudget - totalCost,
    },
  };
}, [rawFinalPlan, lastSubmittedForm, form]);

const budgetTone = finalPlan ? getBudgetTone(finalPlan) : null;

  const updateField = useCallback(
  (name, value) => {
    commitForm((current) => {
      const nextForm = {
        ...current,
        [name]: value,
      };

      if (name === "source_city") {
        nextForm.source_location = locationMatchesCity(
          current.source_location,
          value,
        )
          ? current.source_location
          : null;
      }

      if (name === "destination_city") {
        nextForm.destination_location = locationMatchesCity(
          current.destination_location,
          value,
        )
          ? current.destination_location
          : null;
      }

      if (name === "multi_city_stop") {
        nextForm.multi_city_stop_location = locationMatchesCity(
          current.multi_city_stop_location,
          value,
        )
          ? current.multi_city_stop_location
          : null;
      }

      if (name === "source_location") {
        nextForm.source_location = value || null;

        if (value?.name) {
          nextForm.source_city = normalizeCity(value.name);
        }
      }

      if (name === "destination_location") {
        nextForm.destination_location = value || null;

        if (value?.name) {
          nextForm.destination_city = normalizeCity(value.name);
        }
      }

      if (name === "multi_city_stop_location") {
        nextForm.multi_city_stop_location = value || null;

        if (value?.name) {
          nextForm.multi_city_stop = normalizeCity(value.name);
        }
      }

      return nextForm;
    });

    if (
      name === "budget" ||
      name === "travelers" ||
      name === "source_city" ||
      name === "destination_city"
    ) {
      setError("");
    }
  },
  [commitForm],
);

  function handleCategoryChange(category) {
    commitForm((current) => ({
      ...current,
      product_category: category,
    }));

    setResult(null);
    setError("");
    setActiveTab("overview");

    setTimeout(() => {
      document
        .getElementById("marketplace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function handleTripTypeChange(tripType) {
    commitForm((current) => ({
      ...current,
      trip_type: tripType,
      product_category:
        tripType === "multi_city" ? "Flights" : current.product_category,
      end_date:
        tripType === "round_trip" && !current.end_date
          ? current.start_date
          : current.end_date,
    }));

    setResult(null);
    setError("");
    setActiveTab("overview");
  }

  function handleSwapRoute() {
  commitForm((current) => ({
    ...current,
    source_city: current.destination_city,
    destination_city: current.source_city,
    source_location: current.destination_location || null,
    destination_location: current.source_location || null,
  }));

  setResult(null);
  setError("");
  setActiveTab("overview");
}

  function toggleInterest(id) {
    commitForm((current) => {
      const interests = Array.isArray(current.interests) ? current.interests : [];
      const exists = interests.includes(id);

      return {
        ...current,
        interests: exists
          ? interests.filter((interest) => interest !== id)
          : [...interests, id],
      };
    });
  }

  function resetForm() {
    formDraftRef.current = DEFAULT_FORM;
    setForm(DEFAULT_FORM);
    setLastSubmittedForm(null);
    setError("");
    setResult(null);
    setCopied(false);
    setActiveTab("overview");
  }
  function syncResultWithSubmittedForm(resultPayload, submittedForm) {
  if (!resultPayload || !submittedForm) return resultPayload;

  const finalPlanPayload =
    resultPayload.final_trip_plan ||
    resultPayload.final_plan ||
    resultPayload.plan ||
    resultPayload.data ||
    resultPayload;

  const budgetBreakdown = finalPlanPayload?.budget_breakdown || {};
  const totalCost = Number(budgetBreakdown.total_estimated_cost || 0);
  const submittedBudget = Number(submittedForm.budget || 0);

  const syncedFinalPlan = {
    ...finalPlanPayload,
    request: {
      ...(finalPlanPayload.request || {}),
      ...submittedForm,
      budget: submittedBudget,
      currency:
        submittedForm.currency ||
        finalPlanPayload.request?.currency ||
        "INR",
    },
    budget_breakdown: {
      ...budgetBreakdown,
      remaining_budget: submittedBudget - totalCost,
    },
  };

  if (resultPayload.final_trip_plan) {
    return {
      ...resultPayload,
      final_trip_plan: syncedFinalPlan,
    };
  }

  if (resultPayload.final_plan) {
    return {
      ...resultPayload,
      final_plan: syncedFinalPlan,
    };
  }

  if (resultPayload.plan) {
    return {
      ...resultPayload,
      plan: syncedFinalPlan,
    };
  }

  if (resultPayload.data) {
    return {
      ...resultPayload,
      data: syncedFinalPlan,
    };
  }

  return {
    ...resultPayload,
    final_trip_plan: syncedFinalPlan,
  };
}

  async function handleSubmit(payloadOrEvent = null, latestFormFromPanel = null) {
    if (payloadOrEvent && typeof payloadOrEvent.preventDefault === "function") {
      payloadOrEvent.preventDefault();
    }

    const directPayload =
      payloadOrEvent && typeof payloadOrEvent.preventDefault !== "function"
        ? payloadOrEvent
        : latestFormFromPanel;

    const rawForm = directPayload
      ? {
          ...(formDraftRef.current || form),
          ...directPayload,
        }
      : formDraftRef.current || form;

    const submittedForm = normalizeTripFormForSubmit(rawForm);
    const searchId = latestSearchIdRef.current + 1;
latestSearchIdRef.current = searchId;

formDraftRef.current = submittedForm;
setForm(submittedForm);
setLastSubmittedForm(submittedForm);
setError("");
setCopied(false);

setResult((currentResult) => {
  if (!currentResult?.final_trip_plan) return null;

  return syncResultWithSubmittedForm(currentResult, submittedForm);
});
    if (!submittedForm.source_city.trim() || !submittedForm.destination_city.trim()) {
      setError("Source and destination cities are required.");
      return;
    }

    if (new Date(submittedForm.end_date) < new Date(submittedForm.start_date)) {
      setError("Return date cannot be earlier than departure date.");
      return;
    }

    setIsPlanning(true);
    setActiveTab("overview");
    setStreamEvents([]);
    setIsStreamingBackend(true);

    setTimeout(() => {
      document
        .getElementById("plan-output")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);

    try {
      let streamedFinalResult = null;

await streamTripPlan(submittedForm, {
  onEvent: (event) => {
  setStreamEvents((current) => {
    const eventType = event?.event || event?.type || event?.name;
    const eventData = event?.data || {};
    const agentName = eventData?.agent || event?.agent;

    // When agent completes, update old running card AND nested data.status.
    if (eventType === "agent_completed" && agentName) {
      const updated = current.map((item) => {
        const itemType = item?.event || item?.type || item?.name;
        const itemData = item?.data || {};
        const itemAgent = itemData?.agent || item?.agent;

        if (itemAgent === agentName && itemType === "agent_started") {
          return {
            ...item,
            event: "agent_completed",
            type: "agent_completed",
            status: "completed",
            data: {
              ...itemData,
              ...eventData,
              status: "completed",
              description:
                eventData.description ||
                `${eventData.title || itemData.title || "Agent"} completed.`,
            },
          };
        }

        return item;
      });

      return [
        ...updated,
        {
          ...event,
          status: "completed",
          data: {
            ...eventData,
            status: "completed",
          },
        },
      ];
    }

    // When final result/completed arrives, force every remaining running card to completed.
    if (eventType === "final_result" || eventType === "completed") {
      const updated = current.map((item) => {
        const itemType = item?.event || item?.type || item?.name;
        const itemData = item?.data || {};

        if (
          itemType === "agent_started" ||
          item?.status === "running" ||
          itemData?.status === "running"
        ) {
          return {
            ...item,
            event: "agent_completed",
            type: "agent_completed",
            status: "completed",
            data: {
              ...itemData,
              status: "completed",
              description:
                itemData.description ||
                `${itemData.title || "Agent"} completed.`,
            },
          };
        }

        return item;
      });

      return [
        ...updated,
        {
          ...event,
          status: "completed",
          data: {
            ...eventData,
            status: "completed",
          },
        },
      ];
    }

    return [...current, event];
  });
},
  onFinalResult: (finalResult) => {
  streamedFinalResult = finalResult;

  setStreamEvents((current) =>
    current.map((item) => {
      const itemType = item?.event || item?.type || item?.name;
      const itemData = item?.data || {};

      if (
        itemType === "agent_started" ||
        item?.status === "running" ||
        itemData?.status === "running"
      ) {
        return {
          ...item,
          event: "agent_completed",
          type: "agent_completed",
          status: "completed",
          data: {
            ...itemData,
            status: "completed",
          },
        };
      }

      return item;
    }),
  );

  if (latestSearchIdRef.current === searchId) {
  setResult(syncResultWithSubmittedForm(finalResult, submittedForm));
}
},
  onCompleted: () => {
    setIsStreamingBackend(false);
  },
  onError: (streamError) => {
    setIsStreamingBackend(false);
    throw new Error(streamError?.description || "Backend streaming failed.");
  },
});

if (!streamedFinalResult) {
  const fallbackResult = await generateTripPlan(submittedForm);
 if (latestSearchIdRef.current === searchId) {
  setResult(syncResultWithSubmittedForm(fallbackResult, submittedForm));
}
}

      setTimeout(() => {
        document
          .getElementById("plan-output")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 220);
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Could not connect to the travel planning backend. Keep FastAPI running on port 8000.",
      );
    } finally {
  if (latestSearchIdRef.current === searchId) {
    setIsPlanning(false);
  }
}
  }

  function handleLoadSavedTrip(savedPlan) {
    setResult(savedPlan);
    setActiveTab("overview");
    setCopied(false);
    setError("");

    setTimeout(() => {
      document
        .getElementById("results")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 220);
  }

  function downloadPlan() {
    if (!finalPlan) return;

    const blob = new Blob([JSON.stringify(finalPlan, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "a2a-trip-plan.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  async function copyPlan() {
    if (!finalPlan) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(finalPlan, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function handleEditSearch() {
    setResult(null);
    setLastSubmittedForm(null);
    setError("");
    setCopied(false);
    setActiveTab("overview");

    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f5f7fb] text-slate-950">
      <HeroAndSearch
  form={form}
  tripLength={tripLength}
  productMode={productMode}
  isPlanning={isPlanning}
  error={error}
  finalPlan={finalPlan}
  onSubmit={handleSubmit}
  onFieldChange={updateField}
  onToggleInterest={toggleInterest}
  onReset={resetForm}
  onCategoryChange={handleCategoryChange}
  onTripTypeChange={handleTripTypeChange}
  onSwapRoute={handleSwapRoute}
  streamEvents={streamEvents}
  isStreamingBackend={isStreamingBackend}
/>

<section className="relative z-[1] bg-[#f5f7fb] px-4 pb-10 pt-16 sm:px-6 lg:px-10 lg:pt-20 xl:px-12">
  <div className="mx-auto w-full max-w-[1700px]">
    <ProductCategoryBar
      key={`category-bar-${form.product_category}`}
      activeCategory={form.product_category}
      onCategoryChange={handleCategoryChange}
    />
  </div>
</section>

      {!isPlanning && !finalPlan ? (
        <HomeExperience
          form={form}
          onLoadSavedTrip={handleLoadSavedTrip}
        />
      ) : null}

      <div id="plan-output" className="scroll-mt-6">
  <AnimatePresence mode="wait">
    {isPlanning ? (
      <PlanningExperience key="planning" />
    ) : finalPlan ? (
<ResultsExperience
  key={`results-${finalPlan?.request?.budget}-${finalPlan?.budget_breakdown?.remaining_budget}`}
  result={result}
  finalPlan={{ ...finalPlan }}
  latestForm={lastSubmittedForm}
  activeTab={activeTab}
  budgetTone={budgetTone}
  copied={copied}
  onTabChange={setActiveTab}
  onDownload={downloadPlan}
  onCopy={copyPlan}
  onEditSearch={handleEditSearch}
/>
    ) : (
      <ReadyToPlanExperience key="ready" />
    )}
  </AnimatePresence>
</div>

      <FloatingAIAssistant
        form={form}
        result={result}
        finalPlan={finalPlan}
        productMode={form.product_category}
      />
    </div>
  );
}
function ReadyToPlanExperience() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="relative bg-[#f5f7fb] px-4 pb-10 pt-4 sm:px-6 lg:px-10 xl:px-12"
    >
      <div className="mx-auto w-full max-w-[1580px]">
        <div className="relative overflow-hidden rounded-[2.6rem] border border-slate-200 bg-white p-7 shadow-[0_28px_90px_rgba(15,23,42,0.08)] lg:p-10">
          <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-cyan-300/15 blur-3xl" />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Ready to plan
              </div>

              <h2 className="mt-5 max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.07em] text-slate-950 sm:text-5xl lg:text-6xl">
                Build a checked trip plan from your search.
              </h2>

              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
                Enter your route, dates, travellers and budget above. When you click
                Search &amp; plan, the planner will validate the route, check pricing,
                build your itinerary and show the final budget breakdown here.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {[
                  ["01", "Route check", "Validates source, destination and trip type."],
                  ["02", "Price check", "Compares travel and stay cost against budget."],
                  ["03", "Plan build", "Creates itinerary, summary and export-ready result."],
                ].map((item) => (
                  <div
                    key={item[0]}
                    className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-xs font-black text-blue-600">{item[0]}</p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      {item[1]}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                      {item[2]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-5 shadow-xl shadow-blue-950/5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
                Output will appear here
              </p>

              <div className="mt-5 space-y-3">
                {[
                  "Trip overview",
                  "Flight and stay cards",
                  "Budget breakdown",
                  "Day-wise itinerary",
                  "Agent planning audit",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-2xl border border-blue-100 bg-white px-4 py-3"
                  >
                    <span className="text-sm font-black text-slate-700">
                      {label}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeroAndSearch({
  form,
  tripLength,
  productMode,
  isPlanning,
  error,
  finalPlan,
  onSubmit,
  onFieldChange,
  onToggleInterest,
  onReset,
  onCategoryChange,
  onTripTypeChange,
  onSwapRoute,
  streamEvents,
  isStreamingBackend,

}) {
  return (
    <section className="relative overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt="Travel booking background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.78)_0%,rgba(2,6,23,0.58)_22%,rgba(2,6,23,0.40)_45%,rgba(245,247,251,1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.14),transparent_24%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[860px] w-full max-w-[1800px] flex-col px-4 pt-4 sm:px-6 lg:px-8 xl:px-10">
        <NavigationBar />

        <div className="flex flex-1 items-start justify-center pt-6 lg:pt-7">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-[1520px]"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/80 px-4 py-2 text-sm font-black text-blue-700 shadow-lg backdrop-blur-2xl">
                <Sparkles className="h-4 w-4" />
                Route, fares and stay planning
              </div>

              <p className="hidden text-sm font-semibold text-white/85 md:block">
                Search flights, hotels and routes from one booking shell
              </p>
            </div>

            <AirlineSearchPanel
              form={form}
              tripLength={tripLength}
              productMode={productMode}
              isPlanning={isPlanning}
              error={error}
              onSubmit={onSubmit}
              onFieldChange={onFieldChange}
              onToggleInterest={onToggleInterest}
              onReset={onReset}
              onTripTypeChange={onTripTypeChange}
              onCategoryChange={onCategoryChange}
              onSwapRoute={onSwapRoute}
            />
{/* Backend audit hidden from user-facing flow for now.
    We will add it later as a collapsed "View planning audit" section. */}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function NavigationBar() {
  return <TopNavBar />;
}

function NavPill({ icon: Icon, label }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-bold text-blue-50 backdrop-blur-2xl transition hover:bg-white/15">
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function HeroStat({ title, description }) {
  return (
    <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-2xl">
      <div className="text-2xl font-black text-white">{title}</div>
      <div className="mt-1 text-sm font-semibold leading-6 text-blue-100">
        {description}
      </div>
    </div>
  );
}
function ProductCategoryBar({ activeCategory, onCategoryChange }) {
  const categoryLabels = {
    Homes: "Villas &\nHomestays",
    Packages: "Holiday\nPackages",
    Tours: "Tours &\nAttractions",
    Insurance: "Travel\nInsurance",
  };

  return (
    <section id="marketplace" className="relative z-30 px-2 py-2 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-[1450px]">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/78 px-5 py-4 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-3xl">
          <div className="pointer-events-none absolute -left-24 -top-24 h-52 w-52 rounded-full bg-blue-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 -bottom-24 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />

          <div className="relative z-10 flex items-center justify-center gap-2 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {PRODUCT_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.label;
              const label = categoryLabels[category.label] || category.label;

              return (
                <motion.button
                  key={category.label}
                  type="button"
                  onClick={() => onCategoryChange(category.label)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.96 }}
                  className="group relative flex min-w-[108px] flex-col items-center justify-center gap-2 rounded-[1.35rem] px-3 py-3 text-center transition"
                >
                  <div
                    className={[
                      "grid h-12 w-12 place-items-center rounded-2xl transition duration-300",
                      isActive
                        ? "bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-[0_16px_32px_rgba(37,99,235,0.32)]"
                        : "bg-slate-100/80 text-slate-600 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md",
                    ].join(" ")}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  <span
                    className={[
                      "whitespace-pre-line text-[14px] font-black leading-tight tracking-[-0.02em]",
                      isActive ? "text-blue-700" : "text-slate-600",
                    ].join(" ")}
                  >
                    {label}
                  </span>

                  <div className="h-1.5 w-12">
                    {isActive ? (
                      <motion.div
                        layoutId="active-category-underline"
                        className="h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 shadow-[0_8px_20px_rgba(37,99,235,0.35)]"
                      />
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function SearchCard({
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
  return (
    <div className="overflow-hidden rounded-[2.4rem] border border-white/60 bg-white/95 text-slate-950 shadow-[0_40px_160px_rgba(0,0,0,0.34)] backdrop-blur-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 bg-white/65 px-6 py-5 md:px-7">
        <TripTypeTabs
          activeTripType={form.trip_type || "one_way"}
          onChange={onTripTypeChange}
        />

        <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-emerald-50 px-4 py-2 text-sm font-black text-blue-700 ring-1 ring-blue-100">
          <BrainCircuit className="h-4 w-4" />
          {productMode.badge}
          <ChevronRight className="h-4 w-4" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="p-6 md:p-7">
        <div className="mb-5 rounded-[1.75rem] border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
            {form.product_category || "Flights"}
          </p>
          <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {productMode.title}
          </h3>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-slate-600">
            {productMode.subtitle}
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1fr_0.82fr_0.82fr]">
          <PremiumInput
            label="From"
            value={form.source_city}
            onChange={(value) => onFieldChange("source_city", value)}
            icon={Navigation}
            placeholder="Source city"
          />
          <PremiumInput
            label="To"
            value={form.destination_city}
            onChange={(value) => onFieldChange("destination_city", value)}
            icon={MapPinned}
            placeholder="Destination city"
          />
          <PremiumInput
            label="Departure"
            type="date"
            value={form.start_date}
            onChange={(value) => onFieldChange("start_date", value)}
            icon={CalendarDays}
          />
          <PremiumInput
            label={form.trip_type === "one_way" ? "Optional return" : "Return"}
            type="date"
            value={form.end_date}
            onChange={(value) => onFieldChange("end_date", value)}
            icon={CalendarDays}
          />
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_0.6fr_0.65fr]">
          <PremiumInput
            label="Budget"
            type="number"
            min="1000"
            value={form.budget}
            onChange={(value) => onFieldChange("budget", value)}
            icon={Wallet}
          />

          <PremiumSelect
            label="Currency"
            value={form.currency}
            options={CURRENCIES}
            onChange={(value) => onFieldChange("currency", value)}
            icon={Globe2}
          />

          <PremiumInput
            label="Travellers"
            type="number"
            min="1"
            value={form.travelers}
            onChange={(value) => onFieldChange("travelers", value)}
            icon={Users}
          />
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Interests
          </div>

          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const active = form.interests.includes(interest.id);

              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => onToggleInterest(interest.id)}
                  className={cx(
                    "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-black transition",
                    active
                      ? "border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50",
                  )}
                >
                  <interest.icon className="h-4 w-4" />
                  {interest.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_0.78fr]">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              Travel Style
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {TRAVEL_STYLES.map((style) => {
                const active = form.travel_style === style.id;

                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => onFieldChange("travel_style", style.id)}
                    className={cx(
                      "rounded-[1.35rem] border p-4 text-left transition duration-200 hover:-translate-y-0.5",
                      active
                        ? "border-blue-200 bg-blue-50 shadow-xl shadow-blue-600/10"
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cx(
                          "grid h-10 w-10 place-items-center rounded-2xl",
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        <style.icon className="h-5 w-5" />
                      </div>

                      {active && (
                        <div className="rounded-full bg-blue-600 px-2.5 py-1 text-xs font-black text-white">
                          Active
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-base font-black text-slate-950">
                      {style.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-500">
                      {style.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <TripSnapshot form={form} tripLength={tripLength} />
        </div>

        {error && (
          <div className="mt-5 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mt-7 flex flex-col gap-3 md:flex-row md:items-center">
          <button
            type="submit"
            disabled={isPlanning}
            className="group inline-flex flex-1 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-700 px-8 py-4 text-base font-black text-white shadow-[0_24px_60px_rgba(37,99,235,0.34)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(37,99,235,0.42)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPlanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Building your plan...
              </>
            ) : (
              <>
                {productMode.cta}
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}

function PremiumInput({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder = "",
  min,
}) {
  return (
    <label className="group block rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </div>

      <input
        type={type}
        value={value}
        min={min}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full border-none bg-transparent text-lg font-black tracking-tight text-slate-950 outline-none placeholder:text-slate-300"
      />
    </label>
  );
}

function PremiumSelect({ label, value, options, onChange, icon: Icon }) {
  return (
    <label className="block rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
        <Icon className="h-4 w-4 text-blue-600" />
        {label}
      </div>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full border-none bg-transparent text-lg font-black tracking-tight text-slate-950 outline-none"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TripSnapshot({ form, tripLength }) {
  return (
    <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/15">
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
        <Info className="h-4 w-4" />
        Trip Snapshot
      </div>

      <div className="mt-4 space-y-3">
        <SnapshotRow label="Mode" value={form.product_category || "Flights"} />
        <SnapshotRow
          label="Trip Type"
          value={getTripTypeLabel(form.trip_type || "one_way")}
        />
        <SnapshotRow
          label="Route"
          value={`${normalizeCity(form.source_city)} → ${normalizeCity(form.destination_city)}`}
        />
        <SnapshotRow
          label="Dates"
          value={`${safeDateLabel(form.start_date)} → ${safeDateLabel(
            form.end_date,
          )}`}
        />
        <SnapshotRow
          label="Duration"
          value={`${tripLength} day${tripLength > 1 ? "s" : ""}`}
        />
        <SnapshotRow
          label="Budget"
          value={formatCurrency(form.currency, form.budget)}
        />
      </div>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/10 p-3">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-right text-sm font-black text-white">{value}</span>
    </div>
  );
}

function HomeExperience({ form, onLoadSavedTrip }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="bg-[#f5f7fb] px-3 pb-20 pt-0 sm:px-4 lg:px-6 xl:px-8"
    >
      <div className="mx-auto w-full max-w-[1920px]">
        <MarketplacePage form={form} />

        <div className="mt-16">
          <SavedTripsPanel onLoadSavedTrip={onLoadSavedTrip} />
        </div>
      </div>
    </motion.section>
  );
}

function MarketplacePage({ form }) {
  return (
    <TravelCatalogPanel
      key={`catalog-${form.product_category}-${form.source_city}-${form.destination_city}-${form.start_date}-${form.end_date}`}
      form={form}
      activeCategory={form.product_category}
    />
  );
}
function TravelProductCard({ item }) {
  return (
    <article className="group overflow-hidden rounded-[2.2rem] border border-slate-200 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_36px_110px_rgba(15,23,42,0.14)]">
      <div className="relative h-64 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/16 to-transparent" />

        <div className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black text-slate-950 shadow-xl backdrop-blur-xl">
          {item.rating}
        </div>

        <div className="absolute bottom-5 left-5 right-5 text-white">
          <h3 className="text-2xl font-black tracking-[-0.055em]">
            {item.name}
          </h3>
          <p className="mt-1 text-sm font-bold text-slate-200">
            {item.location}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {item.highlights.map((highlight) => (
            <span
              key={highlight}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
            >
              {highlight}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Starting price
            </p>
            <p className="mt-1 text-2xl font-black text-slate-950">
              {item.price}
            </p>
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-3 text-xs font-black text-white transition hover:-translate-y-0.5"
          >
            {item.action}
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

function PlanningExperience() {
  return (
    <motion.section
      key="planning"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#f5f7fb] px-6 py-24 lg:px-10 xl:px-16"
    >
      <div className="mx-auto w-full max-w-[1640px] rounded-[2.5rem] border border-white/70 bg-white/85 p-8 shadow-[0_34px_100px_rgba(15,23,42,0.12)] backdrop-blur-3xl lg:p-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-center">
          <div className="relative mx-auto grid h-52 w-52 place-items-center">
            <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-4 border-dashed border-blue-500/30"
            />
            <div className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-2xl shadow-blue-600/30">
              <BrainCircuit className="h-12 w-12" />
            </div>
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Building your travel plan
            </div>

            <h2 className="mt-5 max-w-4xl text-4xl font-black tracking-[-0.06em] text-slate-950 lg:text-5xl">
              Your trip details are being organized.
            </h2>

            <p className="mt-4 max-w-3xl text-lg font-medium leading-8 text-slate-600">
              The planner is preparing stay choices, activities, weather notes,
              pricing and a complete day-wise itinerary.
            </p>

            <div className="mt-7 grid gap-4 md:grid-cols-4">
              {AGENT_STEPS.slice(0, 4).map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.12,
                    repeat: Infinity,
                    repeatType: "reverse",
                    repeatDelay: 1,
                  }}
                  className="rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <div
                    className={cx(
                      "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white",
                      step.gradient,
                    )}
                  >
                    <step.icon className="h-6 w-6" />
                  </div>
                  <p className="mt-4 text-sm font-black text-slate-950">
                    {step.title}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
function buildUserTripSummary(finalPlan) {
  const request = finalPlan.request || {};
  const budget = finalPlan.budget_breakdown || {};

  const sourceCity = request.source_city || "Source";
  const destinationCity = request.destination_city || "Destination";
  const travelStyle = request.travel_style || "balanced";
  const travelers = Number(request.travelers || 1);
  const total = Number(budget.total_estimated_cost || 0);
  const remaining = Number(budget.remaining_budget || 0);

  const startDate = request.start_date ? new Date(request.start_date) : null;
  const endDate = request.end_date ? new Date(request.end_date) : null;

  const tripDays =
    startDate && endDate
      ? Math.max(
          Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1,
          1,
        )
      : finalPlan.itinerary?.length || 1;

  const budgetText =
    remaining >= 0
      ? `You still have ${formatCurrency(request.currency, remaining)} left.`
      : `You are ${formatCurrency(request.currency, Math.abs(remaining))} over budget.`;

  return `${tripDays}-day ${travelStyle} trip from ${sourceCity} to ${destinationCity} for ${travelers} traveller${
    travelers > 1 ? "s" : ""
  }. Planned total is ${formatCurrency(request.currency, total)}. ${budgetText}`;
}

function ResultsExperience({
  result,
  finalPlan,
  latestForm,
  activeTab,
  budgetTone,
  copied,
  onTabChange,
  onDownload,
  onCopy,
  onEditSearch,
  onRequireLogin,
}) {
  const displayFinalPlan = useMemo(() => {
    if (!finalPlan) return finalPlan;

    const submittedForm = latestForm || finalPlan.request || {};
    const budgetBreakdown = finalPlan.budget_breakdown || {};
    const totalCost = Number(budgetBreakdown.total_estimated_cost || 0);

    const submittedBudget = parsePositiveNumber(
      submittedForm.budget,
      parsePositiveNumber(finalPlan.request?.budget, 0),
    );

    return {
      ...finalPlan,
      request: {
        ...(finalPlan.request || {}),
        ...submittedForm,
        budget: submittedBudget,
        currency:
          submittedForm.currency ||
          finalPlan.request?.currency ||
          "INR",
      },
      budget_breakdown: {
        ...budgetBreakdown,
        remaining_budget: submittedBudget - totalCost,
      },
    };
  }, [finalPlan, latestForm]);

  const safeFinalPlan = displayFinalPlan || finalPlan;
  const safeBudgetTone = safeFinalPlan ? getBudgetTone(safeFinalPlan) : budgetTone;
  const tripIntelligence = safeFinalPlan
  ? getTripIntelligenceScore(safeFinalPlan)
  : null;

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "itinerary", label: "Itinerary", icon: MapPinned },
    { id: "budget", label: "Budget", icon: Wallet },
    { id: "agents", label: "Planning audit", icon: Workflow },
    { id: "export", label: "Travel Kit", icon: Clipboard },
  ];

  if (!safeFinalPlan) return null;

  return (
    <motion.section
      id="results"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="bg-[#f5f7fb] px-6 py-24 lg:px-10 xl:px-16"
    >
      <div className="mx-auto w-full max-w-[1640px] rounded-[2.5rem] border border-white/70 bg-white/90 p-7 shadow-[0_34px_110px_rgba(15,23,42,0.12)] backdrop-blur-3xl lg:p-10">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Trip plan ready
            </div>

            <h2 className="mt-5 max-w-5xl text-4xl font-black tracking-[-0.06em] text-slate-950 lg:text-6xl">
              {safeFinalPlan.request.source_city} to{" "}
              {safeFinalPlan.request.destination_city}
            </h2>

            <p className="mt-5 max-w-4xl text-lg font-medium leading-9 text-slate-600">
              {buildUserTripSummary(safeFinalPlan)}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/travel/flights?q=${encodeURIComponent(
                  `${safeFinalPlan.request.source_city} to ${safeFinalPlan.request.destination_city}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5"
              >
                <Plane className="h-4 w-4" />
                Check live flights
              </a>

              <a
                href={`https://www.google.com/travel/hotels?q=${encodeURIComponent(
                  `hotels in ${safeFinalPlan.request.destination_city}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <Hotel className="h-4 w-4" />
                Check live hotels
              </a>

              <button
                type="button"
                onClick={() => onTabChange("itinerary")}
                className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700 transition hover:-translate-y-0.5 hover:bg-blue-100"
              >
                <MapPinned className="h-4 w-4" />
                View itinerary
              </button>

              {onEditSearch ? (
                <button
                  type="button"
                  onClick={onEditSearch}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Adjust search
                </button>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                {safeFinalPlan.itinerary?.length || 1} days
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                {safeFinalPlan.request.travelers || 1} traveller
                {Number(safeFinalPlan.request.travelers || 1) > 1 ? "s" : ""}
              </span>

              <span className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-700 capitalize">
                {safeFinalPlan.request.travel_style || "balanced"}
              </span>

              <span className="rounded-full border border-violet-100 bg-violet-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-violet-700">
                {safeFinalPlan.request.travel_class || "Economy / Premium Economy"}
              </span>

              <span className="rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-700">
                Plan saved
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row xl:items-center">
            {onEditSearch ? (
              <button
                type="button"
                onClick={onEditSearch}
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <RefreshCcw className="h-4 w-4" />
                Edit search
              </button>
            ) : null}

            <SaveTripButton
              finalPlan={safeFinalPlan}
              request={safeFinalPlan.request}
              onRequireLogin={onRequireLogin}
            />

            {safeBudgetTone ? (
              <div
                className={cx(
                  "inline-flex items-center gap-3 rounded-3xl border px-5 py-4 text-sm font-black",
                  safeBudgetTone.className,
                )}
              >
                <safeBudgetTone.icon className="h-5 w-5" />
                {safeBudgetTone.label}
              </div>
            ) : null}
          </div>
        </div>
        {tripIntelligence ? (
  <div className="mt-9 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-6 text-white shadow-[0_28px_90px_rgba(15,23,42,0.22)]">
    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Trip Intelligence Score
        </p>

        <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] lg:text-5xl">
          {tripIntelligence.score}/100
        </h3>

        <p className="mt-2 text-sm font-bold text-blue-100">
          {tripIntelligence.label} based on budget fit, plan coverage and pricing confidence.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
            Budget Fit
          </p>
          <p className="mt-2 text-2xl font-black">{tripIntelligence.budgetScore}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
            Coverage
          </p>
          <p className="mt-2 text-2xl font-black">{tripIntelligence.coverageScore}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-200">
            Pricing
          </p>
          <p className="mt-2 text-2xl font-black">{tripIntelligence.pricingScore}</p>
        </div>
      </div>
    </div>
  </div>
) : null}

        <MetricGrid finalPlan={safeFinalPlan} />

        <div className="mt-9 flex flex-wrap gap-3 rounded-3xl bg-slate-100/80 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition",
                activeTab === tab.id
                  ? "bg-slate-950 text-white shadow-xl shadow-slate-950/15"
                  : "text-slate-600 hover:bg-white",
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-9">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <OverviewTab key="overview" finalPlan={safeFinalPlan} />
            )}

            {activeTab === "itinerary" && (
              <ItineraryTab key="itinerary" finalPlan={safeFinalPlan} />
            )}

            {activeTab === "budget" && (
              <BudgetTab key="budget" finalPlan={safeFinalPlan} />
            )}

            {activeTab === "agents" && (
              <AgentsTab key="agents" result={result} />
            )}

            {activeTab === "export" && (
              <ExportTab
                key="export"
                finalPlan={safeFinalPlan}
                copied={copied}
                onDownload={onDownload}
                onCopy={onCopy}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  );
}
function MetricGrid({ finalPlan }) {
  const request = finalPlan.request;
  const budget = finalPlan.budget_breakdown;

  const metrics = [
    {
      label: "Total Cost",
      value: formatCurrency(request.currency, budget.total_estimated_cost),
      icon: Wallet,
      tone: "from-blue-600 to-cyan-500",
    },
    {
      label: "Remaining",
      value: formatCurrency(request.currency, budget.remaining_budget),
      icon: Gauge,
      tone:
        budget.remaining_budget >= 0
          ? "from-emerald-600 to-teal-500"
          : "from-red-600 to-orange-500",
    },
    {
      label: "Travellers",
      value: request.travelers,
      icon: Users,
      tone: "from-violet-600 to-indigo-500",
    },
    {
      label: "Trip Days",
      value: finalPlan.itinerary.length,
      icon: CalendarDays,
      tone: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="mt-9 grid gap-5 md:grid-cols-4">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5"
        >
          <div className="flex items-center justify-between">
            <div
              className={cx(
                "grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br text-white",
                metric.tone,
              )}
            >
              <metric.icon className="h-6 w-6" />
            </div>
            <TrendingUp className="h-4 w-4 text-slate-300" />
          </div>

          <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            {metric.label}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function OverviewTab({ finalPlan }) {
  const pricingMetadata = finalPlan.pricing_metadata || {};
  const flightPricing = pricingMetadata.flight_pricing || {};
  const hotelPricing = pricingMetadata.hotel_pricing || {};
  const routeFeasibility = getRouteFeasibilityScore(finalPlan);
  const planQuality = getPlanQualityScore(finalPlan);
  const weatherRisk = getWeatherRiskScore(finalPlan);

  return (
    <TabShell>
      <div className="rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Route Feasibility Score
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
        {routeFeasibility.score}/100
      </h3>

      <p className="mt-2 text-base font-black text-slate-800">
        {routeFeasibility.label}
      </p>

      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Checks route validity, selected flight/stay coverage, trip type and price confidence.
      </p>
    </div>

    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 lg:min-w-[360px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        Route notes
      </p>

      <div className="mt-3 space-y-2">
        {(routeFeasibility.issues.length
          ? routeFeasibility.issues
          : ["Route looks ready for planning."]
        ).map((issue) => (
          <div
            key={issue}
            className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600"
          >
            {issue}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
<div className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Plan Quality Score
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
        {planQuality.score}/100
      </h3>

      <p className="mt-2 text-base font-black text-slate-800">
        {planQuality.label}
      </p>

      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Measures how complete the generated trip plan is across flight, stay,
        itinerary, budget and booking continuation.
      </p>
    </div>

    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:min-w-[420px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        Quality signals
      </p>

      <div className="mt-3 space-y-2">
        {planQuality.signals.map((signal) => (
          <div
            key={signal}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200"
          >
            {signal}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
<div className="mt-5 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Weather Risk Score
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
        {weatherRisk.score}/100
      </h3>

      <p className="mt-2 text-base font-black text-slate-800">
        {weatherRisk.label}
      </p>

      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Reviews available weather notes and itinerary text to warn about rain,
        storms, heat, fog or comfort issues.
      </p>
    </div>

    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:min-w-[420px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        Weather signals
      </p>

      <div className="mt-3 space-y-2">
        {weatherRisk.signals.map((signal) => (
          <div
            key={signal}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200"
          >
            {signal}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>


      <div className="mt-7 grid gap-7 xl:grid-cols-2">
        <RecommendedFlightCard
          flight={finalPlan.selected_flight}
          currency={finalPlan.request.currency}
          pricing={flightPricing}
        />

        <RecommendedHotelCard
          hotel={finalPlan.selected_hotel}
          currency={finalPlan.request.currency}
          pricing={hotelPricing}
        />
      </div>

      <div className="mt-10">
        <SectionHeader
          eyebrow="Travel actions"
          title="Continue from your plan"
          description="Use the buttons below to continue searching for flight, stay and activity options."
        />
        <BookingLinks links={finalPlan.booking_links} />
      </div>
    </TabShell>
  );
}
function LivePricingSummary({ finalPlan, pricingMetadata }) {
  const budget = finalPlan.budget_breakdown || {};
  const priceSource = pricingMetadata.price_source || "unknown";
  const confidence = pricingMetadata.confidence || "unknown";
  const flightSource = pricingMetadata.flight_pricing?.source || "unknown";
  const hotelSource = pricingMetadata.hotel_pricing?.source || "unknown";

  const isFullyLive = priceSource === "live_api";
  const isMixed = priceSource === "mixed_live_and_fallback";

const title = isFullyLive
  ? "Live prices verified"
  : isMixed
    ? "Partially verified prices"
    : "Real-time prices need recheck";

const description = isFullyLive
  ? "Flight and hotel prices were checked from live providers before building this plan."
  : isMixed
    ? "One travel component was verified live. The remaining component needs a fresh check before booking."
    : "The live provider did not return complete prices for this route/date. The plan is still useful, but the user should recheck fare availability before booking.";

  return (
    <div
      className={[
        "rounded-[2rem] border p-5 shadow-[0_22px_70px_rgba(15,23,42,0.08)]",
isFullyLive
  ? "border-emerald-200 bg-emerald-50"
  : isMixed
    ? "border-amber-200 bg-amber-50"
    : "border-blue-200 bg-blue-50"
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p
            className={[
              "text-xs font-black uppercase tracking-[0.18em]",
isFullyLive
  ? "text-emerald-700"
  : isMixed
    ? "text-amber-700"
    : "text-blue-700"
            ].join(" ")}
          >
            Pricing quality
          </p>

          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            {title}
          </h3>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
            {description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
          <PricingMiniStat label="Flight" value={formatSourceLabel(flightSource)} />
          <PricingMiniStat label="Hotel" value={formatSourceLabel(hotelSource)} />
          <PricingMiniStat label="Status" value={formatConfidenceLabel(confidence)} />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <PricingCostChip
          label="Flights"
          value={formatCurrency(finalPlan.request.currency, budget.flights || 0)}
        />
        <PricingCostChip
          label="Hotels"
          value={formatCurrency(finalPlan.request.currency, budget.hotels || 0)}
        />
        <PricingCostChip
          label="Trip total"
          value={formatCurrency(
            finalPlan.request.currency,
            budget.total_estimated_cost || 0,
          )}
        />
        <PricingCostChip
          label="Budget gap"
          value={formatCurrency(
            finalPlan.request.currency,
            budget.remaining_budget || 0,
          )}
        />
      </div>
    </div>
  );
}
function PricingMiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-black capitalize text-slate-950">
        {value}
      </p>
    </div>
  );
}

function PricingCostChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-lg font-black text-slate-950">{value}</p>
    </div>
  );
}

function formatSourceLabel(source) {
  if (source === "live_api") return "Live checked";
  if (source === "fallback_estimate") return "Recheck needed";
  if (source === "mixed_live_and_fallback") return "Partially checked";
  return "Recheck needed";
}

function formatConfidenceLabel(confidence) {
  if (confidence === "high") return "Ready to compare";
  if (confidence === "medium") return "Needs one recheck";
  if (confidence === "low") return "Planning estimate";
  return "Planning estimate";
}
function RecommendedFlightCard({ flight, currency }) {
  return (
    <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/5">
      <div className="bg-gradient-to-r from-blue-700 to-cyan-500 p-7 text-white">
        <div className="flex items-center justify-between">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <Plane className="h-7 w-7" />
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
            Suggested flight
          </div>
        </div>

        <h3 className="mt-6 text-3xl font-black tracking-tight">
          {flight.airline}
        </h3>
        <p className="text-sm font-bold text-blue-100">
          {flight.flight_number} · {flight.duration}
        </p>
      </div>

      <div className="p-7">
        <div className="flex items-center justify-between gap-4">
          <RoutePoint label={flight.source_city} time={flight.departure_time} />
          <div className="flex flex-1 items-center gap-2">
            <div className="h-px flex-1 bg-slate-200" />
            <Plane className="h-5 w-5 text-blue-600" />
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <RoutePoint
            label={flight.destination_city}
            time={flight.arrival_time}
            align="right"
          />
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
            Selected fare
                </p>
            <p className="mt-1 text-4xl font-black text-slate-950">
              {formatCurrency(currency, flight.price)}
            </p>
          </div>

          <a
            href={flight.booking_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            Search flight
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function RecommendedHotelCard({ hotel, currency }) {
  return (
    <div className="overflow-hidden rounded-[2.25rem] border border-slate-200 bg-white shadow-2xl shadow-slate-950/5">
      <div className="bg-gradient-to-r from-slate-950 to-violet-700 p-7 text-white">
        <div className="flex items-center justify-between">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <Hotel className="h-7 w-7" />
          </div>
          <div className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-black">
            Suggested stay
          </div>
        </div>

        <h3 className="mt-6 text-3xl font-black tracking-tight">{hotel.name}</h3>
        <p className="text-sm font-bold text-violet-100">{hotel.location}</p>
      </div>

      <div className="p-7">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-2 text-sm font-black text-amber-700">
            <Star className="h-4 w-4 fill-amber-500" />
            {hotel.rating} rating
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700">
            {hotel.nights} nights
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {hotel.amenities.map((amenity) => (
            <span
              key={amenity}
              className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700"
            >
              {amenity}
            </span>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Stay total
            </p>
            <p className="mt-1 text-4xl font-black text-slate-950">
              {formatCurrency(currency, hotel.total_price)}
            </p>
          </div>

          <a
            href={hotel.booking_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5"
          >
            Search stay
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

function RoutePoint({ label, time, align = "left" }) {
  return (
    <div className={cx("min-w-0", align === "right" && "text-right")}>
      <p className="text-3xl font-black text-slate-950">{time}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function ItineraryTab({ finalPlan }) {
  return (
    <TabShell>
      <SectionHeader
        eyebrow="Daily Plan"
        title="Day-by-day itinerary"
        description="Each day combines travel, stay, activity, weather and budget estimates."
      />

      <div className="mt-7 space-y-5">
        {finalPlan.itinerary.map((day, index) => (
          <ItineraryDayCard
            key={`${day.day}-${day.date}`}
            day={day}
            currency={finalPlan.request.currency}
            index={index}
          />
        ))}
      </div>
    </TabShell>
  );
}

function ItineraryDayCard({ day, currency, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5"
    >
      <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-[4rem] bg-blue-50" />

      <div className="relative z-10 grid gap-7 xl:grid-cols-[180px_1fr]">
        <div>
          <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-black text-white shadow-xl shadow-blue-600/20">
            {day.day}
          </div>
          <p className="mt-4 text-sm font-black text-slate-500">{day.date}</p>
          <p className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
            {formatCurrency(currency, day.estimated_cost)}
          </p>
        </div>

        <div>
          <h3 className="text-3xl font-black tracking-[-0.05em] text-slate-950">
            {day.title}
          </h3>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <TimeBlock label="Morning" value={day.morning} />
            <TimeBlock label="Afternoon" value={day.afternoon} />
            <TimeBlock label="Evening" value={day.evening} />
          </div>

          <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <CloudSun className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-black text-amber-800">Weather note</p>
                <p className="mt-1 text-sm font-medium leading-6 text-amber-700">
                  {day.weather_note || "No weather note available."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TimeBlock({ label, value }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
        {label}
      </p>
      <p className="mt-3 text-sm font-medium leading-7 text-slate-700">
        {value}
      </p>
    </div>
  );
}

function BudgetTab({ finalPlan }) {
const currency = finalPlan.request.currency;
const budget = finalPlan.budget_breakdown;
const pricingMetadata = finalPlan.pricing_metadata || {};
const budgetHealth = getBudgetHealthScore(finalPlan);
const priceConfidence = getPriceConfidenceScore(finalPlan);
const flightPricing = pricingMetadata.flight_pricing || {};
const hotelPricing = pricingMetadata.hotel_pricing || {};
const pricingConfidence = pricingMetadata.confidence || "low";

  const rows = [
    { label: "Flights", value: budget.flights, icon: Plane, gradient: "from-blue-600 to-cyan-500" },
    { label: "Hotels", value: budget.hotels, icon: Hotel, gradient: "from-violet-600 to-indigo-500" },
    { label: "Activities", value: budget.activities, icon: Activity, gradient: "from-orange-500 to-red-500" },
    { label: "Food", value: budget.food, icon: Palmtree, gradient: "from-emerald-500 to-teal-600" },
    { label: "Local Transport", value: budget.local_transport, icon: Car, gradient: "from-slate-700 to-slate-900" },
    { label: "Safety Buffer", value: budget.buffer, icon: ShieldCheck, gradient: "from-amber-500 to-orange-500" },
  ];

  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

 return (
  <TabShell>
    <SectionHeader
      eyebrow="Budget"
      title="Detailed cost breakdown"
      description="The pricing view explains where the money goes and how much budget remains."
    />
    <div className="mt-7 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-br from-white via-blue-50 to-cyan-50 p-6 shadow-[0_22px_70px_rgba(15,23,42,0.08)]">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-700">
        Budget Health Score
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
        {budgetHealth.score}/100
      </h3>

      <p className="mt-2 text-base font-black text-slate-800">
        {budgetHealth.label}
      </p>

      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        {budgetHealth.message}
      </p>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[420px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Budget Used
        </p>
        <p className="mt-2 text-2xl font-black text-slate-950">
          {budgetHealth.usagePercent}%
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
          Remaining
        </p>
        <p className="mt-2 text-2xl font-black text-slate-950">
          {formatCurrency(currency, budgetHealth.remaining)}
        </p>
      </div>
    </div>
  </div>
</div>
<div className="mt-5 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_22px_70px_rgba(15,23,42,0.06)]">
  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
    <div>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        Price Confidence Score
      </p>

      <h3 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-950">
        {priceConfidence.score}/100
      </h3>

      <p className="mt-2 text-base font-black text-slate-800">
        {priceConfidence.label}
      </p>

      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
        Shows how reliable the pricing data is before booking.
      </p>
    </div>

    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 lg:min-w-[420px]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        Pricing signals
      </p>

      <div className="mt-3 space-y-2">
        {priceConfidence.signals.map((signal) => (
          <div
            key={signal}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-slate-600 ring-1 ring-slate-200"
          >
            {signal}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

    <div className="mt-7 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Pricing verification
          </p>

          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-slate-950">
            {formatConfidenceLabel(pricingConfidence)}
          </h3>

          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Live providers are checked when available. If a provider does not return a reliable price, the plan marks that part for recheck before booking.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
          <PricingMiniStat
            label="Flight price"
            value={formatSourceLabel(flightPricing.source)}
          />

          <PricingMiniStat
            label="Hotel price"
            value={formatSourceLabel(hotelPricing.source)}
          />
        </div>
      </div>
    </div>

    <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_0.7fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5">
          <div className="space-y-6">
            {rows.map((row) => {
              const width = `${Math.max((row.value / maxValue) * 100, 8)}%`;

              return (
                <div key={row.label}>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cx("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white", row.gradient)}>
                        <row.icon className="h-5 w-5" />
                      </div>
                      <span className="font-black text-slate-900">{row.label}</span>
                    </div>

                    <span className="font-black text-slate-950">
                      {formatCurrency(currency, row.value)}
                    </span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width }}
                      transition={{ duration: 0.6 }}
                      className={cx("h-full rounded-full bg-gradient-to-r", row.gradient)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-5">
          <BudgetBigCard
            label="Planned Trip Cost"
            value={formatCurrency(currency, budget.total_estimated_cost)}
            icon={BadgeDollarSign}
            gradient="from-blue-700 to-cyan-500"
          />

          <BudgetBigCard
            label="Remaining Budget"
            value={formatCurrency(currency, budget.remaining_budget)}
            icon={Wallet}
            gradient={
              budget.remaining_budget >= 0
                ? "from-emerald-600 to-teal-500"
                : "from-red-600 to-orange-500"
            }
          />
        </div>
      </div>
    </TabShell>
  );
}

function BudgetBigCard({ label, value, icon: Icon, gradient }) {
  return (
    <div className={cx("rounded-[2rem] bg-gradient-to-br p-7 text-white shadow-xl", gradient)}>
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
        <Icon className="h-7 w-7" />
      </div>

      <p className="mt-5 text-sm font-bold uppercase tracking-[0.16em] text-white/70">
        {label}
      </p>
      <p className="mt-1 text-4xl font-black tracking-tight">{value}</p>
    </div>
  );
}

function AgentsTab({ result }) {
  return (
    <TabShell>
      <AgentWorkflowTimeline
        agentTrace={result.agent_trace || []}
        a2aMessages={result.a2a_messages || []}
        executionRecords={result.execution_records || []}
      />

      <div className="mt-10 grid gap-7 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5">
          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Planning timeline
          </h3>

          <div className="mt-6 space-y-3">
            {(result.orchestration_logs || []).map((log, index) => (
              <div key={`${log}-${index}`} className="flex gap-4 rounded-3xl bg-slate-50 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-black text-white">
                  {index + 1}
                </div>
                <p className="text-sm font-semibold leading-6 text-slate-700">{log}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-xl shadow-slate-950/5">
          <h3 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
            Planning roles
          </h3>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {AGENT_STEPS.map((step) => (
              <div key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className={cx("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white", step.gradient)}>
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 font-black text-slate-950">{step.title}</p>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TabShell>
  );
}

function buildTravelKitText(finalPlan) {
  const request = finalPlan.request || {};
  const budget = finalPlan.budget_breakdown || {};
  const flight = finalPlan.selected_flight || {};
  const hotel = finalPlan.selected_hotel || {};
  const itinerary = finalPlan.itinerary || [];

  const lines = [
    "A2A Trip - Travel Kit",
    "======================",
    "",
    `Route: ${request.source_city || "Source"} → ${request.destination_city || "Destination"}`,
    `Dates: ${safeDateLabel(request.start_date)} → ${safeDateLabel(request.end_date)}`,
    `Travellers: ${request.travelers || 1}`,
    `Travel style: ${request.travel_style || "balanced"}`,
    `Total estimated cost: ${formatCurrency(request.currency || "INR", budget.total_estimated_cost || 0)}`,
    `Remaining budget: ${formatCurrency(request.currency || "INR", budget.remaining_budget || 0)}`,
    "",
    "Recommended flight",
    "------------------",
    flight.airline
      ? `${flight.airline} ${flight.flight_number || ""} · ${flight.departure_time || ""} → ${flight.arrival_time || ""} · ${flight.duration || ""}`
      : "No flight selected yet.",
    "",
    "Recommended stay",
    "----------------",
    hotel.name
      ? `${hotel.name} · ${hotel.location || request.destination_city || ""} · ${hotel.nights || 0} nights · ${formatCurrency(request.currency || "INR", hotel.total_price || 0)}`
      : "No stay selected yet.",
    "",
    "Day-wise itinerary",
    "------------------",
    ...itinerary.flatMap((day) => [
      `Day ${day.day || ""} · ${day.date || ""} · ${day.title || ""}`,
      `Morning: ${day.morning || "Not planned"}`,
      `Afternoon: ${day.afternoon || "Not planned"}`,
      `Evening: ${day.evening || "Not planned"}`,
      `Estimated cost: ${formatCurrency(request.currency || "INR", day.estimated_cost || 0)}`,
      "",
    ]),
    "Travel checklist",
    "----------------",
    "[ ] Confirm flight timing and baggage rules",
    "[ ] Save hotel address and check-in time",
    "[ ] Keep government ID / passport ready",
    "[ ] Save emergency contacts",
    "[ ] Keep payment backup and offline route screenshots",
    "[ ] Check weather before leaving",
  ];

  return lines.join("\n");
}

function buildTravelActions(finalPlan) {
  const request = finalPlan.request || {};
  const source = request.source_city || "";
  const destination = request.destination_city || "";
  const destinationQuery = encodeURIComponent(destination || "travel destination");
  const routeQuery = `${encodeURIComponent(source)} ${encodeURIComponent(destination)}`;

  return [
    {
      label: "Open route map",
      helper: "See the source-to-destination route in Google Maps.",
      icon: Route,
      href: `https://www.google.com/maps/dir/${encodeURIComponent(source)}/${encodeURIComponent(destination)}`,
    },
    {
      label: "Search stays",
      helper: "Continue hotel research for your destination.",
      icon: Hotel,
      href: `https://www.google.com/search?q=${destinationQuery}+hotels+booking`,
    },
    {
      label: "Search flights",
      helper: "Look for live flight options and updated fares.",
      icon: Plane,
      href: `https://www.google.com/search?q=flights+${routeQuery}`,
    },
    {
      label: "Destination guide",
      helper: "Find real things to do, food spots and travel tips.",
      icon: MapPinned,
      href: `https://www.google.com/search?q=${destinationQuery}+things+to+do+travel+guide`,
    },
  ];
}

function ExportTab({ finalPlan, copied, onDownload, onCopy }) {
  const [kitCopied, setKitCopied] = useState(false);
  const request = finalPlan.request || {};
  const budget = finalPlan.budget_breakdown || {};
  const itinerary = finalPlan.itinerary || [];
  const travelKitText = buildTravelKitText(finalPlan);
  const actions = buildTravelActions(finalPlan);

  async function copyTravelKit() {
    await navigator.clipboard.writeText(travelKitText);
    setKitCopied(true);

    setTimeout(() => {
      setKitCopied(false);
    }, 2200);
  }

  function downloadTravelKit() {
    const blob = new Blob([travelKitText], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${request.source_city || "trip"}-to-${request.destination_city || "plan"}-travel-kit.txt`
      .toLowerCase()
      .replace(/\s+/g, "-");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const checklist = [
    "Confirm flight timing and baggage rules",
    "Save hotel address and check-in time",
    "Carry ID / passport and ticket screenshots",
    "Keep emergency contacts and payment backup",
    "Check weather and pack accordingly",
    "Share itinerary with a friend or family member",
  ];

  return (
    <TabShell>
      <SectionHeader
        eyebrow="Travel Kit"
        title="Useful actions for the actual trip"
        description="Instead of showing raw JSON, this gives the user practical next steps: copy a clean trip summary, download a travel kit, open maps, continue booking research and follow a checklist."
      />

      <div className="mt-7 grid gap-7 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                  Trip summary
                </p>
                <h3 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">
                  {request.source_city} → {request.destination_city}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  {safeDateLabel(request.start_date)} to {safeDateLabel(request.end_date)} · {request.travelers || 1} traveller{Number(request.travelers || 1) > 1 ? "s" : ""}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-950 px-5 py-4 text-right text-white">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Planned Cost
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatCurrency(request.currency, budget.total_estimated_cost || 0)}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={copyTravelKit}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-0.5"
              >
                {kitCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {kitCopied ? "Travel kit copied" : "Copy trip summary"}
              </button>

              <button
                type="button"
                onClick={downloadTravelKit}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-0.5 hover:bg-slate-50"
              >
                <Download className="h-4 w-4 text-blue-600" />
                Download travel kit
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
              Continue planning
            </p>

            <div className="mt-5 grid gap-3">
              {actions.map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-blue-700 shadow-sm">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-black text-slate-950">{action.label}</p>
                      <p className="text-sm font-semibold leading-6 text-slate-500">
                        {action.helper}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-blue-700" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                  Trip checklist
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  Before you leave
                </h3>
              </div>
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            </div>

            <div className="mt-5 space-y-3">
              {checklist.map((item) => (
                <label
                  key={item}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white"
                >
                  <input type="checkbox" className="mt-1 h-4 w-4 accent-blue-600" />
                  <span className="text-sm font-semibold leading-6 text-slate-700">
                    {item}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Day-wise preview
            </p>

            <div className="mt-5 space-y-3">
              {itinerary.slice(0, 4).map((day) => (
                <div key={`${day.day}-${day.date}`} className="rounded-2xl bg-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black">Day {day.day}</p>
                    <p className="text-xs font-bold text-slate-300">{day.date}</p>
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-200">
                    {day.title}
                  </p>
                </div>
              ))}
            </div>

            {itinerary.length > 4 && (
              <p className="mt-4 text-sm font-semibold text-slate-300">
                + {itinerary.length - 4} more day{itinerary.length - 4 > 1 ? "s" : ""} in the itinerary tab.
              </p>
            )}
          </div>

        </div>
      </div>
    </TabShell>
  );
}

function BookingLinks({ links }) {
  if (!links?.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-500">
        No travel actions available.
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      {links.map((link, index) => (
        <a
          key={`${link}-${index}`}
          href={link}
          target="_blank"
          rel="noreferrer"
          className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-950/5 transition hover:-translate-y-0.5 hover:border-blue-200"
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-slate-950">
                Continue Search {index + 1}
              </p>
              <p className="text-sm font-semibold text-slate-500">
                Opens a matching travel search page
              </p>
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600" />
        </a>
      ))}
    </div>
  );
}

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-3xl font-black tracking-[-0.055em] text-slate-950 lg:text-4xl">
        {title}
      </h3>
      {description && (
        <p className="mt-3 max-w-4xl text-base font-medium leading-8 text-slate-500">
          {description}
        </p>
      )}
    </div>
  );
}

function TabShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
}
