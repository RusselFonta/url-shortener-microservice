import { z } from "zod";

const url_shortener_schema = z.object({
  target_url: z
    .string({ message: "The original URL is required" })
    .url({
      message: "The URL provided is not in the correct format",
    })
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "The URL must start with http:// or https://",
    }),

  expires_at: z
    .string()
    .datetime({
      message: "The expiration time must respect ISO 8601 format",
    })
    .refine((value) => new Date(value).getTime() > Date.now(), {
      message: "The expiration date must be in the future",
    })
    .optional(),

  // Validate custom short code.
  code: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,16}$/, {
      message: "The short code must contain 3 to 16 valid characters",
    })
    .optional(),
});

// Middleware factory.
const validation_middleware = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.issues.map((issue) => issue.message);

        return res.status(400).json({
          status: "Failed",
          message: "The validation failed",
          success: false,
          error: errorMessage,
        });
      }

      return next(error);
    }
  };
};

//

export const pagination_schema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, {
      message: "Limit must be a positive integer",
    })
    .transform(Number)
    .pipe(
      z.number().int().min(1).max(100).refine(Number.isSafeInteger, {
        message: "Limit must be a safe integer",
      }),
    )
    .optional(),

  after: z
    .string()
    .regex(/^\d+$/, {
      message: "After must be a non-negative integer",
    })
    .transform(Number)
    .pipe(
      z.number().int().nonnegative().refine(Number.isSafeInteger, {
        message: "After must be a safe integer",
      }),
    )
    .optional(),
});

export const validation_schema = validation_middleware(url_shortener_schema);
