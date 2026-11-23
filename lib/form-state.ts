export type FormState = {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
} | null;
export type ResetState = { password?: string; error?: boolean } | null;