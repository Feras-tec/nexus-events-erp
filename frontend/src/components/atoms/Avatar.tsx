type AvatarProps = {
  src?: string;
  alt: string;
  initials?: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "w-8",
  md: "w-10",
  lg: "w-14",
};

export function Avatar({
  src,
  alt,
  initials,
  size = "md",
}: AvatarProps) {
  return (
    <div className="avatar placeholder">
      <div
        className={`${sizeClasses[size]} rounded-full bg-neutral text-neutral-content`}
      >
        {src ? (
          <img src={src} alt={alt} />
        ) : (
          <span className="text-sm font-medium">
            {initials ?? "?"}
          </span>
        )}
      </div>
    </div>
  );
}
