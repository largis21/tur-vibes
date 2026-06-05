import { forwardRef, type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "icon" | "fab";
  isActive?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", isActive = false, className = "", ...props },
    ref,
  ) => {
    const baseClasses =
      "transition-all duration-200 flex items-center justify-center";

    const variantClasses = {
      primary: `${isActive ? "bg-accent" : "bg-accent hover:bg-accent-light"} text-white px-3.5 py-3 rounded-lg font-bold text-sm gap-2 disabled:opacity-50 disabled:cursor-not-allowed`,
      icon: "w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed",
      fab: `w-14 h-14 rounded-full ${isActive ? "bg-accent" : "bg-accent hover:bg-accent-light"} text-white shadow-lg flex items-center justify-center`,
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export default Button;
