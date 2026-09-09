import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Drizzle ORM database client configured with the Better Auth schema.
 */
export const db = drizzle(env.DATABASE_URL, { schema });
