import { z } from "https://deno.land/x/zod@v3.20.5/mod.ts";
import {
  ICalEventData,
  ICalEventRepeatingFreq,
  ICalWeekday,
} from "https://esm.sh/v108/ical-generator@3.6.1";
import { RRule } from "https://esm.sh/v108/rrule@2.7.2";

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
  starts_at: z.string().datetime(),
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

export const repeatingFromRecurrence = (
  recurrence: DiscourseEventRecurrence,
  start: Date
): ICalEventData["repeating"] | undefined => {
  if (recurrence === "every_day") {
    return { freq: ICalEventRepeatingFreq.DAILY };
  }
  if (recurrence === "every_weekday") {
    return {
      freq: ICalEventRepeatingFreq.DAILY,
      byDay: [
        ICalWeekday.MO,
        ICalWeekday.TU,
        ICalWeekday.WE,
        ICalWeekday.TH,
        ICalWeekday.FR,
      ],
    };
  }
  if (recurrence === "every_week") {
    return { freq: ICalEventRepeatingFreq.WEEKLY };
  }
  if (recurrence === "every_two_weeks") {
    return { freq: ICalEventRepeatingFreq.WEEKLY, interval: 2 };
  }
  if (recurrence === "every_month") {
    const weekdayIndex = start.getDay();
    const weekdays = [
      RRule.SU,
      RRule.MO,
      RRule.TU,
      RRule.WE,
      RRule.TH,
      RRule.FR,
      RRule.SA,
    ];
    const weekday = weekdays[weekdayIndex];

    const weekNumber = Math.floor(start.getDate() / 7) + 1;

    const rrule = new RRule({
      freq: RRule.MONTHLY,
      byweekday: weekday.nth(weekNumber),
    });

    return rrule.toString();
  }
  if (recurrence === "every_year") {
    return { freq: ICalEventRepeatingFreq.YEARLY };
  }
};
