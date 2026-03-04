import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const circlesRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.circles;
    }),

  getById: publicProcedure
    .input(z.object({ userId: z.string(), circleId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.circles.find((c: any) => c.id === input.circleId) ?? null;
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        circle: z.object({
          id: z.string(),
          name: z.string(),
          emoji: z.string(),
          color: z.string(),
          members: z.array(z.any()),
          admins: z.array(z.string()),
          inviteCode: z.string(),
          createdAt: z.string(),
          lastActivity: z.string().optional(),
          description: z.string().optional(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.circles.unshift(input.circle);
      return input.circle;
    }),

  joinByCode: publicProcedure
    .input(z.object({ userId: z.string(), inviteCode: z.string(), user: z.any() }))
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const circle = store.circles.find((c: any) => c.inviteCode === input.inviteCode);
      if (!circle) {
        return { success: false, error: "Invalid invite code" };
      }
      const alreadyMember = circle.members.some((m: any) => m.id === input.userId);
      if (!alreadyMember) {
        circle.members.push(input.user);
      }
      return { success: true, circle };
    }),
});
