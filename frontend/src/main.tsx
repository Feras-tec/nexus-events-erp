import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/react";
import "./index.css";
import "./i18n/config";
import { AuthQueryProvider } from "./components/providers/AuthQueryProvider";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import {
  applyTheme,
  getThemePreference,
} from "./features/theme/theme";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Missing Clerk Publishable Key");
}

applyTheme(getThemePreference());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClerkProvider publishableKey={publishableKey}>
      <AuthQueryProvider>
        <RouterProvider router={router} />
      </AuthQueryProvider>
    </ClerkProvider>
  </StrictMode>,
);
