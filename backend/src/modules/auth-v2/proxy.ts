import http from "node:http";
import https from "node:https";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export type ProxyOptions = {
  target: string;
  /** Protocol advertised to the upstream app (Vercel/Render terminate TLS). */
  forwardedProto?: "http" | "https";
  /**
   * Only enable this when the proxy itself sits behind another trusted edge
   * that already sanitised `X-Forwarded-For`. When false (default), a
   * client-supplied `X-Forwarded-For` is discarded and replaced by the real
   * peer address, so an attacker cannot spoof the audit-log IP.
   */
  trustIncomingForwardedFor?: boolean;
};

function normalizeIp(value: string | undefined): string {
  if (!value) return "unknown";
  return value.startsWith("::ffff:") ? value.slice("::ffff:".length) : value;
}

function filterHeaders(
  headers: http.IncomingHttpHeaders | http.OutgoingHttpHeaders,
): http.OutgoingHttpHeaders {
  const result: http.OutgoingHttpHeaders = {};
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    if (HOP_BY_HOP.has(name.toLowerCase())) continue;
    result[name] = value;
  }
  return result;
}

/**
 * Minimal same-origin reverse proxy used to emulate a Vercel rewrite to Render.
 * It forwards the request body, the Cookie header, and every Set-Cookie header.
 *
 * This file is prepared for Phase 2D verification only; it is not started by
 * the application.
 */
export function createProxyHandler(options: ProxyOptions) {
  const target = new URL(options.target);
  const forwardedProto =
    options.forwardedProto ?? target.protocol.replace(":", "");
  const transport = target.protocol === "https:" ? https : http;
  const trustIncomingForwardedFor = options.trustIncomingForwardedFor === true;

  return (req: http.IncomingMessage, res: http.ServerResponse) => {
    const headers: http.OutgoingHttpHeaders = filterHeaders(req.headers);

    const remote = normalizeIp(req.socket.remoteAddress ?? undefined);
    const previousForwardedFor = req.headers["x-forwarded-for"];
    const forwardedFor =
      trustIncomingForwardedFor && typeof previousForwardedFor === "string"
        ? `${previousForwardedFor}, ${remote}`
        : remote;

    headers["host"] = target.host;
    headers["x-forwarded-for"] = forwardedFor;
    headers["x-forwarded-proto"] = forwardedProto;
    headers["x-forwarded-host"] = req.headers["host"] ?? target.host;
    headers["x-real-ip"] = remote;

    const upstream = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === "https:" ? 443 : 80),
        method: req.method,
        path: `${target.pathname.replace(/\/$/, "")}${req.url ?? "/"}`,
        headers,
      },
      (upstreamResponse) => {
        const responseHeaders = filterHeaders(upstreamResponse.headers);
        res.writeHead(
          upstreamResponse.statusCode ?? 502,
          upstreamResponse.statusMessage,
          responseHeaders,
        );
        upstreamResponse.pipe(res);
      },
    );

    upstream.on("error", () => {
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "application/json" });
      }
      res.end(JSON.stringify({ error: "UPSTREAM_UNAVAILABLE" }));
    });

    req.pipe(upstream);
  };
}

export function createProxyServer(options: ProxyOptions): http.Server {
  return http.createServer(createProxyHandler(options));
}
