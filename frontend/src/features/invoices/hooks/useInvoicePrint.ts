import { useCallback } from "react";

export function useInvoicePrint() {
  const printInvoice = useCallback(() => {
    window.print();
  }, []);

  return {
    printInvoice,
  };
}
