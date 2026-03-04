import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const pollsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.polls;
    }),

  byCircle: publicProcedure
    .input(z.object({ userId: z.string(), circleId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.polls.filter((p: any) => p.circleId === input.circleId);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        poll: z.object({
          id: z.string(),
          circleId: z.string(),
          author: z.any(),
          question: z.string(),
          options: z.array(
            z.object({
              id: z.string(),
              text: z.string(),
              votes: z.array(z.string()),
            })
          ),
          createdAt: z.string(),
          expiresAt: z.string(),
          closed: z.boolean(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.polls.unshift(input.poll);
      return input.poll;
    }),

  vote: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        pollId: z.string(),
        optionId: z.string(),
        voterId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const poll = store.polls.find((p: any) => p.id === input.pollId);
      if (!poll) return null;
      poll.options = poll.options.map((o: any) => ({
        ...o,
        votes:
          o.id === input.optionId
            ? o.votes.includes(input.voterId)
              ? o.votes.filter((id: string) => id !== input.voterId)
              : [...o.votes, input.voterId]
            : o.votes.filter((id: string) => id !== input.voterId),
      }));
      return poll;
    }),
});
