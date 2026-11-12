import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";
import "./i18n/config";
import { AuthV2App } from "./features/auth-v2/AuthV2App";
import { applyTheme, getThemePreference } from "./features/theme/theme";

// Isolated Phase 2E preview entry. It does not import Clerk and is not the
// production entry point (`index.html` still mounts the existing application).
applyTheme(getThemePreference());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthV2App />
  </StrictMode>,
);
