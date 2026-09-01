// Contract: docs/ARCHITECTURE.md Pharmacy Open/Closed Status.
// Business timezone is Africa/Addis_Ababa. openingTime/closingTime are stored as
// "HH:mm" 24-hour strings. Backend calculation is authoritative; the frontend only
// displays the computed isOpen value.

const TIMEZONE = "Africa/Addis_Ababa";

function getCurrentTimeInBusinessTimezone(now = new Date()) {
  // Returns "HH:mm" for the given instant, rendered in the business timezone.
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(now);
}

function toMinutes(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Determines whether a pharmacy is currently open.
 * @param {string} openingTime - "HH:mm"
 * @param {string} closingTime - "HH:mm"
 * @param {Date} [now] - defaults to the current instant
 * @returns {boolean}
 */
export function isPharmacyOpen(openingTime, closingTime, now = new Date()) {
  if (openingTime === closingTime) {
    // Invalid per contract; treat defensively as closed rather than throwing here.
    return false;
  }

  const current = toMinutes(getCurrentTimeInBusinessTimezone(now));
  const open = toMinutes(openingTime);
  const close = toMinutes(closingTime);

  if (open < close) {
    // Normal hours
    return current >= open && current < close;
  }

  // Overnight hours (closingTime < openingTime)
  return current >= open || current < close;
}
