import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/features/auth/AuthModeGate", () => ({AuthModeGate:({children}:{children:React.ReactNode}) => <>{children}</>}));
vi.mock("@clerk/react", () => ({
  // Compatibility shim may render ClerkProvider, but it must not be used for auth.
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => {
    throw new Error("useAuth should not be called in Auth-V2 mode");
  },
}));

vi.mock("../src/features/auth-v2/context/AuthV2Provider", () => ({
  AuthV2Provider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="authv2-provider">{children}</div>
  ),
  useAuthV2: () => ({
    status: "authenticated",
    user: {
      id: "authv2-user",
      email: "user@example.com",
      name: "User",
      role: "EMPLOYEE",
      isActive: true,
      twoFactorEnabled: false,
      twoFactorRequired: false,
      twoFactorEnforcedAt: null,
    },
    reason: null,
    error: null,
    refresh: vi.fn(),
    logout: vi.fn(),
  }),
}));

vi.mock("../src/features/auth-v2/context/navigation", () => ({
  AuthV2NavigationProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useAuthV2Navigation: () => ({
    location: { pathname: "/", search: "", href: "/" },
    navigate: vi.fn(),
  }),
  useAuthV2QueryParam: () => null,
  useAuthV2Location: () => ({ pathname: "/", search: "", href: "/" }),
}));

import { AppAuthProvider, useAppAuth } from "../src/features/auth/AppAuthProvider";

function Probe() {
  const auth = useAppAuth();
  return <span>{auth.mode}</span>;
}

describe("AppAuthProvider", () => {
  it("defaults to Auth-V2 without invoking Clerk", () => {
    render(
      <AppAuthProvider>
        <Probe />
      </AppAuthProvider>,
    );

    expect(screen.getByText("auth-v2")).toBeTruthy();
    expect(screen.getByTestId("authv2-provider")).toBeTruthy();
  });
});
