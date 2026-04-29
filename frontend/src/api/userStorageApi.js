const SAVED_TRIPS_KEY = "a2a_saved_trips";
const WISHLIST_KEY = "a2a_wishlist";

function getCurrentUser() {
  try {
    const rawUser = localStorage.getItem("a2a_user");
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getUserKey() {
  const user = getCurrentUser();
  return user?.identifier || user?.email || "guest";
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) {
    return `${prefix}_${window.crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getSavedTrips() {
  const userKey = getUserKey();

  return readStorage(SAVED_TRIPS_KEY)
    .filter((trip) => trip.user_key === userKey)
    .sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
}

export function saveTripPlan({ tripPlan, request, title }) {
  if (!tripPlan) {
    throw new Error("Trip plan is required.");
  }

  const userKey = getUserKey();
  const existingTrips = readStorage(SAVED_TRIPS_KEY);

  const sourceCity =
    tripPlan?.request?.source_city || request?.source_city || "Source";

  const destinationCity =
    tripPlan?.request?.destination_city ||
    request?.destination_city ||
    "Destination";

  const savedTrip = {
    id: makeId("trip"),
    user_key: userKey,
    title: title || `${sourceCity} to ${destinationCity}`,
    source_city: sourceCity,
    destination_city: destinationCity,
    start_date: tripPlan?.request?.start_date || request?.start_date || "",
    end_date: tripPlan?.request?.end_date || request?.end_date || "",
    budget: tripPlan?.request?.budget || request?.budget || 0,
    currency: tripPlan?.request?.currency || request?.currency || "INR",
    trip_type: tripPlan?.request?.trip_type || request?.trip_type || "one_way",
    saved_at: new Date().toISOString(),
    trip_plan: tripPlan,
  };

  writeStorage(SAVED_TRIPS_KEY, [savedTrip, ...existingTrips]);

  return savedTrip;
}

export function deleteSavedTrip(tripId) {
  const existingTrips = readStorage(SAVED_TRIPS_KEY);

  const updatedTrips = existingTrips.filter((trip) => trip.id !== tripId);

  writeStorage(SAVED_TRIPS_KEY, updatedTrips);

  return updatedTrips;
}

export function clearCurrentUserSavedTrips() {
  const userKey = getUserKey();
  const existingTrips = readStorage(SAVED_TRIPS_KEY);

  const updatedTrips = existingTrips.filter((trip) => trip.user_key !== userKey);

  writeStorage(SAVED_TRIPS_KEY, updatedTrips);

  return [];
}

export function getWishlistItems() {
  const userKey = getUserKey();

  return readStorage(WISHLIST_KEY)
    .filter((item) => item.user_key === userKey)
    .sort((a, b) => new Date(b.saved_at) - new Date(a.saved_at));
}

export function isInWishlist(itemId) {
  const userKey = getUserKey();

  return readStorage(WISHLIST_KEY).some(
    (item) => item.id === itemId && item.user_key === userKey,
  );
}

export function saveWishlistItem(item) {
  if (!item) {
    throw new Error("Wishlist item is required.");
  }

  const userKey = getUserKey();
  const existingItems = readStorage(WISHLIST_KEY);

  const itemId =
    item.id ||
    item.url ||
    `${item.name || "travel_item"}_${item.location || "unknown"}`;

  const alreadyExists = existingItems.some(
    (savedItem) => savedItem.id === itemId && savedItem.user_key === userKey,
  );

  if (alreadyExists) {
    return existingItems.find(
      (savedItem) => savedItem.id === itemId && savedItem.user_key === userKey,
    );
  }

  const wishlistItem = {
    ...item,
    id: itemId,
    user_key: userKey,
    saved_at: new Date().toISOString(),
  };

  writeStorage(WISHLIST_KEY, [wishlistItem, ...existingItems]);

  return wishlistItem;
}

export function removeWishlistItem(itemId) {
  const userKey = getUserKey();
  const existingItems = readStorage(WISHLIST_KEY);

  const updatedItems = existingItems.filter(
    (item) => !(item.id === itemId && item.user_key === userKey),
  );

  writeStorage(WISHLIST_KEY, updatedItems);

  return updatedItems.filter((item) => item.user_key === userKey);
}

export function toggleWishlistItem(item) {
  const itemId =
    item?.id ||
    item?.url ||
    `${item?.name || "travel_item"}_${item?.location || "unknown"}`;

  if (isInWishlist(itemId)) {
    removeWishlistItem(itemId);
    return {
      saved: false,
      item_id: itemId,
    };
  }

  const savedItem = saveWishlistItem({
    ...item,
    id: itemId,
  });

  return {
    saved: true,
    item: savedItem,
    item_id: itemId,
  };
}