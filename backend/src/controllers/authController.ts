import { Request, Response } from "express";
import {
  clearSessionCookie,
  createSessionToken,
  getSessionFromRequest,
  setSessionCookie
} from "../middleware/auth.js";

const getAdminEmail = () => process.env.ADMIN_EMAIL ?? "bookifystore@gmail.com";
const getAdminPassword = () => process.env.ADMIN_PASSWORD ?? "bookify123";

export const login = (request: Request, response: Response) => {
  const email = String(request.body?.email ?? "").trim().toLowerCase();
  const password = String(request.body?.password ?? "");

  if (!email || !password) {
    response.status(400).json({ message: "Email and password are required." });
    return;
  }

  const adminEmail = getAdminEmail().trim().toLowerCase();
  const adminPassword = getAdminPassword();

  if (email !== adminEmail || password !== adminPassword) {
    response.status(401).json({ message: "Invalid email or password." });
    return;
  }

  const token = createSessionToken(adminEmail);
  setSessionCookie(response, token);
  response.json({ email: adminEmail });
};

export const logout = (_request: Request, response: Response) => {
  clearSessionCookie(response);
  response.status(204).send();
};

export const getSession = (request: Request, response: Response) => {
  const session = getSessionFromRequest(request);

  if (!session) {
    response.status(401).json({ message: "Unauthorized. Please log in." });
    return;
  }

  response.json({ email: session.email });
};
