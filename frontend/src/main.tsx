import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./i18n/config";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";
import { AppAuthProvider } from "./features/auth/AppAuthProvider";
import {
  applyTheme,
  getThemePreference,
} from "./features/theme/theme";

applyTheme(getThemePreference());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppAuthProvider>
      <RouterProvider router={router} />
    </AppAuthProvider>
  </StrictMode>,
);
