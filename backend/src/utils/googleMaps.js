import config from "../config/env.js";
import { ApiError } from "./apiResponse.js";

const GEOAPIFY_GEOCODE_URL =
  "https://api.geoapify.com/v1/geocode/search";

const GOOGLE_SHORT_HOSTS = new Set([
  "maps.app.goo.gl",
  "goo.gl",
]);

// Production hardening fix: neither external call (Google short-link
// expansion, Geoapify geocoding) previously had a timeout, so a hanging
// upstream could hang pharmacy registration/update indefinitely. Both calls
// below now abort after this many milliseconds; resolution stays
// best-effort/non-blocking either way (the caller already treats any error
// here as "location unresolved for now", not a hard failure).
const EXTERNAL_FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EXTERNAL_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isValidLatitude(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

function makeCoordinates(latitude, longitude) {
  if (
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}

function extractCoordinates(text) {
  if (typeof text !== "string") return null;

  let value = text;

  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep original value.
  }

  /*
   * Handles:
   *
   * @9.033190,38.708395
   * /search/9.033190,+38.708395
   * /search/9.033190,38.708395
   */
  const patterns = [
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/,

    /\/maps\/search\/(-?\d+(?:\.\d+)?)[+,\s]+(-?\d+(?:\.\d+)?)/,

    /[?&](?:q|ll|query)=(-?\d+(?:\.\d+)?)[+,\s]+(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (!match) continue;

    const result = makeCoordinates(
      Number(match[1]),
      Number(match[2]),
    );

    if (result) return result;
  }

  return null;
}

export function parseGoogleMapsLink(link) {
  if (
    typeof link !== "string" ||
    link.trim() === ""
  ) {
    return null;
  }

  const value = link.trim();

  // First: look for coordinates anywhere in the URL.
  const directCoordinates = extractCoordinates(value);

  if (directCoordinates) {
    return directCoordinates;
  }

  let url;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  // Check Google Maps query parameters.
  for (const param of ["q", "ll", "query"]) {
    const paramValue = url.searchParams.get(param);

    if (!paramValue) continue;

    const coords = extractCoordinates(
      `?${param}=${paramValue}`,
    );

    if (coords) return coords;

    if (paramValue.trim()) {
      return {
        text: paramValue.trim(),
      };
    }
  }

  // Check Google Maps place URL.
  const placeMatch = url.pathname.match(
    /\/maps\/place\/([^/]+)/i,
  );

  if (placeMatch) {
    const text = decodeURIComponent(
      placeMatch[1].replace(/\+/g, " "),
    ).trim();

    if (text) {
      return {
        text,
      };
    }
  }

  return null;
}

/**
 * Expands maps.app.goo.gl links.
 *
 * Important:
 * We use normal redirect-following and inspect response.url.
 */
async function expandGoogleMapsUrl(link) {
  if (
    typeof link !== "string" ||
    link.trim() === ""
  ) {
    return null;
  }

  let inputUrl;

  try {
    inputUrl = new URL(link.trim());
  } catch {
    return null;
  }

  const hostname = inputUrl.hostname.toLowerCase();

  if (!GOOGLE_SHORT_HOSTS.has(hostname)) {
    return inputUrl.toString();
  }

  try {
    const response = await fetchWithTimeout(inputUrl.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    /*
     * response.url is the final URL after redirects.
     */
    if (response.url) {
      return response.url;
    }

    return null;
  } catch (error) {
    console.warn(
      `[google maps] short URL expansion failed: ${error.message}`,
    );

    return null;
  }
}

export async function resolvePharmacyLocation(
  googleMapsLink,
) {
  if (
    typeof googleMapsLink !== "string" ||
    googleMapsLink.trim() === ""
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be interpreted",
    );
  }

  const originalLink = googleMapsLink.trim();

  /*
   * STEP 1
   *
   * Try to extract coordinates directly.
   */
  let parsed = parseGoogleMapsLink(originalLink);

  if (parsed?.latitude !== undefined) {
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  }

  /*
   * STEP 2
   *
   * Expand maps.app.goo.gl.
   */
  const expandedUrl =
    await expandGoogleMapsUrl(originalLink);

  if (expandedUrl) {
    console.log(
      `[google maps] expanded URL: ${expandedUrl}`,
    );

    const expandedCoordinates =
      extractCoordinates(expandedUrl);

    if (expandedCoordinates) {
      return expandedCoordinates;
    }

    parsed = parseGoogleMapsLink(expandedUrl);

    if (parsed?.latitude !== undefined) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
      };
    }
  }

  /*
   * STEP 3
   *
   * Try text-based geocoding with Geoapify.
   */
  const originalParsed =
    parseGoogleMapsLink(originalLink);

  const expandedParsed = expandedUrl
    ? parseGoogleMapsLink(expandedUrl)
    : null;

  const text =
    originalParsed?.text ||
    expandedParsed?.text ||
    null;

  if (!text) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be interpreted",
    );
  }

  if (!config.geoapifyApiKey) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution is not configured",
    );
  }

  const url = new URL(
    GEOAPIFY_GEOCODE_URL,
  );

  url.searchParams.set("text", text);
  url.searchParams.set(
    "apiKey",
    config.geoapifyApiKey,
  );
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "geojson");

  let response;

  try {
    response = await fetchWithTimeout(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });
  } catch {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution service is currently unavailable",
    );
  }

  if (!response.ok) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution service returned an error",
    );
  }

  const data =
    await response.json().catch(() => null);

  const feature = data?.features?.[0];

  const geoCoordinates =
    feature?.geometry?.coordinates;

  if (
    !Array.isArray(geoCoordinates) ||
    geoCoordinates.length !== 2
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be resolved to a location",
    );
  }

  // GeoJSON = [longitude, latitude]
  const [longitude, latitude] =
    geoCoordinates;

  if (
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be resolved to a valid location",
    );
  }

  return {
    latitude,
    longitude,
  };
}