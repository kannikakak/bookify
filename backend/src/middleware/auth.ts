import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "bookify_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const getSessionSecret = () => process.env.AUTH_SESSION_SECRET ?? "change-this-bookify-session-secret";

const parseCookies = (cookieHeader: string | undefined) => {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return cookieHeader.split(";").reduce((cookies, cookiePair) => {
    const [rawName, ...rawValueParts] = cookiePair.trim().split("=");
    if (!rawName) {
      return cookies;
    }

    const value = rawValueParts.join("=");
    cookies.set(rawName, decodeURIComponent(value));
    return cookies;
  }, new Map<string, string>());
};

const signPayload = (payload: string) =>
  crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const createSessionToken = (email: string) => {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${email}|${expiresAt}`;
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
};

type SessionData = {
  email: string;
  expiresAt: number;
};

export const verifySessionToken = (token: string): SessionData | null => {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  const decodedPayload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  const [email, expiresAtText] = decodedPayload.split("|");
  const expiresAt = Number(expiresAtText);

  if (!email || Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return { email, expiresAt };
};

export const getSessionFromRequest = (request: Request) => {
  const cookies = parseCookies(request.headers.cookie);
  const token = cookies.get(SESSION_COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifySessionToken(token);
};

export const setSessionCookie = (response: Response, token: string) => {
  response.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/"
  });
};

export const clearSessionCookie = (response: Response) => {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
};

export const requireAuth = (request: Request, response: Response, next: NextFunction) => {
  const session = getSessionFromRequest(request);

  if (!session) {
    response.status(401).json({ message: "Unauthorized. Please log in." });
    return;
  }

  next();
};
