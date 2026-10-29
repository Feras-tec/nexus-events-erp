import { QueryClient } from "@tanstack/react-query";

// Jede Anmeldung erhält eine eigene Instanz statt eines kontenübergreifenden Singleton-Caches.
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
