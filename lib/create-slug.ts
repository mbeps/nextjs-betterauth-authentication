/**
 * Converts an arbitrary string into a URL-friendly slug.
 * Used primarily for generating clean, URL-safe identifiers such as organization
 * slugs during tenant creation within the Better Auth ecosystem.
 * Trims leading/trailing whitespace, converts characters to lowercase, and replaces non-alphanumeric sequences with hyphens.
 *
 * @param str - The raw input string to convert into a URL-safe slug
 * @returns A normalised slug string containing only lowercase alphanumeric characters and hyphens
 * @author Maruf Bepary
 */
export function createSlug(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}
