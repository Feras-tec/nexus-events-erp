import { StrictMode, useLayoutEffect, useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthQueryProvider } from "../src/components/providers/AuthQueryProvider";

// Nur den Clerk-Lebenszyklus simulieren; Provider, Hooks und Cache sind echt.
const auth = vi.hoisted(() => ({
  isLoaded: true, isSignedIn: true as boolean | undefined,
  userId: "A" as string | null, sessionId: "session-A" as string | null,
}));
vi.mock("@clerk/react", () => ({ useAuth: () => auth }));

let currentClient: QueryClient;
let load: () => Promise<string>;
let renders: Array<{ userId: string | null; data: string | undefined }>;

function Probe() {
  const client = useQueryClient();
  const [draft, setDraft] = useState("");
  const query = useQuery({ queryKey: ["customers"], queryFn: load, enabled: auth.isSignedIn === true });
  // Vor passiven Effekten prüfen, ob ein Kontowechsel bereits fremde Daten sichtbar gemacht hat.
  useLayoutEffect(() => {
    currentClient = client;
    renders.push({ userId: auth.userId, data: query.data });
  });
  return <>
    <div data-testid="data">{query.data ?? "empty"}</div>
    <input aria-label="Draft" value={draft} onChange={event => setDraft(event.target.value)} />
  </>;
}
function tree() {
  return <StrictMode><AuthQueryProvider><Probe /></AuthQueryProvider></StrictMode>;
}
function switchAccount(userId: string, sessionId = `session-${userId}`) {
  Object.assign(auth, { isLoaded: true, isSignedIn: true, userId, sessionId });
  load = vi.fn(async () => `private-${userId}`);
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
async function expectData(value: string) {
  await waitFor(() => expect(screen.getByTestId("data").textContent).toBe(value));
}
beforeEach(() => {
  switchAccount("A");
  renders = [];
});
afterEach(cleanup);

describe("Cache-Isolation im Clerk-Lebenszyklus", () => {
  it("isoliert den direkten Kontowechsel bereits beim ersten Render", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Entwurf von A" } });
    switchAccount("B");
    view.rerender(tree());
    expect(currentClient).not.toBe(oldClient);
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe("");
    expect(renders.filter(row => row.userId === "B").every(row => row.data !== "private-A")).toBe(true);
    await expectData("private-B");
    expect(oldClient.getQueryCache().getAll()).toHaveLength(0);
  });

  it("löscht Query- und Mutationsdaten beim Logout", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    await act(async () => {
      await oldClient.getMutationCache().build(oldClient, { mutationFn: async () => "private-mutation" }).execute(undefined);
    });
    Object.assign(auth, { isSignedIn: false, userId: null, sessionId: null });
    view.rerender(tree());
    expect(screen.getByTestId("data").textContent).toBe("empty");
    expect(currentClient).not.toBe(oldClient);
    expect(oldClient.getQueryCache().getAll()).toHaveLength(0);
    expect(oldClient.getMutationCache().getAll()).toHaveLength(0);
  });

  it("lädt nach Logout und erneuter Anmeldung desselben Kontos neu", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    Object.assign(auth, { isSignedIn: false, userId: null, sessionId: null });
    view.rerender(tree());
    switchAccount("A", "new-session-A");
    load = vi.fn(async () => "new-private-A");
    view.rerender(tree());
    expect(currentClient).not.toBe(oldClient);
    await expectData("new-private-A");
    expect(load).toHaveBeenCalled();
  });

  it("isoliert auch einen Sitzungswechsel desselben Benutzers", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    switchAccount("A", "other-session-A");
    view.rerender(tree());
    expect(currentClient).not.toBe(oldClient);
    await expectData("private-A");
  });

  it("verwendet beim Zurückwechseln zu A keinen früheren A-Cache", async () => {
    const view = render(tree());
    await expectData("private-A");
    const firstClient = currentClient;
    switchAccount("B"); view.rerender(tree());
    await expectData("private-B");
    switchAccount("A"); view.rerender(tree());
    expect(currentClient).not.toBe(firstClient);
    await expectData("private-A");
  });

  it("behält Cache und lokale Zustände bei normalen Rendern derselben Sitzung", async () => {
    const view = render(tree());
    await expectData("private-A");
    const client = currentClient;
    fireEvent.change(screen.getByLabelText("Draft"), { target: { value: "Mein Entwurf" } });
    const calls = vi.mocked(load).mock.calls.length;
    view.rerender(tree());
    expect(currentClient).toBe(client);
    expect((screen.getByLabelText("Draft") as HTMLInputElement).value).toBe("Mein Entwurf");
    expect(vi.mocked(load).mock.calls.length).toBe(calls);
    expect(client.getDefaultOptions().queries).toMatchObject({ staleTime: 30_000, retry: 1, refetchOnWindowFocus: false });
  });

  it("blendet geschützte Inhalte aus, solange Clerk den Zustand neu ermittelt", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    auth.isLoaded = false;
    view.rerender(tree());
    expect(screen.queryByTestId("data")).toBeNull();
    expect(oldClient.getQueryCache().getAll()).toHaveLength(0);
    switchAccount("B"); view.rerender(tree());
    await expectData("private-B");
  });

  it("wartet auf eine vollständige Clerk-Identität", () => {
    auth.sessionId = null;
    render(tree());
    expect(screen.queryByTestId("data")).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it("übernimmt keine verspäteten Query-Antworten des vorherigen Kontos", async () => {
    const pending = deferred<string>();
    load = vi.fn(() => pending.promise);
    const view = render(tree());
    const oldClient = currentClient;
    switchAccount("B"); view.rerender(tree());
    await expectData("private-B");
    await act(async () => { pending.resolve("late-private-A"); await pending.promise; });
    expect(screen.getByTestId("data").textContent).toBe("private-B");
    expect(oldClient.getQueryData(["customers"])).toBeUndefined();
    expect(renders.filter(row => row.userId === "B").every(row => row.data !== "late-private-A")).toBe(true);
  });

  it("isoliert verspätete Mutationscallbacks und erhält Invalidierungen des aktuellen Kontos", async () => {
    const view = render(tree());
    await expectData("private-A");
    const oldClient = currentClient;
    const pending = deferred<string>();
    const mutation = oldClient.getMutationCache().build(oldClient, {
      mutationFn: () => pending.promise,
      onSuccess: value => { oldClient.setQueryData(["customers"], value); },
    });
    let execution!: Promise<string>;
    await act(async () => { execution = mutation.execute(undefined); });
    switchAccount("B"); view.rerender(tree());
    await expectData("private-B");
    await act(async () => { pending.resolve("mutation-private-A"); await execution; });
    expect(screen.getByTestId("data").textContent).toBe("private-B");
    load = vi.fn(async () => "updated-private-B");
    view.rerender(tree());
    await act(async () => { await currentClient.invalidateQueries({ queryKey: ["customers"] }); });
    await expectData("updated-private-B");
  });
});
