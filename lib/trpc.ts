import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  if (!url) {
    console.warn('[trpc] EXPO_PUBLIC_RORK_API_BASE_URL not set, backend features disabled');
    return null;
  }
  return url;
};

const BASE_URL = getBaseUrl();

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: BASE_URL ? `${BASE_URL}/api/trpc` : 'http://localhost:0/api/trpc',
      transformer: superjson,
    }),
  ],
});

export const isBackendAvailable = !!BASE_URL;
