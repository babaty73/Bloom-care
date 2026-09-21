import crypto from "crypto";

// Pharmacy Verification: a short, human-shareable code (e.g. "BC-7F4K92") an
// applicant can quote when checking their application status without an
// operational session. Deliberately excludes visually ambiguous characters
// (0/O, 1/I) since this is meant to be read aloud or typed by hand.
const REFERENCE_CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const REFERENCE_LENGTH = 6;
const REFERENCE_PREFIX = "BC-";

export function generateApplicationReferenceCandidate() {
  let code = "";
  const bytes = crypto.randomBytes(REFERENCE_LENGTH);
  for (let i = 0; i < REFERENCE_LENGTH; i++) {
    code += REFERENCE_CHARSET[bytes[i] % REFERENCE_CHARSET.length];
  }
  return `${REFERENCE_PREFIX}${code}`;
}
