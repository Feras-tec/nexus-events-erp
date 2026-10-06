import { useCallback } from "react";

export function useQuotePrint() {
  const printQuote = useCallback(() => {
    window.print();
  }, []);

  return {
    printQuote,
  };
}
