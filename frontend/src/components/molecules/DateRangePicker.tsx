import { Input } from "../atoms/Input";

type DateRangePickerProps = {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
};

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Startdatum",
  endLabel = "Enddatum",
}: DateRangePickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input
        type="date"
        label={startLabel}
        value={startDate}
        onChange={(event) =>
          onStartDateChange(event.target.value)
        }
      />

      <Input
        type="date"
        label={endLabel}
        value={endDate}
        min={startDate}
        onChange={(event) =>
          onEndDateChange(event.target.value)
        }
      />
    </div>
  );
}
