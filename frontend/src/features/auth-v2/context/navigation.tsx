import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

const NAVIGATION_EVENT = "auth-v2:navigate";

export type AuthV2Location = {
  pathname: string;
  search: string;
  href: string;
};

export type AuthV2NavigateOptions = {
  replace?: boolean;
};

type NavigationContextValue = {
  location: AuthV2Location;
  navigate: (to: string, options?: AuthV2NavigateOptions) => void;
};

const NavigationContext = createContext<NavigationContextValue | null>(null);

function subscribe(callback: () => void): () => void {
  window.addEventListener("popstate", callback);
  window.addEventListener(NAVIGATION_EVENT, callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener(NAVIGATION_EVENT, callback);
  };
}

function getSnapshot(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function getServerSnapshot(): string {
  return "/";
}

function parseLocation(href: string): AuthV2Location {
  const queryIndex = href.indexOf("?");
  if (queryIndex === -1) {
    return { pathname: href, search: "", href };
  }
  return {
    pathname: href.slice(0, queryIndex),
    search: href.slice(queryIndex),
    href,
  };
}

export function requiresDocumentNavigation(pathname: string): boolean {
  return pathname !== "/auth-v2.html" && !/^\/auth-v2(?:\/|$)/.test(pathname);
}

export function AuthV2NavigationProvider({ children }: { children: ReactNode }) {
  const href = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const location = useMemo(() => parseLocation(href), [href]);

  const value = useMemo<NavigationContextValue>(() => {
    return {
      location,
      navigate(to, options) {
        const target = new URL(to, window.location.origin);
        if (target.origin !== window.location.origin) {
          window.location.assign(target.toString());
          return;
        }

        // Der ERP-Router läuft in einem eigenen HTML-Einstieg und benötigt einen Dokumentwechsel.
        // Eingebettete Kontoseiten laufen im ERP-Dokument; der Wechsel zum Auth-Einstieg braucht dessen Router.
        const leavesErpForAuth = requiresDocumentNavigation(window.location.pathname) && !requiresDocumentNavigation(target.pathname);
        if (requiresDocumentNavigation(target.pathname) || leavesErpForAuth) {
          if (options?.replace) window.location.replace(target.toString());
          else window.location.assign(target.toString());
          return;
        }

        const next = `${target.pathname}${target.search}${target.hash}`;
        if (options?.replace) {
          window.history.replaceState({}, "", next);
        } else {
          window.history.pushState({}, "", next);
        }
        window.dispatchEvent(new Event(NAVIGATION_EVENT));
        try {
          window.scrollTo({ top: 0 });
        } catch {
          // jsdom and reduced browser environments may not implement scrollTo.
        }
      },
    };
  }, [location]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAuthV2Navigation(): NavigationContextValue {
  const value = useContext(NavigationContext);
  if (!value) {
    throw new Error("AuthV2NavigationProvider is missing");
  }
  return value;
}

export function useAuthV2Location(): AuthV2Location {
  return useAuthV2Navigation().location;
}

export function useAuthV2QueryParam(name: string): string | null {
  const { location } = useAuthV2Navigation();
  return useMemo(
    () => new URLSearchParams(location.search).get(name),
    [location.search, name],
  );
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
  replace?: boolean;
};

export function AuthV2Link({
  to,
  replace,
  onClick,
  children,
  ...props
}: LinkProps) {
  const { navigate } = useAuthV2Navigation();

  return (
    <a
      href={to}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
          return;
        }
        event.preventDefault();
        navigate(to, { replace });
      }}
      {...props}
    >
      {children}
    </a>
  );
}
