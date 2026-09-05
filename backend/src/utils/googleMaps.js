import config from "../config/env.js";
import { ApiError } from "./apiResponse.js";

// Contract: Nearby Pharmacy / Distance decision (docs/IMPLEMENTATION_DECISIONS.md
// Distance Decision) — pharmacies enter ONLY a Google Maps shared link; the
// backend resolves it to latitude/longitude via Geoapify. This is the ONLY place
// Geoapify is called, and ONLY when a pharmacy's googleMapsLink is created or
// updated — never during visitor search.

const GEOAPIFY_GEOCODE_URL = "https://api.geoapify.com/v1/geocode/search";

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

/**
 * Expands shortened Google Maps URLs such as:
 * https://maps.app.goo.gl/xxxxx
 *
 * The request follows Google's redirect and returns the final URL.
 */
async function expandGoogleMapsUrl(link) {
  if (typeof link !== "string" || link.trim() === "") {
    return null;
  }

  let url;

  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();

  const isShortGoogleMapsUrl =
    hostname === "maps.app.goo.gl" ||
    hostname === "goo.gl";

  if (!isShortGoogleMapsUrl) {
    return link.trim();
  }

  try {
    const response = await fetch(link.trim(), {
      method: "GET",
      redirect: "follow",
    });

    return response.url || null;
  } catch {
    return null;
  }
}

/**
 * Best-effort extraction of a usable location from a Google Maps link.
 *
 * Returns:
 *  - { latitude, longitude } when coordinates are embedded in the link.
 *  - { text } when a place/address can be extracted for Geoapify.
 *  - null when nothing usable can be extracted.
 */
export function parseGoogleMapsLink(link) {
  if (typeof link !== "string" || link.trim() === "") {
    return null;
  }

  let url;

  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }

  const coordPattern =
    /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/;

  // "@lat,lng,zoom"
  const atMatch = url.pathname.match(
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/
  );

  if (atMatch) {
    const latitude = Number(atMatch[1]);
    const longitude = Number(atMatch[2]);

    if (
      isValidLatitude(latitude) &&
      isValidLongitude(longitude)
    ) {
      return { latitude, longitude };
    }
  }

  // "q=lat,lng", "ll=lat,lng", or free-text q/query
  for (const param of ["q", "ll", "query"]) {
    const value = url.searchParams.get(param);

    if (!value) continue;

    const coordMatch = value.trim().match(coordPattern);

    if (coordMatch) {
      const latitude = Number(coordMatch[1]);
      const longitude = Number(coordMatch[2]);

      if (
        isValidLatitude(latitude) &&
        isValidLongitude(longitude)
      ) {
        return { latitude, longitude };
      }
    }

    return { text: value };
  }

  // "/maps/place/<text>/..."
  const placeMatch = url.pathname.match(
    /\/maps\/place\/([^/]+)/
  );

  if (placeMatch) {
    const text = decodeURIComponent(
      placeMatch[1].replace(/\+/g, " ")
    ).trim();

    if (text) {
      return { text };
    }
  }

  return null;
}

/**
 * Resolves a pharmacy's Google Maps shared link to latitude/longitude.
 *
 * Supports:
 *  - Full Google Maps URLs
 *  - Google Maps shortened URLs (maps.app.goo.gl)
 *  - URLs containing direct coordinates
 *  - URLs containing searchable place/address information
 *
 * Geoapify is only used when the Google Maps URL does not already
 * contain usable coordinates.
 */
export async function resolvePharmacyLocation(googleMapsLink) {
  if (
    typeof googleMapsLink !== "string" ||
    googleMapsLink.trim() === ""
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be interpreted"
    );
  }

  let linkToParse = googleMapsLink.trim();

  // First try parsing the original URL.
  let parsed = parseGoogleMapsLink(linkToParse);

  // If the URL is a shortened Google Maps URL, expand it first.
  if (!parsed) {
    const expandedUrl = await expandGoogleMapsUrl(linkToParse);

    if (expandedUrl) {
      linkToParse = expandedUrl;
      parsed = parseGoogleMapsLink(linkToParse);
    }
  }

  if (!parsed) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be interpreted"
    );
  }

  // Coordinates were already available — no Geoapify request needed.
  if ("latitude" in parsed) {
    return {
      latitude: parsed.latitude,
      longitude: parsed.longitude,
    };
  }

  if (!config.geoapifyApiKey) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution is not configured"
    );
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
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution service is currently unavailable"
    );
  }

  if (!response.ok) {
    throw new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Location resolution service returned an error"
    );
  }

  const data = await response.json().catch(() => null);

  const feature = data?.features?.[0];
  const coordinates = feature?.geometry?.coordinates;

  // GeoJSON order: [longitude, latitude]
  if (
    !Array.isArray(coordinates) ||
    coordinates.length !== 2
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be resolved to a location"
    );
  }

  const [longitude, latitude] = coordinates;

  if (
    !isValidLatitude(latitude) ||
    !isValidLongitude(longitude)
  ) {
    throw new ApiError(
      400,
      "LOCATION_UNRESOLVABLE",
      "The provided Google Maps link could not be resolved to a valid location"
    );
  }

  return {
    latitude,
    longitude,
  };
}