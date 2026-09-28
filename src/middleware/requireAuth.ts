import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, timingSafeEqual } from "node:crypto";

export interface RequireAuthOptions {
  /** Header name to read the token from (default: "authorization") */
  header?: string;
}

/**
 * Middleware that requires a valid Bearer token for the request to proceed.
 * If the token is valid, attaches the user to `req.user` and calls `next()`.
 * If the token is missing or invalid, responds with 401 Unauthorized.
 * If authentication configuration is missing, responds with 503.
 */
export function requireAuth(
  req: VercelRequest,
  res: VercelResponse,
  next: () => void,
  options: RequireAuthOptions = {}
): void {
  const header = options.header ?? "authorization";
  const raw = req.headers[header] as string | undefined;

  if (!raw) {
    res.status(401).json({ error: "Unauthorized: missing authorization header" });
    return;
  }

  const secret = process.env.CRON_SECRET;

  if (!secret) {
    res.status(503).json({
      error:
        "Service Unavailable: authentication configuration is missing",
      code: "AUTH_CONFIGURATION_MISSING",
    });
    return;
  }

  // Strip "Bearer " prefix if present, then compare token securely
  const token = raw.startsWith("Bearer ") ? raw.slice("Bearer ".length) : raw;
  const expectedToken = secret;

  if (
    !timingSafeEqual(
      createHash("sha256").update(token).digest(),
      createHash("sha256").update(expectedToken).digest()
    )
  ) {
    res.status(401).json({ error: "Unauthorized: invalid token" });
    return;
  }

  ;(req as VercelRequest & { user: string }).user = "authenticated";
  next();
}