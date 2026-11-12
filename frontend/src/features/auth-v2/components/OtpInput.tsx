import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

type OtpInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  length?: number;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
};

export function OtpInput({
  value,
  onChange,
  label,
  length = 6,
  error,
  disabled = false,
  autoFocus = false,
  describedBy,
}: OtpInputProps) {
  const { t } = useTranslation();
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.replace(/\D/g, "").slice(0, length);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function focusAt(index: number) {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
    refs.current[clamped]?.select();
  }

  function setDigits(next: string) {
    onChange(next.replace(/\D/g, "").slice(0, length));
  }

  function handleChange(index: number, raw: string) {
    const entered = raw.replace(/\D/g, "");
    if (entered.length === 0) {
      if (index < digits.length) {
        setDigits(digits.slice(0, index) + digits.slice(index + 1));
      }
      return;
    }

    if (index >= digits.length) {
      setDigits(digits + entered);
      focusAt(digits.length + entered.length - 1);
      return;
    }

    setDigits(
      digits.slice(0, index) + entered.charAt(0) + digits.slice(index + 1),
    );
    focusAt(index + 1);
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (index < digits.length) {
        setDigits(digits.slice(0, index) + digits.slice(index + 1));
        focusAt(index);
      } else if (digits.length > 0) {
        setDigits(digits.slice(0, -1));
        focusAt(digits.length - 2);
      }
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      if (index < digits.length) {
        setDigits(digits.slice(0, index) + digits.slice(index + 1));
        focusAt(index);
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      focusAt(0);
    } else if (event.key === "End") {
      event.preventDefault();
      focusAt(length - 1);
    }
  }

  function handlePaste(
    index: number,
    event: ClipboardEvent<HTMLInputElement>,
  ) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === 0) return;
    event.preventDefault();
    const next = `${digits.slice(0, index)}${pasted}`.slice(0, length);
    setDigits(next);
    focusAt(next.length - 1);
  }

  return (
    <div>
      <div
        role="group"
        aria-label={label}
        aria-describedby={describedBy}
        dir="ltr"
        className="flex items-center justify-center gap-2"
      >
        {Array.from({ length }, (_, index) => {
          const digit = digits[index] ?? "";
          return (
            <input
              key={index}
              ref={(element) => {
                refs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={() => {
                if (index > digits.length) focusAt(digits.length);
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              maxLength={1}
              disabled={disabled}
              aria-label={t("authV2.twoFactor.digitLabel", {
                index: index + 1,
                total: length,
              })}
              aria-invalid={error ? true : undefined}
              className={`input input-bordered h-14 min-h-14 w-11 rounded-xl bg-base-100 p-0 text-center text-xl font-bold tabular-nums sm:w-12 ${
                error ? "input-error" : ""
              }`}
            />
          );
        })}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs font-medium text-error">
          {error}
        </p>
      )}
    </div>
  );
}
