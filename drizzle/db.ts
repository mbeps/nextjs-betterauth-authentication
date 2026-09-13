import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/config/env";
import * as schema from "@/drizzle/schema";

/**
 * Drizzle ORM database client configured with the application schema.
 * Serves as the centralized database connection instance for relational queries,
 * transactions, and schema-aware operations across the server and Better Auth adapter.
 * Utilizes node-postgres under the hood connecting via the validated DATABASE_URL environment variable.
 *
 * @author Maruf Bepary
 */
export const db = drizzle(env.DATABASE_URL, { schema });
