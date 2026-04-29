const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function askAITravelAssistant({
  message,
  tripContext = {},
  history = [],
}) {
  const cleanMessage = String(message || "").trim();

  if (!cleanMessage) {
    throw new Error("Please type a question first.");
  }

  const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: cleanMessage,
      trip_context: tripContext,
      history,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "AI assistant request failed.");
  }

  return data;
}

export function buildTripContext({ form, result, finalPlan, productMode }) {
  const plan = finalPlan || result || {};

  return {
    source_city:
      form?.source_city ||
      plan?.request?.source_city ||
      plan?.source_city ||
      "",
    destination_city:
      form?.destination_city ||
      plan?.request?.destination_city ||
      plan?.destination_city ||
      "",
    start_date:
      form?.start_date ||
      plan?.request?.start_date ||
      plan?.start_date ||
      "",
    end_date:
      form?.end_date ||
      plan?.request?.end_date ||
      plan?.end_date ||
      "",
    budget:
      form?.budget ||
      plan?.request?.budget ||
      plan?.budget ||
      "",
    currency:
      form?.currency ||
      plan?.request?.currency ||
      plan?.currency ||
      "INR",
    travelers:
      form?.travelers ||
      form?.travellers ||
      plan?.request?.travelers ||
      plan?.request?.travellers ||
      1,
    travel_style:
      form?.travel_style ||
      plan?.request?.travel_style ||
      "balanced",
    trip_type:
      form?.trip_type ||
      plan?.request?.trip_type ||
      "one_way",
    product_category:
      form?.product_category ||
      productMode ||
      plan?.request?.product_category ||
      "Flights",
    interests:
      form?.interests ||
      plan?.request?.interests ||
      [],
    selected_flight: plan?.selected_flight || null,
    selected_hotel: plan?.selected_hotel || null,
    selected_tour: plan?.selected_tour || null,
    budget_breakdown: plan?.budget_breakdown || null,
    itinerary: plan?.itinerary || [],
    summary: plan?.summary || "",
  };
}