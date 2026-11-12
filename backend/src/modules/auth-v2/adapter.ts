import { prismaAdapter } from "better-auth/adapters/prisma";
import type { AuthV2Prisma } from "./prisma.js";
import { hashSessionToken } from "./token-hash.js";

type AdapterFactory = ReturnType<typeof prismaAdapter>;
type Adapter = ReturnType<AdapterFactory>;
type AdapterMethod =
  | "create"
  | "findOne"
  | "findMany"
  | "update"
  | "updateMany"
  | "delete"
  | "deleteMany"
  | "count";

function transformTokenValue(value: unknown): unknown {
  if (typeof value === "string") return hashSessionToken(value);
  if (Array.isArray(value)) return value.map(transformTokenValue);
  return value;
}

/**
 * better-auth adapter `where` values are arrays of clauses:
 *   [{ field: "token", value: "...", operator?: "in" }]
 * The helper also supports object-shaped and nested logical clauses so a
 * future better-auth version cannot silently bypass the transformation.
 */
function transformWhere(where: unknown): unknown {
  if (Array.isArray(where)) return where.map(transformWhere);
  if (!where || typeof where !== "object") return where;

  const clause = where as Record<string, unknown>;
  if (clause["field"] === "token" && "value" in clause) {
    return { ...clause, value: transformTokenValue(clause["value"]) };
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(clause)) {
    if (key === "token") {
      result[key] = transformTokenValue(value);
    } else if (key === "AND" || key === "OR" || key === "NOT") {
      result[key] = Array.isArray(value) ? value.map(transformWhere) : transformWhere(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function transformData(data: unknown): unknown {
  if (Array.isArray(data)) return data.map(transformData);
  if (!data || typeof data !== "object") return data;
  const row = data as Record<string, unknown>;
  if (typeof row["token"] === "string") {
    return { ...row, token: hashSessionToken(row["token"]) };
  }
  return data;
}

function wrapAdapter(base: Adapter): Adapter {
  const invoke = async (
    method: AdapterMethod,
    args: Record<string, unknown>,
  ): Promise<unknown> => {
    if (args["model"] !== "session") {
      return (base[method] as (input: unknown) => Promise<unknown>)(args);
    }

    const next: Record<string, unknown> = { ...args };
    if (next["where"] !== undefined) next["where"] = transformWhere(next["where"]);
    if (next["update"] !== undefined) next["update"] = transformData(next["update"]);

    if (method === "create") {
      const rawToken = (next["data"] as Record<string, unknown> | undefined)?.["token"];
      if (next["data"] !== undefined) next["data"] = transformData(next["data"]);
      const created = (await (base.create as (input: unknown) => Promise<Record<string, unknown> | null>)(next));
      if (created && typeof rawToken === "string" && rawToken.length > 0) {
        return { ...created, token: rawToken };
      }
      return created;
    }

    return (base[method] as (input: unknown) => Promise<unknown>)(next);
  };

  const wrapped = {
    ...base,
    create: (args: unknown) => invoke("create", args as Record<string, unknown>) as ReturnType<Adapter["create"]>,
    findOne: (args: unknown) => invoke("findOne", args as Record<string, unknown>) as ReturnType<Adapter["findOne"]>,
    findMany: (args: unknown) => invoke("findMany", args as Record<string, unknown>) as ReturnType<Adapter["findMany"]>,
    update: (args: unknown) => invoke("update", args as Record<string, unknown>) as ReturnType<Adapter["update"]>,
    updateMany: (args: unknown) => invoke("updateMany", args as Record<string, unknown>) as ReturnType<Adapter["updateMany"]>,
    delete: (args: unknown) => invoke("delete", args as Record<string, unknown>) as ReturnType<Adapter["delete"]>,
    deleteMany: (args: unknown) => invoke("deleteMany", args as Record<string, unknown>) as ReturnType<Adapter["deleteMany"]>,
    count: (args: unknown) => invoke("count", args as Record<string, unknown>) as ReturnType<Adapter["count"]>,
  } as Adapter;

  // better-auth wraps multi-step operations in adapter.transaction(). The
  // transaction adapter is a different object, so it must be wrapped too or
  // writes inside change-password / session rotation bypass hashing.
  if (typeof base.transaction === "function") {
    wrapped.transaction = (<R>(callback: (trx: Adapter) => Promise<R>) =>
      base.transaction!((trx) => callback(wrapAdapter(trx as unknown as Adapter)))) as Adapter["transaction"];
  }

  return wrapped;
}

/**
 * Wraps the official Prisma adapter factory. Only the `session` model is touched.
 *
 * For `create`, the caller (better-auth) must receive the *raw* token so it can
 * sign it into the cookie; the database receives the digest.
 */
export function createHashingPrismaAdapter(prisma: AuthV2Prisma): AdapterFactory {
  const factory = prismaAdapter(prisma, { provider: "postgresql" });
  return (options) => wrapAdapter(factory(options) as Adapter);
}
