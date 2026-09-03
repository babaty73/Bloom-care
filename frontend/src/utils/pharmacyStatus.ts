// Presentation-only helper. Contract: docs/ARCHITECTURE.md Pharmacy Open/Closed
// Status — "Frontend displays backend isOpen; it does not create an independent
// business rule." This formats a label from the backend-provided isOpen +
// openingTime/closingTime; it never recomputes isOpen itself.

export function formatOpenStatusLabel(isOpen: boolean, openingTime: string, closingTime: string): string {
  return isOpen ? `Open until ${closingTime}` : `Closed · Opens ${openingTime}`;
}
