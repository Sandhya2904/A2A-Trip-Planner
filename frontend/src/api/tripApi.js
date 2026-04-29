const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.detail?.message ||
      body?.message ||
      body?.detail?.error ||
      "API request failed.";

    throw new Error(message);
  }

  return body;
}

function normalizeDate(value) {
  return value ? String(value).slice(0, 10) : "";
}

function getLocationName(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value;
  }

  return (
    value.name ||
    value.city ||
    value.label ||
    value.destination_city ||
    value.source_city ||
    ""
  );
}

function buildTripPayload(form) {
  const tripType = form.trip_type || "one_way";

  const sourceCity = getLocationName(form.source_city);
  const destinationCity = getLocationName(form.destination_city);

  const payload = {
    source_city: sourceCity,
    destination_city: destinationCity,
    start_date: normalizeDate(form.start_date),
    end_date: normalizeDate(form.end_date || form.start_date),
    budget: Number(form.budget || 0),
    currency: (form.currency || "INR").toUpperCase(),
    travelers: Number(form.travelers || 1),
    interests: Array.isArray(form.interests) ? form.interests : [],
    travel_style: form.travel_style || "balanced",
    trip_type: tripType,
    route_legs: [],
  };

  if (tripType === "round_trip") {
    payload.route_legs = [
      {
        source_city: payload.source_city,
        destination_city: payload.destination_city,
        travel_date: payload.start_date,
      },
      {
        source_city: payload.destination_city,
        destination_city: payload.source_city,
        travel_date: payload.end_date,
      },
    ];

    return payload;
  }

  if (tripType === "multi_city") {
    const thirdCity =
      getLocationName(form.multi_city_stop) ||
      getLocationName(form.third_city) ||
      getLocationName(form.city_3) ||
      "Mumbai";

    const secondLegDate = normalizeDate(
      form.multi_city_date || form.end_date || form.start_date,
    );

    return {
      ...payload,
      destination_city: thirdCity,
      end_date: secondLegDate,
      route_legs: [
        {
          source_city: payload.source_city,
          destination_city: payload.destination_city,
          travel_date: normalizeDate(form.start_date),
        },
        {
          source_city: payload.destination_city,
          destination_city: thirdCity,
          travel_date: secondLegDate,
        },
      ],
    };
  }

  payload.route_legs = [
    {
      source_city: payload.source_city,
      destination_city: payload.destination_city,
      travel_date: payload.start_date,
    },
  ];

  return payload;
}

export async function generateTripPlan(tripRequest) {
  const payload = buildTripPayload(tripRequest);

  const body = await request("/api/plan-trip", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!body.success) {
    throw new Error(body.message || "Trip planning failed.");
  }

  return body.data;
}

export async function getLiveHotels(destinationCity, limit = 10) {
  const params = new URLSearchParams({
    destination_city: getLocationName(destinationCity),
    limit: String(limit),
  });

  const body = await request(`/api/live/hotels?${params.toString()}`);

  if (!body.success) {
    throw new Error(body.message || "Failed to load live hotels.");
  }

  return body;
}

export async function streamTripPlan(tripRequest, handlers = {}) {
  const payload = buildTripPayload(tripRequest);

  const response = await fetch(`${API_BASE_URL}/api/plan-trip/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    const message =
      body?.detail?.message ||
      body?.detail?.error ||
      body?.message ||
      "Streaming trip planning failed.";

    throw new Error(message);
  }

  if (!response.body) {
    throw new Error("Streaming response body is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() || "";

    for (const chunk of chunks) {
      const parsedEvent = parseServerSentEvent(chunk);

      if (!parsedEvent) continue;

      handlers.onEvent?.(parsedEvent);

      if (parsedEvent.event === "final_result") {
        handlers.onFinalResult?.(parsedEvent.data?.result);
      }

      if (parsedEvent.event === "completed") {
        handlers.onCompleted?.(parsedEvent.data);
      }

      if (parsedEvent.event === "error") {
        handlers.onError?.(parsedEvent.data);
      }
    }
  }
}

function parseServerSentEvent(rawChunk) {
  const lines = rawChunk.split("\n");

  let event = "message";
  let data = "";

  for (const line of lines) {
    if (line.startsWith("event:")) {
      event = line.replace("event:", "").trim();
    }

    if (line.startsWith("data:")) {
      data += line.replace("data:", "").trim();
    }
  }

  if (!data) {
    return null;
  }

  try {
    return {
      event,
      data: JSON.parse(data),
      receivedAt: new Date().toISOString(),
    };
  } catch {
    return {
      event,
      data: {
        raw: data,
      },
      receivedAt: new Date().toISOString(),
    };
  }
}

export async function listSavedTripPlans(filters = {}) {
  const params = new URLSearchParams();

  if (filters.limit) {
    params.set("limit", String(filters.limit));
  }

  if (filters.source_city) {
    params.set("source_city", getLocationName(filters.source_city));
  }

  if (filters.destination_city) {
    params.set("destination_city", getLocationName(filters.destination_city));
  }

  const query = params.toString();
  const endpoint = query ? `/api/trip-plans?${query}` : "/api/trip-plans";

  const body = await request(endpoint);

  if (!body.success) {
    throw new Error(body.message || "Failed to load saved trips.");
  }

  return body.data;
}

export async function getSavedTripPlan(planId) {
  const body = await request(`/api/trip-plans/${planId}`);

  if (!body.success) {
    throw new Error(body.message || "Failed to load saved trip.");
  }

  return body.data;
}

export async function deleteSavedTripPlan(planId) {
  const body = await request(`/api/trip-plans/${planId}`, {
    method: "DELETE",
  });

  if (!body.success) {
    throw new Error(body.message || "Failed to delete saved trip.");
  }

  return body;
}

export async function getApiHealth() {
  return request("/api/health");
}

export async function getTravelCatalog({
  category = "Hotels",
  source_city = "Kolkata",
  destination_city = "Bengaluru",
  limit = 10,
}) {
  const params = new URLSearchParams({
    category,
    source_city: getLocationName(source_city),
    destination_city: getLocationName(destination_city),
    limit: String(limit),
  });

  const body = await request(`/api/catalog?${params.toString()}`);

  if (!body.success) {
    throw new Error(body.message || "Failed to load travel catalog.");
  }

  return body;
}

export async function searchLocations(query, limit = 10) {
  const cleanQuery = String(query || "").trim();

  if (cleanQuery.length < 2) {
    return [];
  }

  const params = new URLSearchParams({
    q: cleanQuery,
    limit: String(limit),
  });

  const body = await request(`/api/locations/search?${params.toString()}`);

  if (!body.success) {
    throw new Error(body.message || "Failed to search locations.");
  }

  return Array.isArray(body.data) ? body.data : [];
}