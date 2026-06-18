export function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6.5 rounded-full relative transition-colors duration-150 shrink-0 disabled:opacity-40 ${checked ? "bg-orange-500" : "bg-gray-700"}`}
    >
      <span
        className={`absolute top-0.75 w-5 h-5 rounded-full bg-white transition-[left] duration-150 ${checked ? "left-5.25" : "left-0.75"}`}
      />
    </button>
  );
}
