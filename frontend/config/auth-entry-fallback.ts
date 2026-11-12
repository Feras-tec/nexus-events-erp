import type { Plugin, Connect } from 'vite';

// Beide SPA-Einstiege benötigen beim Direktaufruf ihre eigene HTML-Datei.
// Nur HTML-Navigation umschreiben; API, Assets und der normale ERP-Fallback bleiben unverändert.
export function authEntryFallback(): Plugin {
  const install = (server: { middlewares: { use: (handler: Connect.NextHandleFunction) => void } }) => {
    server.middlewares.use((req: { method?: string; url?: string; headers: { accept?: string } }, _res: unknown, next: () => void) => {
      const url = req.url ?? '';
      const pathname = url.split('?')[0] ?? '';
      if ((req.method === 'GET' || req.method === 'HEAD') &&
          req.headers.accept?.includes('text/html') &&
          /^\/auth-v2(?:\/|$)/.test(pathname)) {
        const query = url.indexOf('?');
        req.url = `/auth-v2.html${query >= 0 ? url.slice(query) : ''}`;
      }
      next();
    });
  };
  return { name: 'nexus-auth-entry-fallback', configureServer: install, configurePreviewServer: install };
}
