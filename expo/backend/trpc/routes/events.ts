import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const eventsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.events;
    }),

  byCircle: publicProcedure
    .input(z.object({ userId: z.string(), circleId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.events.filter((e: any) => e.circleId === input.circleId);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        event: z.object({
          id: z.string(),
          circleId: z.string(),
          author: z.any(),
          title: z.string(),
          description: z.string().optional(),
          date: z.string(),
          time: z.string(),
          location: z.string().optional(),
          rsvps: z.object({
            yes: z.array(z.string()),
            maybe: z.array(z.string()),
            no: z.array(z.string()),
          }),
          createdAt: z.string(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.events.unshift(input.event);
      return input.event;
    }),

  rsvp: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        eventId: z.string(),
        attendeeId: z.string(),
        status: z.enum(["yes", "maybe", "no"]),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const event = store.events.find((e: any) => e.id === input.eventId);
      if (!event) return null;
      event.rsvps.yes = event.rsvps.yes.filter((id: string) => id !== input.attendeeId);
      event.rsvps.maybe = event.rsvps.maybe.filter((id: string) => id !== input.attendeeId);
      event.rsvps.no = event.rsvps.no.filter((id: string) => id !== input.attendeeId);
      event.rsvps[input.status].push(input.attendeeId);
      return event;
    }),
});
