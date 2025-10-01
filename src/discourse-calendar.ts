import { z } from "https://deno.land/x/zod@v3.20.5/mod.ts";

export const DiscourseEvent = z.object({
  id: z.number(),
  name: z.string().nullable(),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }).nullable(),
  rrule: z.string().optional(),
  post: z
    .object({
      url: z.string().nullable(),
      topic: z
        .object({
          title: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),
});
