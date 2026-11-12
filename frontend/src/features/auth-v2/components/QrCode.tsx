import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { useTranslation } from "react-i18next";
import { QrCode as QrCodeIcon } from "lucide-react";

type QrCodeProps = {
  value: string;
  label: string;
  size?: number;
};

/**
 * Renders the otpauth URI locally. No secret ever leaves the browser and no
 * external QR image service is contacted.
 */
export function QrCode({ value, label, size = 220 }: QrCodeProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    setFailed(false);
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#111827", light: "#ffffff" },
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });

    return () => {
      cancelled = true;
    };
  }, [size, value]);

  if (failed) {
    return (
      <div className="flex max-w-[260px] items-start gap-2 rounded-2xl border border-warning/35 bg-warning/10 p-3 text-xs text-warning">
        <QrCodeIcon size={16} className="mt-0.5 shrink-0" />
        <span>{t("authV2.mfa.qrError")}</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      data-testid="auth-v2-qr"
      className="h-auto w-full max-w-[220px] rounded-2xl border border-base-300 bg-white p-2 shadow-sm"
    />
  );
}
