import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const boardRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.boardItems;
    }),

  byCircle: publicProcedure
    .input(z.object({ userId: z.string(), circleId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.boardItems.filter((b: any) => b.circleId === input.circleId);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        item: z.object({
          id: z.string(),
          circleId: z.string(),
          author: z.any(),
          title: z.string(),
          type: z.enum(["link", "note", "todo", "photo"]),
          content: z.string(),
          url: z.string().optional(),
          completed: z.boolean().optional(),
          createdAt: z.string(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.boardItems.unshift(input.item);
      return input.item;
    }),

  toggleTodo: publicProcedure
    .input(z.object({ userId: z.string(), itemId: z.string() }))
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const item = store.boardItems.find((i: any) => i.id === input.itemId);
      if (!item) return null;
      item.completed = !item.completed;
      return item;
    }),
});
