import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ValidationError } from "../exceptions/ValidationError";

export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => issue.message)
        .join(", ");
      throw new ValidationError(message);
    }

    const data = result.data as {
      body?: Record<string, unknown>;
      params?: Record<string, unknown>;
      query?: Record<string, unknown>;
    };

    if (data.body) req.body = data.body;
    if (data.params) req.params = data.params as Request["params"];
    if (data.query) req.query = data.query as Request["query"];

    next();
  };
