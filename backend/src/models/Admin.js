import mongoose from "mongoose";

// Contract: docs/ARCHITECTURE.md §1.1.
// The specification names this field "password" but ARCHITECTURE.md's contract note
// requires it to hold the secure hashed representation, never plaintext.
// No admin registration endpoint exists — provisioning remains PENDING CONFIRMATION
// (docs/IMPLEMENTATION_DECISIONS.md, Admin Provisioning Decision). This model only
// supports admin login against accounts provisioned some other way (e.g. a manual
// seed script run outside the API), which is not implemented here.

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "email must be a valid email address"],
    },
    password: {
      // Holds the bcrypt hash, per the ARCHITECTURE.md contract note on this field.
      type: String,
      required: [true, "password is required"],
      select: false,
    },
  },
  { timestamps: true },
);

const Admin = mongoose.model("Admin", adminSchema);

export default Admin;
