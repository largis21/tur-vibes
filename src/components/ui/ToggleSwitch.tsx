export interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
}: ToggleSwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-11 h-6.5 rounded-full relative transition-colors duration-150 flex-shrink-0 ${
        checked ? "bg-accent" : "bg-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.75 w-5 h-5 rounded-full bg-white transition-all duration-150 ${
          checked ? "right-0.75" : "left-0.75"
        }`}
      />
    </button>
  );
}
