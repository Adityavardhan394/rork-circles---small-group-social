import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const notificationsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.notifications;
    }),

  markRead: publicProcedure
    .input(z.object({ userId: z.string(), notifId: z.string() }))
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const notif = store.notifications.find((n: any) => n.id === input.notifId);
      if (!notif) return null;
      notif.read = true;
      return notif;
    }),

  markAllRead: publicProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.notifications.forEach((n: any) => {
        n.read = true;
      });
      return store.notifications;
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        notification: z.object({
          id: z.string(),
          type: z.enum(["post", "poll", "event", "invite", "reaction", "comment"]),
          circleId: z.string(),
          circleName: z.string(),
          circleEmoji: z.string(),
          title: z.string(),
          body: z.string(),
          read: z.boolean(),
          createdAt: z.string(),
          actorName: z.string(),
          actorAvatar: z.string(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.notifications.unshift(input.notification);
      return input.notification;
    }),
});
