import config from "../config/env.js";
import { ApiError } from "./apiResponse.js";

// Contract: Nearby Pharmacy / Distance decision (docs/IMPLEMENTATION_DECISIONS.md
// Distance Decision) — pharmacies enter ONLY a Google Maps shared link; the
// backend resolves it to latitude/longitude via Geoapify. This is the ONLY place
// Geoapify is called, and ONLY when a pharmacy's googleMapsLink is created or
// updated — never during visitor search (that would violate "do not geocode on
// every user search").

const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";

function isValidLatitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= -180 && value <= 180;
}

/**
 * Best-effort extraction of a usable location from a Google Maps shared link.
 * Returns:
 *  - { latitude, longitude } when coordinates are already embedded in the link
 *    (e.g. "@lat,lng,zoom", or "q=lat,lng" / "ll=lat,lng") — no geocoding needed.
 *  - { text } — a free-text address/place query for Geoapify to resolve
 *    (e.g. from "q=<place name>" or a "/maps/place/<name>/" path segment).
 *  - null when nothing usable could be extracted (e.g. an opaque shortened
 *    maps.app.goo.gl link with no embedded info). Geoapify cannot resolve a raw
 *    URL it was never designed to follow, so this is treated as unresolvable
 *    up front rather than spending an API call on it.
 */
export function parseGoogleMapsLink(link) {
  if (typeof link !== "string" || link.trim() === "") return null;

  let url;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  const coordPattern = /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/;

  // "@lat,lng,zoom" embedded in the path (common desktop share-link format)
  const atMatch = url.pathname.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    const latitude = Number(atMatch[1]);
    const longitude = Number(atMatch[2]);
    if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
      return { latitude, longitude };
    }
  }

  // "q=lat,lng", "ll=lat,lng", or free-text "q=<place>" / "query=<place>"
  for (const param of ["q", "ll", "query"]) {
    const value = url.searchParams.get(param);
    if (!value) continue;

    const coordMatch = value.trim().match(coordPattern);
    if (coordMatch) {
      const latitude = Number(coordMatch[1]);
      const longitude = Number(coordMatch[2]);
      if (isValidLatitude(latitude) && isValidLongitude(longitude)) {
        return { latitude, longitude };
      }
    }

    return { text: value };
  }

  // "/maps/place/<text>/..."
  const placeMatch = url.pathname.match(/\/maps\/place\/([^/]+)/);
  if (placeMatch) {
    const text = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
    if (text) return { text };
  }

  return null;
}

/**
 * Resolves a pharmacy's Google Maps shared link to latitude/longitude.
 *
 * Throws:
 *  - ApiError(400, "LOCATION_UNRESOLVABLE", ...) when the link cannot be
 *    interpreted at all, or Geoapify finds no matching location.
 *  - ApiError(500, "INTERNAL_SERVER_ERROR", ...) when Geoapify is not
 *    configured or the request to it fails/errors.
 *
 * @param {string} googleMapsLink
 * @returns {Promise<{ latitude: number, longitude: number }>}
 */
export async function resolvePharmacyLocation(googleMapsLink) {
  const parsed = parseGoogleMapsLink(googleMapsLink);

  if (!parsed) {
    throw new ApiError(400, "LOCATION_UNRESOLVABLE", "The provided Google Maps link could not be interpreted");
  }

  if ("latitude" in parsed) {
    return { latitude: parsed.latitude, longitude: parsed.longitude };
  }

  if (!config.geoapifyApiKey) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Location resolution is not configured");
  }

  const url = new URL(GEOAPIFY_GEOCODE_URL);
  url.searchParams.set("text", parsed.text);
  url.searchParams.set("apiKey", config.geoapifyApiKey);
  url.searchParams.set("limit", "1");
  url.searchParams.set("format", "geojson");

  let response;
  try {
    response = await fetch(url.toString());
  } catch {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Location resolution service is currently unavailable");
  }

  if (!response.ok) {
    throw new ApiError(500, "INTERNAL_SERVER_ERROR", "Location resolution service returned an error");
  }

  const data = await response.json().catch(() => null);
  const feature = data?.features?.[0];
  const coordinates = feature?.geometry?.coordinates; // GeoJSON order: [lng, lat]

  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(400, "LOCATION_UNRESOLVABLE", "The provided Google Maps link could not be resolved to a location");
  }

  const [longitude, latitude] = coordinates;
  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    throw new ApiError(400, "LOCATION_UNRESOLVABLE", "The provided Google Maps link could not be resolved to a valid location");
  }

  return { latitude, longitude };
}
