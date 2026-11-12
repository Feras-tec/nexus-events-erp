import type { ReactNode } from "react";

type AuthHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
};

export function AuthHeading({ eyebrow, title, description }: AuthHeadingProps) {
  return (
    <header className="mb-6">
      {eyebrow && (
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h1 className="text-2xl font-bold tracking-tight sm:text-[1.7rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-2 text-sm leading-relaxed text-base-content/60">
          {description}
        </p>
      )}
    </header>
  );
}
