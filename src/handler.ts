import { Handler, serve } from "https://deno.land/std@0.182.0/http/server.ts";
import * as v5 from "https://deno.land/std@0.182.0/uuid/v5.ts";
import { z } from "https://deno.land/x/zod@v3.20.5/index.ts";
import ical, { ICalEventData } from "https://esm.sh/v108/ical-generator@6.0.1";
import {
  DiscourseEvent,
  repeatingFromRecurrence,
} from "./discourse-calendar.ts";

const discourseUrl = Deno.env.get("DISCOURSE_URL");

// https://www.rfc-editor.org/rfc/rfc4122.html#appendix-C
const NAMESPACE_URL_UUID = "6ba7b811-9dad-11d1-80b4-00c04fd430c8";

const handle: Handler = async (request) => {
  const eventsUrl = new URL(
    "/discourse-post-event/events?include_details=true",
    discourseUrl
  );

  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get("token");

  let body;
  try {
    const response = await fetch(
      eventsUrl,
      token
        ? { headers: { Cookie: `_t=${encodeURIComponent(token)}` } }
        : undefined
    );
    if (!response.ok) {
      console.error("Response status", response.status);
      return new Response("Failed to fetch events", { status: 502 });
    }
    body = await response.json();
  } catch (error) {
    console.error(error);
    return new Response("Failed to fetch events", { status: 502 });
  }

  const anyArrayResult = z.array(z.any()).safeParse(body?.events);
  if (!anyArrayResult.success) {
    console.error(anyArrayResult.error);
    return new Response("Fetched events were not an array", { status: 502 });
  }

  const events = anyArrayResult.data.flatMap((a) => {
    const result = DiscourseEvent.safeParse(a);
    if (!result.success) {
      console.warn("Invalid event object", result.error);
      return [];
    }
    return [result.data];
  });

  const hour = 60 * 60 * 1000;

  const calendar = ical({ name: discourseUrl });

  const calendarEventPromises = events
    // TODO: filter by ends_at
    .filter(
      (event) =>
        event.starts_at &&
        new Date(event.starts_at) > new Date(Date.now() - 24 * hour)
    )
    .map(async (event) => {
      const start = new Date(event.starts_at);

      const url =
        event.url ||
        (event.post?.url
          ? new URL(event.post.url, discourseUrl).toString()
          : undefined);

      const eventConfig: ICalEventData = {
        id: await v5.generate(
          NAMESPACE_URL_UUID,
          new TextEncoder().encode(url)
        ),
        summary: event.name || event.post?.topic?.title || "Unnamed event",
        start,
        ...(event.ends_at
          ? { end: new Date(event.ends_at) }
          : { duration: 3600 }),
        url,
        description: url,
        repeating: event.recurrence
          ? repeatingFromRecurrence(event.recurrence, start)
          : undefined,
      };
      return eventConfig;
    });
  const calendarEvents = await Promise.all(calendarEventPromises);

  for (const calendarEvent of calendarEvents) {
    calendar.createEvent(calendarEvent);
  }
  return new Response(calendar.toString(), {
    headers: { "Content-Type": "text/calendar" },
  });
};

serve(handle);
