import type { IconType } from "react-icons";
import { PiCaretRight } from "react-icons/pi";

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description?: string;
}) {
  return (
    <div className="mt-1">
      <div className="text-gray-400 text-2xs font-bold uppercase tracking-wider flex items-center gap-1.5">
        {icon
          ? (() => {
              const I = icon;
              return <I size={14} className="block flex-shrink-0" />;
            })()
          : null}
        {title}
      </div>
      {description ? (
        <div className="text-gray-500 text-xs mt-0.5">{description}</div>
      ) : null}
    </div>
  );
}

export function PermissionRow({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: "unknown" | "granted" | "denied";
}) {
  return (
    <div className="flex items-center gap-3 justify-between">
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-bold">{title}</div>
        <div
          className={`text-xs mt-0.5 ${
            status === "denied" ? "text-red-300" : "text-gray-400"
          }`}
        >
          {status === "denied"
            ? "Denied — re-enable in browser settings if the toggle won't grant."
            : description}
        </div>
      </div>
    </div>
  );
}

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 justify-between">
      <div className="text-white text-xs font-bold">{label}</div>
      <div className="text-gray-400 text-2xs font-mono">{value}</div>
    </div>
  );
}

export interface SettingsMenuButtonProps {
  icon: IconType;
  label: string;
  onClick: () => void;
}

export function SettingsMenuButton({
  icon: Icon,
  label,
  onClick,
}: SettingsMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3.5 rounded-lg text-sm font-semibold text-white bg-white/8 border-1 border-white/15 w-full cursor-pointer transition-all duration-150 flex items-center gap-3 hover:bg-white/12 hover:border-white/25"
    >
      <Icon size={20} color="#93c5fd" className="flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <PiCaretRight
        size={18}
        color="rgba(255,255,255,0.5)"
        className="flex-shrink-0"
      />
    </button>
  );
}

export interface SettingsSectionHeaderProps {
  icon: IconType;
  title: string;
  description: string;
}

export function SettingsSectionHeader({
  icon: Icon,
  title,
  description,
}: SettingsSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-start gap-2">
        <Icon size={16} color="#fff" className="flex-shrink-0 mt-0.5" />
        <div className="text-white text-base font-black">{title}</div>
      </div>
      <div className="text-white/60 text-xs">{description}</div>
    </div>
  );
}
