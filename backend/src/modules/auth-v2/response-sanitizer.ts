import type { RequestHandler } from "express";

const TOKEN_KEYS = new Set(["token", "sessiontoken", "session_token"]);
const MAX_BUFFER_BYTES = 1024 * 1024;

/**
 * Removes every session-token-shaped field from a JSON value. Recovery codes
 * (`backupCodes`), TOTP URIs and password-reset tokens that intentionally live
 * in a URL are not affected.
 */
export function scrubSessionTokens(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrubSessionTokens);
  if (!value || typeof value !== "object") return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (TOKEN_KEYS.has(key.toLowerCase())) continue;
    result[key] = scrubSessionTokens(entry);
  }
  return result;
}

function chunkToBuffer(
  chunk: unknown,
  encoding?: BufferEncoding,
): Buffer {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (typeof chunk === "string") return Buffer.from(chunk, encoding ?? "utf8");
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  return Buffer.from(String(chunk), "utf8");
}

/**
 * Buffers JSON responses produced by better-auth and strips session tokens
 * before they reach the client.
 *
 * Phase 2C proved that `sign-in/email`, `change-password`, `get-session`,
 * `list-sessions`, `verify-totp` and `verify-backup-code` all include the raw
 * session token in their JSON body. The cookie is the only place where it may
 * appear. This middleware is applied to the whole auth-v2 router so a future
 * better-auth endpoint cannot reintroduce the leak.
 */
export function sanitizeAuthV2Json(): RequestHandler {
  return (_req, res, next) => {
    let chunks: Buffer[] = [];
    let size = 0;
    let buffering = true;

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);
    const originalWriteHead = res.writeHead.bind(res);

    // better-auth computes Content-Length for the original (token-bearing)
    // body. Since sanitisation changes the length, drop it and let Node use
    // chunked transfer encoding. Removing it before `writeHead` also avoids
    // `ERR_HTTP_HEADERS_SENT` when the body is rewritten below.
    res.writeHead = function writeHead(...args: unknown[]): typeof res {
      const strip = (input: unknown) => {
        if (!input || typeof input !== "object") return input;
        const clone: Record<string, unknown> = {
          ...(input as Record<string, unknown>),
        };
        delete clone["content-length"];
        delete clone["Content-Length"];
        return clone;
      };

      const [statusCode, second, third] = args;
      if (typeof second === "string") {
        return originalWriteHead(
          statusCode as number,
          second,
          strip(third) as never,
        );
      }
      return originalWriteHead(statusCode as number, strip(second) as never);
    } as typeof res.writeHead;

    const flushBuffered = () => {
      for (const chunk of chunks) originalWrite(chunk);
      chunks = [];
    };

    res.write = function write(
      chunk: unknown,
      encodingOrCallback?: BufferEncoding | ((error?: Error | null) => void),
      callback?: (error?: Error | null) => void,
    ): boolean {
      const encoding =
        typeof encodingOrCallback === "string" ? encodingOrCallback : undefined;
      const cb =
        typeof encodingOrCallback === "function"
          ? encodingOrCallback
          : callback;

      if (!buffering) {
        if (cb === undefined && encoding === undefined) {
          return originalWrite(chunk as never);
        }
        if (cb === undefined) {
          return originalWrite(chunk as never, encoding as never);
        }
        return originalWrite(chunk as never, encoding as never, cb as never);
      }

      const buffer = chunkToBuffer(chunk, encoding);
      size += buffer.length;
      if (size > MAX_BUFFER_BYTES) {
        buffering = false;
        flushBuffered();
        return originalWrite(buffer, cb);
      }

      chunks.push(buffer);
      if (cb) cb();
      return true;
    } as typeof res.write;

    res.end = function end(
      chunk?: unknown,
      encodingOrCallback?: BufferEncoding | (() => void),
      callback?: () => void,
    ): typeof res {
      const encoding =
        typeof encodingOrCallback === "string" ? encodingOrCallback : undefined;
      const cb =
        typeof encodingOrCallback === "function"
          ? encodingOrCallback
          : callback;

      if (!buffering) {
        if (cb === undefined && encoding === undefined) {
          return originalEnd(chunk as never);
        }
        if (cb === undefined) {
          return originalEnd(chunk as never, encoding as never);
        }
        return originalEnd(
          chunk as never,
          encoding as never,
          cb as never,
        );
      }
      buffering = false;

      const finish = (buffer: Buffer) =>
        cb === undefined ? originalEnd(buffer) : originalEnd(buffer, cb);

      if (chunk !== undefined && chunk !== null) {
        chunks.push(chunkToBuffer(chunk, encoding));
      }

      const body = Buffer.concat(chunks);
      chunks = [];
      const contentType = String(res.getHeader("content-type") ?? "");

      if (body.length > 0 && contentType.includes("application/json")) {
        try {
          const parsed = JSON.parse(body.toString("utf8")) as unknown;
          const cleaned = Buffer.from(
            JSON.stringify(scrubSessionTokens(parsed)),
            "utf8",
          );
          if (!res.headersSent) {
            res.setHeader("content-length", String(cleaned.length));
          }
          return finish(cleaned);
        } catch {
          // Fail closed: never forward an unparseable auth body that could
          // contain a raw token.
          res.statusCode = 500;
          res.setHeader("content-type", "application/json; charset=utf-8");
          const failed = Buffer.from(
            JSON.stringify({ error: "AUTH_RESPONSE_SANITIZATION_FAILED" }),
            "utf8",
          );
          if (!res.headersSent) {
            res.setHeader("content-length", String(failed.length));
          }
          return finish(failed);
        }
      }

      return finish(body);
    } as typeof res.end;

    next();
  };
}
