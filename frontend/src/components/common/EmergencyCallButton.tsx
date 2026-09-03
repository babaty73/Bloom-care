// Contract: docs/IMPLEMENTATION_DECISIONS.md Emergency Number Decision —
// PENDING CONFIRMATION. No number may be invented or hardcoded. This component is
// only the architectural UI boundary: it reads the number from the environment
// configuration boundary (VITE_EMERGENCY_NUMBER) and renders nothing until a real
// number is supplied there.

function EmergencyCallButton() {
  const emergencyNumber = import.meta.env.VITE_EMERGENCY_NUMBER;

  if (!emergencyNumber) {
    return null;
  }

  return (
    <a
      href={`tel:${emergencyNumber}`}
      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
    >
      Emergency
    </a>
  );
}

export default EmergencyCallButton;
