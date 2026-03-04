import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";
import { getUserStore } from "../../db/store";

export const postsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.posts;
    }),

  byCircle: publicProcedure
    .input(z.object({ userId: z.string(), circleId: z.string() }))
    .query(({ input }) => {
      const store = getUserStore(input.userId);
      return store.posts.filter((p: any) => p.circleId === input.circleId);
    }),

  create: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        post: z.object({
          id: z.string(),
          circleId: z.string(),
          author: z.any(),
          text: z.string().optional(),
          mediaUrls: z.array(z.string()),
          reactions: z.record(z.string(), z.array(z.string())),
          comments: z.array(z.any()),
          createdAt: z.string(),
          expiresAt: z.string(),
          pinned: z.boolean(),
        }),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      store.posts.unshift(input.post);
      return input.post;
    }),

  toggleReaction: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        postId: z.string(),
        emoji: z.string(),
        reactUserId: z.string(),
      })
    )
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const post = store.posts.find((p: any) => p.id === input.postId);
      if (!post) return null;
      const currentVotes = post.reactions[input.emoji] || [];
      const hasVoted = currentVotes.includes(input.reactUserId);
      post.reactions[input.emoji] = hasVoted
        ? currentVotes.filter((id: string) => id !== input.reactUserId)
        : [...currentVotes, input.reactUserId];
      return post;
    }),

  togglePin: publicProcedure
    .input(z.object({ userId: z.string(), postId: z.string() }))
    .mutation(({ input }) => {
      const store = getUserStore(input.userId);
      const post = store.posts.find((p: any) => p.id === input.postId);
      if (!post) return null;
      post.pinned = !post.pinned;
      return post;
    }),
});
