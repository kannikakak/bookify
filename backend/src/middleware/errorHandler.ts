import { NextFunction, Request, Response } from "express";

type ApiError = Error & {
  statusCode?: number;
};

export const errorHandler = (
  error: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = error.statusCode ?? 500;

  console.error(error);

  res.status(statusCode).json({
    message: error.message || "Internal server error"
  });
};
