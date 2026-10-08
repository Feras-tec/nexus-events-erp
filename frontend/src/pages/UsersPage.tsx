import { useState } from "react";
import { useAppUser } from "../features/users/context/AppUserContext";
import { useAppUsers } from "../features/users/hooks/useAppUsers";
import { useUpdateAppUser } from "../features/users/hooks/useUpdateAppUser";

const roles = [
  "ADMIN",
  "HR_MANAGER",
  "ACCOUNTANT",
  "SALES_MANAGER",
  "PROJECT_MANAGER",
  "DEPARTMENT_MANAGER",
  "WAREHOUSE_MANAGER",
  "TECHNICIAN",
  "WAREHOUSE_EMPLOYEE",
  "SALES_EMPLOYEE",
  "EMPLOYEE",
];

export default function UsersPage() {
  const currentUser = useAppUser();
  const { data: users = [], isLoading, isError } = useAppUsers();
  const updateUser = useUpdateAppUser();

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  if (currentUser?.role !== "OWNER") {
    return (
      <div role="alert" className="alert alert-error">
        Zugriff verweigert. Nur der Eigentümer darf Benutzer verwalten.
      </div>
    );
  }

  const filteredUsers = users.filter((user) =>
    [user.email, user.clerkUserId, user.role]
      .some((value) =>
        (value ?? "").toLowerCase().includes(search.toLowerCase()),
      ),
  );

  async function changeRole(id: string, role: string) {
    if (updateUser.isPending) return;

    const confirmed = window.confirm(
      `Möchten Sie die Benutzerrolle wirklich zu ${role} ändern?`,
    );

    if (!confirmed) return;

    setEditingId(id);
    setMessage(null);

    try {
      await updateUser.mutateAsync({ id, role });
      setMessageType("success");
      setMessage("Benutzerrolle erfolgreich aktualisiert.");
    } catch {
      setMessageType("error");
      setMessage("Fehler beim Aktualisieren der Benutzerrolle.");
    } finally {
      setEditingId(null);
    }
  }

  async function changeStatus(id: string, isActive: boolean) {
    if (updateUser.isPending) return;

    const confirmationMessage = isActive
      ? "Möchten Sie dieses Benutzerkonto wirklich aktivieren?"
      : "Möchten Sie dieses Benutzerkonto wirklich deaktivieren?";

    if (!window.confirm(confirmationMessage)) return;

    setEditingId(id);
    setMessage(null);

    try {
      await updateUser.mutateAsync({ id, isActive });
      setMessageType("success");
      setMessage("Benutzerstatus erfolgreich aktualisiert.");
    } catch {
      setMessageType("error");
      setMessage("Fehler beim Aktualisieren des Benutzerstatus.");
    } finally {
      setEditingId(null);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold">Benutzerverwaltung</h1>
        <p className="text-base-content/60">
          Benutzerkonten, Rollen und Zugriffsrechte verwalten.
        </p>
      </div>

      <div className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <input
          type="search"
          className="input input-bordered w-full max-w-md"
          placeholder="Benutzer suchen..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {message && (
        <div
          role={messageType === "error" ? "alert" : "status"}
          className={`alert ${
            messageType === "error" ? "alert-error" : "alert-success"
          }`}
        >
          {message}
        </div>
      )}

      {isLoading && (
        <span className="loading loading-spinner loading-lg" />
      )}

      {isError && (
        <div role="alert" className="alert alert-error">
          Benutzer konnten nicht geladen werden.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="space-y-3">
          {filteredUsers.length === 0 && (
            <div className="rounded-2xl bg-base-100 p-6 text-center">
              Keine Benutzer gefunden.
            </div>
          )}

          {filteredUsers.map((user) => {
            const isOwner = user.role === "OWNER";
            const busy = editingId === user.id;

            return (
              <div
                key={user.id}
                className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold break-all">
                      {user.email || "E-Mail nicht verfügbar"}
                    </p>
                    <p className="text-xs text-base-content/50 break-all">
                      {user.clerkUserId}
                    </p>
                    <span
                      className={`badge mt-2 ${
                        user.isActive ? "badge-success" : "badge-error"
                      }`}
                    >
                      {user.isActive ? "Aktiv" : "Deaktiviert"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      aria-label="Benutzerrolle"
                      className="select select-bordered w-full sm:w-56"
                      value={user.role}
                      disabled={isOwner || updateUser.isPending}
                      onChange={(event) =>
                        void changeRole(user.id, event.target.value)
                      }
                    >
                      {isOwner && <option value="OWNER">OWNER</option>}
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      className={`btn ${
                        user.isActive ? "btn-outline" : "btn-primary"
                      }`}
                      disabled={isOwner || updateUser.isPending}
                      onClick={() =>
                        void changeStatus(user.id, !user.isActive)
                      }
                    >
                      {busy
                        ? "Speichern..."
                        : user.isActive
                          ? "Deaktivieren"
                          : "Aktivieren"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
