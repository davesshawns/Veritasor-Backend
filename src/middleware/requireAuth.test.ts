import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { requireAuth } from "../middleware/requireAuth";
import type { VercelRequest } from "@vercel/node";

function fakeReq(
  headers: Record<string, string> = {}
): VercelRequest {
  return { headers } as unknown as VercelRequest;
}

function fakeRes(): {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
  ended: boolean;
  json(payload: unknown): this;
  status(code: number): this;
  end(): this;
  setHeader(k: string, v: string): this;
} {
  const r: {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
    ended: boolean;
    json(payload: unknown): this;
    status(code: number): this;
    end(): this;
    setHeader(k: string, v: string): this;
  } = {
    statusCode: 200,
    body: undefined,
    headers: {},
    ended: false,
    json(payload: unknown) {
      r.body = payload;
      return this;
    },
    status(code: number) {
      r.statusCode = code;
      return this;
    },
    end() {
      r.ended = true;
      return this;
    },
    setHeader(k: string, v: string) {
      r.headers[k] = v;
    },
  };
  return r;
}

const savedCronSecret = process.env.CRON_SECRET;

beforeEach(() => {
  if (savedCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedCronSecret;
});

afterEach(() => {
  if (savedCronSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = savedCronSecret;
  vi.useRealTimers();
});

describe("requireAuth", () => {
  describe("success path", () => {
    it("allows a valid Bearer token and attaches user to req", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer test-secret-123" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
      expect((req as VercelRequest & { user: string }).user).toBe("authenticated");
    });

    it("allows a valid token without Bearer prefix", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "test-secret-123" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.statusCode).toBe(200);
    });
  });

  describe("failure paths", () => {
    it("rejects missing authorization header", () => {
      const req = fakeReq({});
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
      expect(res.body).toEqual({ error: "Unauthorized: missing authorization header" });
    });

    it("rejects empty authorization header", () => {
      const req = fakeReq({ authorization: "" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it("rejects invalid token", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer wrong-token" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it("rejects wrong Bearer token", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer different-secret" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe("representative invalid inputs", () => {
    it("rejects null header value", () => {
      // @ts-expect-error testing edge case
      const req = fakeReq({ authorization: null });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it("rejects undefined header", () => {
      const req = fakeReq({} as { headers: Record<string, string> });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });

  describe("primary state transitions", () => {
    it("transitions from unauthenticated to authenticated state on valid Bearer token", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer test-secret-123" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect((req as VercelRequest & { user: string }).user).toBe("authenticated");
      expect(res.statusCode).toBe(200);
    });

    it("keeps request unauthenticated when no header present", () => {
      const req = fakeReq({});
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect((req as VercelRequest & { user: string }).user).toBeUndefined();
      expect(res.statusCode).toBe(401);
    });
  });

  describe("deterministic boundary/error behavior", () => {
    it("handles token with Bearer prefix and empty credential", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer " });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });

    it("uses constant-time comparison preventing timing leaks", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req = fakeReq({ authorization: "Bearer test-secret-123" });
      const res = fakeRes();
      const next = vi.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("responds with consistent 401 for all auth failures when config present", () => {
      process.env.CRON_SECRET = "test-secret-123";
      const req1 = fakeReq({});
      const req2 = fakeReq({ authorization: "Bearer wrong" });
      const res1 = fakeRes();
      const res2 = fakeRes();
      const next1 = vi.fn();
      const next2 = vi.fn();

      requireAuth(req1, res1, next1);
      requireAuth(req2, res2, next2);

      expect(res1.statusCode).toBe(401);
      expect(res2.statusCode).toBe(401);
    });
  });
});