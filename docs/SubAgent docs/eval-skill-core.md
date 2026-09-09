# Skill Evaluation: better-auth-nextjs (SKILL.md + core-setup.md)

Evaluated against: `lib/auth/auth.ts`, `lib/auth/auth-client.ts`, `package.json`, `better-auth-docs.md`  
Date: 2026-08-11

---

## SKILL.md Evaluation

### Issues Found

- **[CRITICAL]** Skill Map table and References section both list 6 file names that do not exist on disk. An agent following these links will fail to load any of them:

  | Listed in SKILL.md   | Actual file on disk                                     |
  | -------------------- | ------------------------------------------------------- |
  | `email-password.md`  | `authentication.md`                                     |
  | `oauth.md`           | does not exist (likely merged into `authentication.md`) |
  | `two-factor.md`      | `two-factor-auth.md`                                    |
  | `sessions.md`        | `session-management.md`                                 |
  | `emails.md`          | `email-hooks.md`                                        |
  | `server-patterns.md` | `server-client-patterns.md`                             |

  The same wrong names are repeated verbatim in the `## References` section at the bottom, so both entry points are broken.

- **[CRITICAL]** `oauth.md` is listed as a standalone file but does not exist anywhere in the skill directory. It is unclear whether OAuth content is in `authentication.md` or is simply missing. The Skill Map claims it covers "Social provider config (GitHub, Discord, Google), `mapProfileToUser`, account linking" — if that content is absent, a major feature is undocumented.

- **[MINOR]** Quick Start says `npx auth@latest generate`. The project's `package.json` `auth:generate` script uses `npx @better-auth/cli@latest generate --config ./lib/auth/auth.ts ...`. The `auth@latest` shorthand may work, but it is inconsistent with the project's own convention and may break in some Node environments where the alias isn't resolved.

- **[MINOR]** `nextCookies` placement is not addressed in SKILL.md at all. There is no guidance on whether it should be first or last in the plugins array, and no warning about ordering side-effects (the actual project places it first; other better-auth examples place it last).

### What's Good

- Plugin Registry table is accurate: all import paths for `twoFactor`, `passkey` (`@better-auth/passkey`), `admin`, `organization`, `nextCookies`, and `inferAdditionalFields` match `auth.ts` and `auth-client.ts` exactly.
- The Plugin Symmetry warning is clearly marked and the server↔client mapping table is correct.
- Dual-config pattern explanation (server vs client, `auth.api.*` vs `authClient.*`) is concise and accurate.
- Catchall route code snippet matches `app/api/auth/[...all]/route.ts` exactly.
- `passkey` correctly attributed to `@better-auth/passkey` (separate package), not `better-auth/plugins`.

---

## core-setup.md Evaluation

### Issues Found

- **[CRITICAL]** The `auth-client.ts` template exports named symbols that the actual project does not export:
  ```typescript
  // In core-setup.md template (bottom of client section):
  export const { signIn, signUp, signOut, useSession } = authClient;
  ```
  The actual `auth-client.ts` only exports `authClient` as a named export. An agent following the template will generate a client file that drifts from the project's established pattern.

- **[CRITICAL]** The `adminClient()` in the client template is shown without RBAC config:
  ```typescript
  adminClient(),  // template
  ```
  But the actual `auth-client.ts` passes `ac` and `roles`:
  ```typescript
  adminClient({ ac, roles: { [GLOBAL_ROLES.ADMIN]: admin, [GLOBAL_ROLES.USER]: user } }),
  ```
  An agent following the template will produce a working but un-scoped admin client, silently dropping all permission checks. No warning about this is present.

- **[CRITICAL]** The `adminPlugin()` in the `auth.ts` template is also shown without RBAC config:
  ```typescript
  adminPlugin(),  // template — no ac/roles
  ```
  The actual `auth.ts` passes `{ ac, roles: { ... } }`. Same consequence: permission checks are silently absent.

- **[MINOR]** `cookieCache.strategy` lists three options: `"compact" | "jwt" | "jwe"`. The official docs (and the project) only use `"jwt"`. `"compact"` and `"jwe"` are not documented as valid strategy values in `better-auth-docs.md` and may not exist in the library. Should be narrowed to `"cookie" | "jwt"` or verified.

- **[MINOR]** The `databaseHooks` block is shown fully commented out in the template, but the actual `auth.ts` has it active — it pre-populates `activeOrganizationId` on every new session by querying the most recent membership. There is no note explaining when `databaseHooks` is needed or what the real project uses it for, leaving agents unaware of this pattern.

- **[MINOR]** The `auth.ts` template places `nextCookies()` first in the plugins array with the comment "Required for Next.js Server Actions to write auth cookies." The actual project does the same. However, several better-auth examples in official docs and community use place it last (as it intercepts the response). No ordering rationale is given. If ordering ever matters for a plugin interaction, this will be silent breakage.

- **[MINOR]** The type casting pattern for plugin-specific server endpoints:
  ```typescript
  const adminApi = auth.api as typeof auth.api & ReturnType<typeof admin>["endpoints"];
  ```
  This is advanced and potentially brittle. The `ReturnType<typeof admin>["endpoints"]` shape may not match the actual plugin API surface. No alternative (e.g. using the plugin's exported types directly) is mentioned.

### What's Good

- Environment variables section is complete and matches the project's `.env.local` requirements exactly.
- Session config (`expiresIn`, `updateAge`, `cookieCache`) matches `auth.ts` exactly, including the 7-day values.
- `inferAdditionalFields<typeof auth>()` usage and explanation is accurate and matches the actual `auth-client.ts`.
- `auth.$Infer.Session` type extraction pattern is correct and useful.
- Workflow Reference (bottom of file) accurately reflects the actual npm scripts in `package.json`.
- Tables plugin section is accurate: lists all tables and columns added per plugin.
- Server Guard pattern is correct and matches the `auth.api.getSession({ headers: await headers() })` pattern used throughout the project.
- `additionalFields` example with `input: false` for privileged fields is correct and the security implication is noted.

---

## Recommended Fixes (Prioritized)

1. **[SKILL.md — Skill Map + References]** Fix all 6 wrong file names to match actual files on disk. Also determine whether OAuth content lives in `authentication.md` or needs a dedicated file; if the latter, create `oauth.md` or update the map entry to the correct file name.

2. **[SKILL.md — Skill Map + References]** Remove the `oauth.md` row entirely if the content is in `authentication.md`, or add a note that it is covered there. A broken reference is worse than a missing one.

3. **[core-setup.md — Client template]** Remove the `export const { signIn, ... } = authClient;` line or mark it as "optional — not used in this project". It creates drift from the actual pattern.

4. **[core-setup.md — Client + Server templates]** Add RBAC config to both `adminPlugin()` and `adminClient()` examples, or add a prominent note: "If using role-based permissions, pass `{ ac, roles }` to both — see `admin.md`."

5. **[core-setup.md — cookieCache.strategy]** Change `"compact" | "jwt" | "jwe"` to `"cookie" | "jwt"` (or verify "compact"/"jwe" against the library source and cite the reference).

6. **[core-setup.md — databaseHooks]** Uncomment the `databaseHooks` example and add a note that the project uses it to pre-populate `activeOrganizationId`, with a forward reference to `organizations.md`.

7. **[SKILL.md — Quick Start]** Change `npx auth@latest generate` to `npx @better-auth/cli@latest generate` to match the project's established `auth:generate` script, or note both forms are equivalent.

8. **[SKILL.md + core-setup.md]** Add a note about `nextCookies()` ordering, documenting whether it should be first or last and why.
