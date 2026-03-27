import { createTRPCRouter } from "./create-context";
import { circlesRouter } from "./routes/circles";
import { postsRouter } from "./routes/posts";
import { pollsRouter } from "./routes/polls";
import { eventsRouter } from "./routes/events";
import { boardRouter } from "./routes/board";
import { notificationsRouter } from "./routes/notifications";

export const appRouter = createTRPCRouter({
  circles: circlesRouter,
  posts: postsRouter,
  polls: pollsRouter,
  events: eventsRouter,
  board: boardRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
