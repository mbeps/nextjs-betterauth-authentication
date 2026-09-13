import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class name inputs using `clsx` and Tailwind-aware merging.
 * Combines arbitrary class values, resolving conflicting Tailwind CSS utility classes
 * in favor of later declarations, and filtering falsy conditionals.
 *
 * @param inputs - Class name values that may include booleans, arrays, objects, or strings
 * @returns A deduplicated, conflict-free class name string
 * @author Maruf Bepary
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
