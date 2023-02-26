import { RecurrenceRule } from "https://deno.land/x/simple_ics@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.20.5/mod.ts";

const DiscourseEventRecurrence = z.enum([
  "every_day",
  "every_weekday",
  "every_week",
  "every_two_weeks",
  "every_month",
  "every_year",
]);
type DiscourseEventRecurrence = z.infer<typeof DiscourseEventRecurrence>;

export const DiscourseEvent = z.object({
  name: z.string().nullable(),
  starts_at: z.string().datetime().nullable(),
  ends_at: z.string().datetime().nullable(),
  url: z.string().url().nullable(),
  recurrence: DiscourseEventRecurrence.nullable(),
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

export const rruleFromRecurrence = (
  recurrence: DiscourseEventRecurrence
): RecurrenceRule | undefined => {
  if (recurrence === "every_day") {
    return { freq: "DAILY" };
  }
  if (recurrence === "every_weekday") {
    return { freq: "DAILY", byDay: ["MO", "TU", "WE", "TH", "FR"] };
  }
  if (recurrence === "every_week") {
    return { freq: "WEEKLY" };
  }
  if (recurrence === "every_two_weeks") {
    return { freq: "WEEKLY", interval: 2 };
  }
  if (recurrence === "every_month") {
    // TODO: not supported yet
    // how to express "every month at this weekday"?
    // would have to also pass initial date and determine nth weekday
    // return { freq: "MONTHLY" };
  }
  if (recurrence === "every_year") {
    return { freq: "YEARLY" };
  }
};
