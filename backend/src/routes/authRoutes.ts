import { Router } from "express";
import { getSession, login, logout } from "../controllers/authController.js";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.get("/me", getSession);

export default router;
