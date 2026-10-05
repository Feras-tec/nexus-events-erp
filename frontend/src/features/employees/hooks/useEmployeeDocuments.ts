import { useAuth } from "@clerk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { EmployeeDocumentFormData } from "../../../components/organisms/EmployeeDocumentForm";
import { apiFetch } from "../../../services/api";

type UseEmployeeDocumentsParams = {
  employeeId: string;
  onCreateSuccess?: () => void;
  onUpdateSuccess?: () => void;
  onDeleteSuccess?: () => void;
};

export function useEmployeeDocuments({
  employeeId,
  onCreateSuccess,
  onUpdateSuccess,
  onDeleteSuccess,
}: UseEmployeeDocumentsParams) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const invalidateEmployee = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["employees", employeeId],
    });
  };

  const createEmployeeDocumentMutation = useMutation({
    mutationFn: async (data: EmployeeDocumentFormData) => {
      const token = await getToken();

      const payload = {
        type: data.type,
        documentNumber: data.documentNumber.trim() || undefined,
        issueDate: data.issueDate || undefined,
        expiryDate: data.expiryDate || undefined,
        fileUrl: data.fileUrl.trim() || undefined,
        notes: data.notes.trim() || undefined,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}/documents`,
        token,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onCreateSuccess?.();
    },
  });

  const updateEmployeeDocumentMutation = useMutation({
    mutationFn: async ({
      documentId,
      data,
    }: {
      documentId: string;
      data: EmployeeDocumentFormData;
    }) => {
      const token = await getToken();

      const payload = {
        type: data.type,
        documentNumber: data.documentNumber.trim() || null,
        issueDate: data.issueDate || null,
        expiryDate: data.expiryDate || null,
        fileUrl: data.fileUrl.trim() || null,
        notes: data.notes.trim() || null,
      };

      const response = await apiFetch(
        `/api/employees/${employeeId}/documents/${documentId}`,
        token,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onUpdateSuccess?.();
    },
  });

  const deleteEmployeeDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const token = await getToken();

      const response = await apiFetch(
        `/api/employees/${employeeId}/documents/${documentId}`,
        token,
        {
          method: "DELETE",
        },
      );

      return response.json();
    },

    onSuccess: async () => {
      await invalidateEmployee();
      onDeleteSuccess?.();
    },
  });

  return {
    createEmployeeDocumentMutation,
    updateEmployeeDocumentMutation,
    deleteEmployeeDocumentMutation,
  };
}
