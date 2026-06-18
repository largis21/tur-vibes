import type { IconType } from "react-icons";

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon?: IconType;
  title: string;
  description?: string;
}) {
  const Icon = icon;

  return (
    <div className="mt-1">
      <div className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={14} className="block shrink-0" />}
        {title}
      </div>
      {description ? (
        <div className="text-gray-500 text-xs mt-0.5">{description}</div>
      ) : null}
    </div>
  );
}

export function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon?: IconType;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SectionHeader icon={icon} title={title} description={description} />
      {children}
    </div>
  );
}
