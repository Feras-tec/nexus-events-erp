import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "motion/react";
import {
  Fingerprint,
  LockKeyhole,
  ScrollText,
  ShieldCheck,
} from "lucide-react";
import type { ReactNode } from "react";

import { useDocumentDirection } from "../lib/useDocumentDirection";
import { AuthLanguageSwitcher } from "./AuthLanguageSwitcher";
import { AuthThemeToggle } from "./AuthThemeToggle";
import { NexusMark } from "./NexusMark";

type AuthShellProps = {
  children: ReactNode;
  contentWidth?: "md" | "lg" | "xl";
};

const WIDTH_CLASSES = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const FEATURES = [
  { key: "security", icon: ShieldCheck },
  { key: "mfa", icon: Fingerprint },
  { key: "audit", icon: ScrollText },
] as const;

export function AuthShell({ children, contentWidth = "md" }: AuthShellProps) {
  const { t, i18n } = useTranslation();
  const isRTL = useDocumentDirection();
  const reduceMotion = useReducedMotion();
  const language = i18n.resolvedLanguage ?? i18n.language ?? "de";

  return (
    <div
      lang={language}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative min-h-screen overflow-hidden bg-base-200"
    >
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] xl:grid-cols-[1.1fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-neutral text-neutral-content lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -end-32 -top-40 h-[30rem] w-[30rem] rounded-full bg-primary/35 blur-3xl" />
            <div className="absolute -bottom-48 -start-32 h-[34rem] w-[34rem] rounded-full bg-secondary/25 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
            <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-neutral-content/20 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <NexusMark size="md" inverted />
            <div>
              <p className="text-sm font-semibold tracking-wide">
                {t("authV2.brand.product")}
              </p>
              <p className="text-xs text-neutral-content/60">
                {t("authV2.brand.management")}
              </p>
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-12">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-neutral-content/15 bg-neutral-content/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-content/80">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              {t("authV2.brand.eyebrow")}
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-[2.9rem]">
              {t("authV2.brand.headline")}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-neutral-content/70">
              {t("authV2.brand.description")}
            </p>

            <ul className="mt-10 space-y-4">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-neutral-content/15 bg-neutral-content/10">
                    <Icon size={18} strokeWidth={1.9} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {t(`authV2.brand.features.${key}.title`)}
                    </span>
                    <span className="mt-0.5 block text-sm text-neutral-content/60">
                      {t(`authV2.brand.features.${key}.text`)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 space-y-4">
            <p className="flex items-start gap-2 rounded-2xl border border-neutral-content/10 bg-neutral-content/[0.06] p-3.5 text-xs leading-relaxed text-neutral-content/60">
              <LockKeyhole size={15} className="mt-0.5 shrink-0" />
              {t("authV2.brand.securityNote")}
            </p>
            <p className="text-[11px] text-neutral-content/40">
              {t("authV2.shell.footer")}
            </p>
          </div>
        </aside>

        <main className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-2.5 lg:hidden">
              <NexusMark size="sm" />
              <div>
                <p className="text-sm font-bold leading-tight">
                  {t("authV2.brand.product")}
                </p>
                <p className="text-[11px] text-base-content/55">
                  {t("authV2.brand.management")}
                </p>
              </div>
            </div>
            <div className="ms-auto flex items-center gap-2">
              <AuthLanguageSwitcher />
              <AuthThemeToggle />
            </div>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 pb-8 sm:px-6 lg:px-10">
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className={`w-full ${WIDTH_CLASSES[contentWidth]}`}
            >
              {children}
            </motion.div>
          </div>

          <footer className="px-4 pb-5 text-center text-[11px] text-base-content/45">
            {t("authV2.shell.mobileFooter")}
          </footer>
        </main>
      </div>
    </div>
  );
}
