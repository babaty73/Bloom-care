// Magic-byte (file-signature) sniffing for the license-document upload.
// Contract: Cloudinary License-Document Decision — the client-declared
// Content-Type/mimetype of a multipart part is untrusted input (trivially
// spoofable), so the actual file bytes are inspected before accepting the
// upload. Returns a normalized mime type string ("image/jpeg", "image/png",
// "application/pdf") or null if the buffer does not match any allowed
// signature.
export function sniffFileType(buffer) {
  if (!buffer || buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length >= pngSig.length && pngSig.every((byte, i) => buffer[i] === byte)) {
    return "image/png";
  }

  // PDF: "%PDF-" ASCII prefix
  if (buffer.length >= 5 && buffer.slice(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  return null;
}
