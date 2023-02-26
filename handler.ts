import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import {
  Event,
  EventConfig,
  Calendar,
} from "https://deno.land/x/simple_ics@0.1.0/mod.ts";
import { DiscourseEvent, rruleFromRecurrence } from "./discourse-calendar.ts";

const handle = async () => {
  let body;
  try {
    const response = await fetch(
      "https://discuss.kalk.space/discourse-post-event/events.json"
    );
    if (!response.ok) {
      return new Response("Failed to fetch events", { status: 502 });
    }
    body = await response.json();
  } catch {
    return new Response("Failed to fetch events", { status: 502 });
  }

  const eventsResult = DiscourseEvent.array().safeParse(body?.events);
  if (!eventsResult.success) {
    return new Response("Fetched events have invalid shape", { status: 502 });
  }
  const events = eventsResult.data;

  const baseUrl = "https://discuss.kalk.space";
  const hour = 60 * 60 * 1000;

  const calendarEvents = events
    // TODO: filter by ends_at
    .filter(
      (event) =>
        event.starts_at &&
        new Date(event.starts_at) > new Date(Date.now() - 24 * hour)
    )
    .map((event) => {
      const eventConfig: EventConfig = {
        title: event.name || event.post?.topic?.title || "Unnamed event",
        beginDate: new Date(event.starts_at),
        ...(event.ends_at
          ? { endDate: new Date(event.ends_at) }
          : { duration: 3600 }),
        url:
          event.url ||
          (event.post?.url ? `${baseUrl}${event.post.url}` : undefined),
        rrule: event.recurrence
          ? rruleFromRecurrence(event.recurrence)
          : undefined,
        // TODO:
        // alarm: {
        //   desc: 'Write Rust NOW',
        //   advance: 30,
        // },
      };
      return new Event(eventConfig);
    });

  const calendar = new Calendar(calendarEvents);
  return new Response(calendar.toString());
};

serve(handle);
