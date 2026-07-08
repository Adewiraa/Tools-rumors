import { flagStyles, getFlagCdnSvgUrl } from "@/lib/countries";

interface FlagBadgeProps {
  code?: string;
  label?: string;
  flagUrl?: string;
  tiny?: boolean;
}

export function FlagBadge({
  code,
  label,
  flagUrl,
  tiny = false,
}: FlagBadgeProps) {
  const normalizedCode = (code ?? "").toUpperCase();
  const styleClass = flagStyles[normalizedCode];
  const sizeClass = tiny ? "h-2.5 w-4" : "h-3.5 w-5";
  const imageUrl = flagUrl ?? getFlagCdnSvgUrl(normalizedCode);

  if (imageUrl) {
    return (
      <span
        title={label ?? normalizedCode}
        className={`relative shrink-0 overflow-hidden rounded-[0.18rem] border border-white/25 bg-[#2a2e25] shadow-sm shadow-black/30 ${sizeClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={label ?? normalizedCode}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </span>
    );
  }

  if (!styleClass) {
    return (
      <span
        className={`grid shrink-0 place-items-center rounded-sm border border-white/20 bg-[#2a2e25] text-[0.38rem] font-black text-white ${sizeClass}`}
      >
        {normalizedCode || "?"}
      </span>
    );
  }

  return (
    <span
      title={label ?? normalizedCode}
      className={`relative shrink-0 overflow-hidden rounded-[0.18rem] border border-white/25 shadow-sm shadow-black/30 ${styleClass} ${sizeClass}`}
    />
  );
}
