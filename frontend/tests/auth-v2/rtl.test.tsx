import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuthV2App } from "../../src/features/auth-v2/AuthV2App";
import { installFetch, setPath, unauthenticated } from "./helpers";

describe("Auth V2 RTL/LTR und Sprachwechsel", () => {
  it("wechselt zwischen Arabisch (RTL), Englisch und Deutsch (LTR)", async () => {
    installFetch([
      { path: "/api/auth-v2/account/me", reply: unauthenticated },
    ]);

    setPath("/auth-v2/sign-in");
    render(<AuthV2App />);

    await screen.findByRole("heading", { name: "Bei Nexus Events anmelden" });
    expect(document.documentElement.dir).toBe("ltr");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "ar" },
    });

    await screen.findByRole("heading", {
      name: "تسجيل الدخول إلى Nexus Events",
    });
    await waitFor(() => expect(document.documentElement.dir).toBe("rtl"));
    expect(document.documentElement.lang).toBe("ar");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "en" },
    });

    await screen.findByRole("heading", { name: "Sign in to Nexus Events" });
    await waitFor(() => expect(document.documentElement.dir).toBe("ltr"));
    expect(document.documentElement.lang).toBe("en");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "de" },
    });

    await screen.findByRole("heading", { name: "Bei Nexus Events anmelden" });
    expect(document.documentElement.dir).toBe("ltr");
  });
});
