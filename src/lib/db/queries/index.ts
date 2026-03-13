// ============================================================
// Query Layer — Central Export
// ============================================================

export * from "./knowledge";
export * from "./versioning";
export * from "./users";
export * from "./skills";

// Case-study queries — exported when the file exists (created by the
// case-studies query agent). Import is guarded to avoid build errors
// if the file has not been created yet.
// export * from "./case-studies";
