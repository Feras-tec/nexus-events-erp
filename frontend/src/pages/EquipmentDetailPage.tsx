import { useState } from "react";
import { useAuth } from "@clerk/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "../components/atoms/Button";
import { StatusChip } from "../components/atoms/StatusChip";
import {
  EquipmentForm,
  type EquipmentFormValues,
  type ProductOption,
  type WarehouseOption,
} from "../components/organisms/EquipmentForm";
import type { ReservationItem } from "../components/organisms/ReservationTable";
import { DetailLayout } from "../components/templates/DetailLayout";
import { apiFetch } from "../services/api";

type EquipmentDetail = {
  id: string;
  assetNo: string;
  manufacturerSerial?: string | null;
  barcode?: string | null;
  status: EquipmentFormValues["status"];
  location?: string | null;
  purchaseDate?: string | null;
  purchasePrice?: string | number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  productId: string;
  warehouseId: string;

  product: ProductOption & {
    category?: string | null;
    description?: string | null;
    trackingType: "SERIALIZED" | "QUANTITY";
    usageType: "RENTAL" | "SALE" | "BOTH";
  };

  warehouse: WarehouseOption & {
    code?: string;
    address?: string | null;
  };
};

type EquipmentResponse = {
  data: EquipmentDetail;
};

type ProductsResponse = {
  data: ProductOption[];
};

type WarehousesResponse = {
  data: WarehouseOption[];
};

type EmployeeOption = {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  position?: string | null;
  status: string;
};

type EmployeesResponse = {
  data: EmployeeOption[];
};

type EquipmentMovement = {
  id: string;
  type:
    | "RECEIVED"
    | "RESERVED"
    | "RELEASED"
    | "PICKED"
    | "PACKED"
    | "LOADED"
    | "TRANSFERRED"
    | "DELIVERED_TO_EVENT"
    | "RETURNED_FROM_EVENT"
    | "INSPECTION"
    | "MAINTENANCE"
    | "REPAIRED"
    | "LOST"
    | "RETIRED"
    | "MANUAL_ADJUSTMENT";
  fromStatus?: EquipmentFormValues["status"] | null;
  toStatus: EquipmentFormValues["status"];
  fromLocation?: string | null;
  toLocation?: string | null;
  notes?: string | null;
  createdAt: string;

  reservation?: {
    id: string;
    startDate: string;
    endDate: string;
    status: string;
    event: {
      id: string;
      eventNo: string;
      name: string;
      location?: string | null;
      customer: {
        id: string;
        customerNo: string;
        companyName?: string | null;
        firstName?: string | null;
        lastName?: string | null;
      };
    };
  } | null;

  responsibleEmployee?: {
    id: string;
    employeeNo: string;
    firstName: string;
    lastName: string;
    position?: string | null;
  } | null;

  fromWarehouse?: WarehouseOption | null;
  toWarehouse?: WarehouseOption | null;
};

type EquipmentMovementsResponse = {
  inventoryItem: {
    id: string;
    assetNo: string;
  };
  movements: EquipmentMovement[];
};

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("de-DE").format(new Date(value));
}

function formatPrice(value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return String(value);
  }

  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(number);
}

export function EquipmentDetailPage() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [transferWarehouseId, setTransferWarehouseId] = useState("");
  const [responsibleEmployeeId, setResponsibleEmployeeId] = useState("");

  const { equipmentId } = useParams({
    from: "/app/equipment/$equipmentId",
  });

  const {
    data: equipment,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["equipment", equipmentId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/inventory-items/${equipmentId}`,
        token,
      );

      const result = (await response.json()) as EquipmentResponse;

      return result.data;
    },
  });

  const {
    data: reservations = [],
    isLoading: reservationsLoading,
  } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiFetch("/api/reservations", token);

      return (await response.json()) as ReservationItem[];
    },
  });

  const {
    data: movements = [],
    isLoading: movementsLoading,
    isError: movementsError,
  } = useQuery({
    queryKey: ["equipment-movements", equipmentId],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
      );

      const result =
        (await response.json()) as EquipmentMovementsResponse;

      return result.movements;
    },
  });

  const equipmentReservations = reservations.filter(
    (reservation) =>
      reservation.inventoryItem.id === equipmentId &&
      reservation.status !== "CANCELLED" &&
      !movements.some(
        (movement) =>
          movement.type === "RESERVED" &&
          movement.reservation?.id === reservation.id,
      ),
  );

  const {
    data: products = [],
    isLoading: productsLoading,
    isError: productsError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/products", token);
      const result = (await response.json()) as ProductsResponse;

      return result.data;
    },
  });

  const {
    data: warehouses = [],
    isLoading: warehousesLoading,
    isError: warehousesError,
  } = useQuery({
    queryKey: ["warehouses"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/warehouses", token);
      const result = (await response.json()) as WarehousesResponse;

      return result.data;
    },
  });

  const {
    data: employees = [],
    isLoading: employeesLoading,
    isError: employeesError,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const token = await getToken();

      const response = await apiFetch("/api/employees", token);
      const result = (await response.json()) as EmployeesResponse;

      return result.data.filter((employee) => employee.status === "ACTIVE");
    },
  });

  const activeMovementReservation =
    movements.find((movement) => movement.reservation)?.reservation ?? null;

  const checkedOutMovement = activeMovementReservation
    ? movements.find(
        (movement) =>
          movement.type === "LOADED" &&
          movement.reservation?.id === activeMovementReservation.id,
      )
    : undefined;

  const transferWarehouseMutation = useMutation({
    mutationFn: async (toWarehouseId: string) => {
      if (!equipment) {
        throw new Error("Gerät wurde nicht gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "TRANSFERRED",
            toStatus: equipment.status,
            toWarehouseId,
            notes: "Gerät wurde in ein anderes Lager übertragen",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error ?? "Lagertransfer fehlgeschlagen.");
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["warehouses"],
        }),
      ]);
    },
  });

  const startPickingMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "PICKED",
            toStatus: "PICKING",
            reservationId: activeMovementReservation.id,
            notes: "Kommissionierung gestartet",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const markPackedMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "PACKED",
            toStatus: "PACKED",
            reservationId: activeMovementReservation.id,
            notes: "Gerät wurde gepackt",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const markLoadedMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "LOADED",
            toStatus: "IN_TRANSIT",
            toLocation: "Unterwegs zum Event",
            reservationId: activeMovementReservation.id,
            responsibleEmployeeId,
            notes: "Gerät wurde verladen",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "DELIVERED_TO_EVENT",
            toStatus: "AT_EVENT",
            toLocation:
              activeMovementReservation.event.location ||
              activeMovementReservation.event.name,
            reservationId: activeMovementReservation.id,
            notes: "Gerät ist am Event angekommen",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const startReturnMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "RETURNED_FROM_EVENT",
            toStatus: "RETURNING",
            toLocation: "Rücktransport zum Lager",
            reservationId: activeMovementReservation.id,
            notes: "Rücktransport vom Event gestartet",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const startInspectionMutation = useMutation({
    mutationFn: async () => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "INSPECTION",
            toStatus: "INSPECTION",
            toLocation: `Prüfbereich – ${equipment?.warehouse.name ?? "Lager"}`,
            reservationId: activeMovementReservation.id,
            notes: "Geräteprüfung nach Rückkehr gestartet",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const completeInspectionMutation = useMutation({
    mutationFn: async (
      result: "AVAILABLE" | "DAMAGED" | "MAINTENANCE",
    ) => {
      if (!activeMovementReservation) {
        throw new Error("Keine Reservierung für diese Bewegung gefunden.");
      }

      const token = await getToken();

      const notes = {
        AVAILABLE: "Prüfung abgeschlossen – Gerät ist einsatzbereit",
        DAMAGED: "Prüfung abgeschlossen – Gerät ist beschädigt",
        MAINTENANCE: "Prüfung abgeschlossen – Wartung erforderlich",
      }[result];

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: result === "MAINTENANCE" ? "MAINTENANCE" : "INSPECTION",
            toStatus: result,
            ...(result === "AVAILABLE"
              ? {
                  toLocation: `Lagerbereich – ${equipment?.warehouse.name ?? "Lager"}`,
                }
              : {}),
            reservationId: activeMovementReservation.id,
            notes,
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const startMaintenanceMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "MAINTENANCE",
            toStatus: "MAINTENANCE",
            toLocation: `Wartungsbereich – ${equipment?.warehouse.name ?? "Lager"}`,
            notes: "Beschädigtes Gerät zur Wartung übergeben",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.error ?? "Gerät konnte nicht zur Wartung übergeben werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const completeRepairMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "REPAIRED",
            toStatus: "REPAIRED",
            toLocation: `Reparatur abgeschlossen – ${equipment?.warehouse.name ?? "Lager"}`,
            notes: "Wartung abgeschlossen – Gerät wurde repariert",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.error ?? "Reparatur konnte nicht abgeschlossen werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const returnRepairedToAvailableMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "REPAIRED",
            toStatus: "AVAILABLE",
            toLocation: `Lagerbereich – ${equipment?.warehouse.name ?? "Lager"}`,
            notes: "Repariertes Gerät wieder einsatzbereit",
          }),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.error ?? "Gerät konnte nicht freigegeben werden.",
        );
      }

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/equipment-movements/${equipmentId}`,
        token,
        {
          method: "POST",
          body: JSON.stringify({
            type: "RESERVED",
            toStatus: "RESERVED",
            reservationId,
            notes: "Für Event reserviert",
          }),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment-movements", equipmentId],
        }),
      ]);
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: EquipmentFormValues) => {
      const token = await getToken();

      const payload = {
        manufacturerSerial: data.manufacturerSerial.trim() || undefined,
        barcode: data.barcode.trim() || undefined,
        status: data.status,
        location: data.location.trim() || undefined,
        purchaseDate: data.purchaseDate || undefined,
        purchasePrice: data.purchasePrice
          ? Number(data.purchasePrice)
          : undefined,
        notes: data.notes.trim() || undefined,
        warehouseId: data.warehouseId,
      };

      const response = await apiFetch(
        `/api/inventory-items/${equipmentId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["equipment", equipmentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["equipment"],
        }),
      ]);

      setIsEditing(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <span
          className="loading loading-spinner loading-lg"
          aria-label="Gerät wird geladen"
        />
      </div>
    );
  }

  if (isError || !equipment) {
    return (
      <div role="alert" className="alert alert-error">
        Gerät konnte nicht geladen werden.
      </div>
    );
  }

  const initialValues: EquipmentFormValues = {
    assetNo: equipment.assetNo,
    manufacturerSerial: equipment.manufacturerSerial ?? "",
    barcode: equipment.barcode ?? "",
    status: equipment.status,
    location: equipment.location ?? "",
    purchaseDate: equipment.purchaseDate
      ? equipment.purchaseDate.slice(0, 10)
      : "",
    purchasePrice:
      equipment.purchasePrice !== null && equipment.purchasePrice !== undefined
        ? String(equipment.purchasePrice)
        : "",
    notes: equipment.notes ?? "",
    productId: equipment.productId,
    warehouseId: equipment.warehouseId,
  };

  const formDataLoading = productsLoading || warehousesLoading;
  const formDataError = productsError || warehousesError;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <DetailLayout
        title={equipment.product.name}
        description={`Asset-Nr. ${equipment.assetNo}`}
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                navigate({
                  to: "/equipment",
                });
              }}
            >
              Zurück
            </Button>

            <Button
              type="button"
              onClick={() => setIsEditing((current) => !current)}
            >
              {isEditing ? "Abbrechen" : "Bearbeiten"}
            </Button>
          </>
        }
      >
        <AnimatePresence>
          {isEditing && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="mb-6 rounded-box border border-base-300 bg-base-100 p-6"
            >
              {formDataLoading && (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg" />
                </div>
              )}

              {formDataError && (
                <div role="alert" className="alert alert-error">
                  Produkte oder Lager konnten nicht geladen werden.
                </div>
              )}

              {!formDataLoading && !formDataError && (
                <EquipmentForm
                  mode="edit"
                  products={products}
                  warehouses={warehouses}
                  initialValues={initialValues}
                  loading={updateEquipmentMutation.isPending}
                  onSubmit={(data) => updateEquipmentMutation.mutate(data)}
                />
              )}

              {updateEquipmentMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Änderungen konnten nicht gespeichert werden.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {equipment.status === "AVAILABLE" && (
          <section className="mb-6 rounded-box border border-base-300 bg-base-100 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Lagertransfer</h2>
            <p className="text-sm text-base-content/60">
              Gerät von {equipment.warehouse.name} in ein anderes Lager umlagern
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="form-control w-full sm:max-w-md">
              <span className="label-text mb-2">Ziellager</span>

              <select
                className="select select-bordered w-full"
                value={transferWarehouseId}
                onChange={(event) =>
                  setTransferWarehouseId(event.target.value)
                }
                disabled={transferWarehouseMutation.isPending}
              >
                <option value="">Lager auswählen</option>

                {warehouses
                  .filter((warehouse) => warehouse.id !== equipment.warehouseId)
                  .map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </option>
                  ))}
              </select>
            </label>

            <Button
              type="button"
              disabled={
                !transferWarehouseId ||
                transferWarehouseMutation.isPending
              }
              onClick={() =>
                transferWarehouseMutation.mutate(transferWarehouseId, {
                  onSuccess: () => setTransferWarehouseId(""),
                })
              }
            >
              {transferWarehouseMutation.isPending
                ? "Wird umgelagert..."
                : "Umlagern"}
            </Button>
          </div>

          {transferWarehouseMutation.isError && (
            <div role="alert" className="alert alert-error mt-4">
              {transferWarehouseMutation.error instanceof Error
                ? transferWarehouseMutation.error.message
                : "Lagertransfer fehlgeschlagen."}
            </div>
          )}

          {transferWarehouseMutation.isSuccess && (
            <div role="alert" className="alert alert-success mt-4">
              Gerät wurde erfolgreich umgelagert.
            </div>
          )}
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Gerätedaten</h2>
                <p className="text-sm text-base-content/60">
                  Technische und interne Informationen
                </p>
              </div>

              <StatusChip status={equipment.status} />
            </div>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">Asset-Nr.</dt>
                <dd className="font-medium">{equipment.assetNo}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Seriennummer</dt>
                <dd>{equipment.manufacturerSerial ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Barcode</dt>
                <dd>{equipment.barcode ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Standort</dt>
                <dd>{equipment.location ?? "—"}</dd>
              </div>

              {activeMovementReservation &&
                ["RESERVED", "PICKING", "PACKED", "IN_TRANSIT", "AT_EVENT", "RETURNING", "INSPECTION"].includes(
                  equipment.status,
                ) && (
                  <div>
                    <dt className="text-sm text-base-content/60">
                      Erwartete Rückgabe
                    </dt>
                    <dd className="font-medium">
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(activeMovementReservation.endDate))}
                    </dd>
                  </div>
                )}

              {checkedOutMovement &&
                ["IN_TRANSIT", "AT_EVENT", "RETURNING", "INSPECTION"].includes(
                  equipment.status,
                ) && (
                  <>
                    <div>
                      <dt className="text-sm text-base-content/60">
                        Ausgecheckt am
                      </dt>
                      <dd className="font-medium">
                        {new Intl.DateTimeFormat("de-DE", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(checkedOutMovement.createdAt))}
                      </dd>
                    </div>

                    {checkedOutMovement.responsibleEmployee && (
                      <div>
                        <dt className="text-sm text-base-content/60">
                          Verantwortlich
                        </dt>
                        <dd className="font-medium">
                          {checkedOutMovement.responsibleEmployee.firstName}{" "}
                          {checkedOutMovement.responsibleEmployee.lastName}
                        </dd>
                        <dd className="text-sm text-base-content/60">
                          {checkedOutMovement.responsibleEmployee.employeeNo}
                          {checkedOutMovement.responsibleEmployee.position
                            ? ` · ${checkedOutMovement.responsibleEmployee.position}`
                            : ""}
                        </dd>
                      </div>
                    )}
                  </>
                )}

              <div>
                <dt className="text-sm text-base-content/60">Kaufdatum</dt>
                <dd>{formatDate(equipment.purchaseDate)}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Kaufpreis</dt>
                <dd>{formatPrice(equipment.purchasePrice)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6">
            <h2 className="mb-5 text-lg font-semibold">Produkt & Lager</h2>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-base-content/60">Produktnummer</dt>
                <dd className="font-medium">{equipment.product.productNo}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Produkt</dt>
                <dd>{equipment.product.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Marke</dt>
                <dd>{equipment.product.brand ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Modell</dt>
                <dd>{equipment.product.model ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Kategorie</dt>
                <dd>{equipment.product.category ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Lager</dt>
                <dd>{equipment.warehouse.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Niederlassung</dt>
                <dd>{equipment.warehouse.branch.name}</dd>
              </div>

              <div>
                <dt className="text-sm text-base-content/60">Lageradresse</dt>
                <dd>{equipment.warehouse.address ?? "—"}</dd>
              </div>
            </dl>
          </section>

          {equipment.status === "REPAIRED" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-success/30 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Reparatur abgeschlossen
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                Das reparierte Gerät prüfen und wieder für den Einsatz freigeben.
              </p>

              <div className="mt-5">
                <Button
                  type="button"
                  disabled={returnRepairedToAvailableMutation.isPending}
                  onClick={() => returnRepairedToAvailableMutation.mutate()}
                >
                  {returnRepairedToAvailableMutation.isPending
                    ? "Wird freigegeben..."
                    : "Gerät freigeben"}
                </Button>
              </div>

              {returnRepairedToAvailableMutation.isError && (
                <div className="alert alert-error mt-4">
                  {returnRepairedToAvailableMutation.error instanceof Error
                    ? returnRepairedToAvailableMutation.error.message
                    : "Gerät konnte nicht freigegeben werden."}
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "MAINTENANCE" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-warning/30 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Gerät in Wartung
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                Wartung oder Reparatur des Geräts abschließen.
              </p>

              <div className="mt-5">
                <Button
                  type="button"
                  disabled={completeRepairMutation.isPending}
                  onClick={() => completeRepairMutation.mutate()}
                >
                  {completeRepairMutation.isPending
                    ? "Wird abgeschlossen..."
                    : "Reparatur abschließen"}
                </Button>
              </div>

              {completeRepairMutation.isError && (
                <div className="alert alert-error mt-4">
                  {completeRepairMutation.error instanceof Error
                    ? completeRepairMutation.error.message
                    : "Reparatur konnte nicht abgeschlossen werden."}
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "DAMAGED" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-error/30 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Beschädigtes Gerät
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                Das Gerät wurde bei der Prüfung als beschädigt eingestuft.
              </p>

              <div className="mt-5">
                <Button
                  type="button"
                  disabled={startMaintenanceMutation.isPending}
                  onClick={() => startMaintenanceMutation.mutate()}
                >
                  {startMaintenanceMutation.isPending
                    ? "Wird übergeben..."
                    : "Zur Wartung übergeben"}
                </Button>
              </div>

              {startMaintenanceMutation.isError && (
                <div className="alert alert-error mt-4">
                  {startMaintenanceMutation.error instanceof Error
                    ? startMaintenanceMutation.error.message
                    : "Gerät konnte nicht zur Wartung übergeben werden."}
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "INSPECTION" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Prüfung abschließen
              </h2>

              <p className="mt-1 text-sm text-base-content/60">
                Ergebnis der Geräteprüfung auswählen.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  type="button"
                  disabled={completeInspectionMutation.isPending}
                  onClick={() =>
                    completeInspectionMutation.mutate("AVAILABLE")
                  }
                >
                  Einsatzbereit
                </Button>

                <Button
                  type="button"
                  disabled={completeInspectionMutation.isPending}
                  onClick={() =>
                    completeInspectionMutation.mutate("DAMAGED")
                  }
                >
                  Beschädigt
                </Button>

                <Button
                  type="button"
                  disabled={completeInspectionMutation.isPending}
                  onClick={() =>
                    completeInspectionMutation.mutate("MAINTENANCE")
                  }
                >
                  Wartung erforderlich
                </Button>
              </div>

              {completeInspectionMutation.isError && (
                <div className="alert alert-error mt-4">
                  Prüfergebnis konnte nicht gespeichert werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "RETURNING" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Zurückgekehrtes Gerät zur Prüfung übergeben.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={startInspectionMutation.isPending}
                    disabled={startInspectionMutation.isPending}
                    onClick={() => startInspectionMutation.mutate()}
                  >
                    Prüfung starten
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {startInspectionMutation.isError && (
                <div className="alert alert-error mt-4">
                  Geräteprüfung konnte nicht gestartet werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "AT_EVENT" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Rücktransport des Geräts vom Event starten.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={startReturnMutation.isPending}
                    disabled={startReturnMutation.isPending}
                    onClick={() => startReturnMutation.mutate()}
                  >
                    Rücktransport starten
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {startReturnMutation.isError && (
                <div className="alert alert-error mt-4">
                  Rücktransport konnte nicht gestartet werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "IN_TRANSIT" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Ankunft des Geräts am Event bestätigen.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={markDeliveredMutation.isPending}
                    disabled={markDeliveredMutation.isPending}
                    onClick={() => markDeliveredMutation.mutate()}
                  >
                    Am Event angekommen
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {markDeliveredMutation.isError && (
                <div className="alert alert-error mt-4">
                  Ankunft am Event konnte nicht gespeichert werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "PACKED" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Gepacktes Gerät für den Transport zum Event verladen.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <div className="mt-4">
                    <label className="label" htmlFor="responsibleEmployee">
                      Verantwortlicher Mitarbeiter
                    </label>

                    <select
                      id="responsibleEmployee"
                      className="select select-bordered w-full"
                      value={responsibleEmployeeId}
                      onChange={(event) =>
                        setResponsibleEmployeeId(event.target.value)
                      }
                      disabled={employeesLoading || markLoadedMutation.isPending}
                    >
                      <option value="">
                        Mitarbeiter auswählen
                      </option>

                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.employeeNo} – {employee.firstName}{" "}
                          {employee.lastName}
                          {employee.position ? ` – ${employee.position}` : ""}
                        </option>
                      ))}
                    </select>

                    {employeesError && (
                      <div className="alert alert-error mt-3">
                        Mitarbeiter konnten nicht geladen werden.
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={markLoadedMutation.isPending}
                    disabled={
                      markLoadedMutation.isPending ||
                      employeesLoading ||
                      !responsibleEmployeeId
                    }
                    onClick={() => markLoadedMutation.mutate()}
                  >
                    Als verladen markieren
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {markLoadedMutation.isError && (
                <div className="alert alert-error mt-4">
                  Gerät konnte nicht als verladen markiert werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "PICKING" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Kommissioniertes Gerät als gepackt markieren.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={markPackedMutation.isPending}
                    disabled={markPackedMutation.isPending}
                    onClick={() => markPackedMutation.mutate()}
                  >
                    Als gepackt markieren
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {markPackedMutation.isError && (
                <div className="alert alert-error mt-4">
                  Gerät konnte nicht als gepackt markiert werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "RESERVED" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">Neue Bewegung</h2>

              <p className="mt-1 text-sm text-base-content/60">
                Reserviertes Gerät für die Kommissionierung vorbereiten.
              </p>

              {activeMovementReservation ? (
                <div className="mt-5 rounded-box border border-base-300 p-4">
                  <div className="font-semibold">
                    {activeMovementReservation.event.eventNo} ·{" "}
                    {activeMovementReservation.event.name}
                  </div>

                  <Button
                    type="button"
                    className="mt-4"
                    loading={startPickingMutation.isPending}
                    disabled={startPickingMutation.isPending}
                    onClick={() => startPickingMutation.mutate()}
                  >
                    Kommissionierung starten
                  </Button>
                </div>
              ) : (
                <div className="alert alert-warning mt-5">
                  Keine verknüpfte Reservierung gefunden.
                </div>
              )}

              {startPickingMutation.isError && (
                <div className="alert alert-error mt-4">
                  Kommissionierung konnte nicht gestartet werden.
                </div>
              )}
            </motion.section>
          )}

          {equipment.status === "AVAILABLE" && (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
            >
              <h2 className="text-lg font-semibold">
                Neue Bewegung
              </h2>
              <p className="mt-1 text-sm text-base-content/60">
                Gerät für eine bestehende Event-Reservierung vormerken.
              </p>

              {reservationsLoading ? (
                <div className="mt-5">
                  <span className="loading loading-spinner loading-md" />
                </div>
              ) : equipmentReservations.length === 0 ? (
                <div className="alert mt-5">
                  Keine aktive Reservierung für dieses Gerät vorhanden.
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {equipmentReservations.map((reservation) => (
                    <div
                      key={reservation.id}
                      className="flex flex-col gap-4 rounded-box border border-base-300 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-semibold">
                          {reservation.event.eventNo} ·{" "}
                          {reservation.event.name}
                        </div>

                        <div className="mt-1 text-sm text-base-content/60">
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(reservation.startDate))}
                          {" – "}
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(reservation.endDate))}
                        </div>

                        <div className="mt-1 text-sm">
                          Status: {reservation.status}
                        </div>
                      </div>

                      <Button
                        type="button"
                        loading={createMovementMutation.isPending}
                        disabled={
                          createMovementMutation.isPending ||
                          reservation.status !== "CONFIRMED"
                        }
                        onClick={() =>
                          createMovementMutation.mutate(reservation.id)
                        }
                      >
                        Reservieren
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {createMovementMutation.isError && (
                <div role="alert" className="alert alert-error mt-4">
                  Gerätebewegung konnte nicht gespeichert werden.
                </div>
              )}
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2"
          >
            <div className="mb-5">
              <h2 className="text-lg font-semibold">
                Bewegungshistorie
              </h2>
              <p className="text-sm text-base-content/60">
                Status- und Gerätebewegungen
              </p>
            </div>

            {movementsLoading && (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md" />
              </div>
            )}

            {movementsError && (
              <div role="alert" className="alert alert-error">
                Bewegungshistorie konnte nicht geladen werden.
              </div>
            )}

            {!movementsLoading &&
              !movementsError &&
              movements.length === 0 && (
                <div className="rounded-box bg-base-200 p-5 text-sm text-base-content/60">
                  Noch keine Gerätebewegungen vorhanden.
                </div>
              )}

            {!movementsLoading &&
              !movementsError &&
              movements.length > 0 && (
                <div className="space-y-3">
                  {movements.map((movement) => (
                    <div
                      key={movement.id}
                      className="rounded-box border border-base-300 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">
                            {movement.type}
                          </div>

                          <div className="mt-1 text-sm text-base-content/60">
                            {movement.fromStatus ?? "—"} →{" "}
                            {movement.toStatus}
                          </div>
                        </div>

                        <div className="text-sm text-base-content/60">
                          {new Intl.DateTimeFormat("de-DE", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(movement.createdAt))}
                        </div>
                      </div>

                      {(movement.fromLocation ||
                        movement.toLocation) && (
                        <div className="mt-3 text-sm">
                          Standort:{" "}
                          {movement.fromLocation ?? "—"} →{" "}
                          {movement.toLocation ?? "—"}
                        </div>
                      )}

                      {(movement.fromWarehouse ||
                        movement.toWarehouse) && (
                        <div className="mt-2 text-sm">
                          Lager:{" "}
                          <span className="font-medium">
                            {movement.fromWarehouse?.name ?? "—"} →{" "}
                            {movement.toWarehouse?.name ?? "—"}
                          </span>
                        </div>
                      )}

                      {movement.reservation?.event && (
                        <div className="mt-3 rounded-box bg-base-200 p-3 text-sm">
                          Event:{" "}
                          <span className="font-medium">
                            {movement.reservation.event.eventNo} ·{" "}
                            {movement.reservation.event.name}
                          </span>
                        </div>
                      )}

                      {movement.responsibleEmployee && (
                        <div className="mt-2 text-sm">
                          Verantwortlich:{" "}
                          <span className="font-medium">
                            {movement.responsibleEmployee.firstName}{" "}
                            {movement.responsibleEmployee.lastName}
                          </span>
                        </div>
                      )}

                      {movement.notes && (
                        <p className="mt-2 text-sm text-base-content/70">
                          {movement.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
          </motion.section>

          <section className="rounded-box border border-base-300 bg-base-100 p-6 lg:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Notizen</h2>

            <p className="whitespace-pre-wrap text-base-content/80">
              {equipment.notes || "Keine Notizen vorhanden."}
            </p>
          </section>
        </div>
      </DetailLayout>
    </motion.div>
  );
}
