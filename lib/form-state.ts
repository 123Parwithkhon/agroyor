export type FormState = {
  error?: string;
  fields?: Record<string, string>;
  values?: Record<string, string>;
  /** Ключ словаря с сообщением об успехе (форма остаётся на странице) */
  notice?: string;
} | null;
export type ResetState = { password?: string; error?: boolean } | null;