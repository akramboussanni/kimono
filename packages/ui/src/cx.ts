/** Joins class names, dropping anything falsy. */
export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}
