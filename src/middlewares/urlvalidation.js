import { z } from "zod";

const url_shortener_schema = z.object({
  // verify the url enter is a string and in the appropriate url standard (https;// and http:// )
  original_url: z
    .string({ message: "A original url is required" })
    .url({
      message:
        "the url provided is not in the correct format ( http:// || https:// )",
    })
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "the url most start either with http:// or https://",
    }),

  // verifying that the short_url generated respect the regex /^[A-Za-z0-9_-]{3,16}$/
  short_url: z.string().regex(/^[A-Za-z0-9_-]{3,16}$/, {
    message:
      "the url generated must have a length of 3 to 16 and respect the provided regex",
  }).optional(),
});

//use middleware factory to responsibility seperation so that the all request are valide before reaching the controller

const validation_middleware = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      const errorMessage = error.issues.map((e) => e.message);

      return res.status(400).json({
        status: "Failed",
        message: "the Validation failed",
        success: false,
        error: errorMessage,
      });
    }
  };
};

export const validation_schema = validation_middleware(url_shortener_schema);
