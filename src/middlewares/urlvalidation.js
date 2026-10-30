import { z } from "zod/mini";

const url_shortener_schema = z.object({
  // verify the url enter is a string and in the appropriate url standard (https;// anf http://)
  original_url: z.string({ message: "A original url is required" }).url({
    message:
      "the url provided is not in the correct format ( http:// || https://)",
  }),

  // verifying that the short_url generated respect the regex /^[A-Za-z0-9_-]{3,16}$/
  short_url: z.string().regex(/^[A-Za-z0-9_-]{3,16}$/, {
    message:
      "the url generated must have a length of 3 to 16 and respect the provided regex",
  }),
});
