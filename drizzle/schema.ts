/**
 * Central schema registry re-exporting all database tables and relations.
 * Acts as the single entry point for Drizzle ORM to discover and register
 * all application schemas, including core authentication, sessions, organizations,
 * two-factor credentials, and associated relations.
 *
 * @author Maruf Bepary
 */
export * from "@/drizzle/schemas/auth-schema";
