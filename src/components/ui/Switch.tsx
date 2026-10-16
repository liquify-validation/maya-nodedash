import { cx } from "./util";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  label?: string;
}

export function Switch({ checked, onChange, className, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={cx("ant-switch", checked && "ant-switch-checked", className)}
      onClick={() => onChange(!checked)}
    >
      <div className="ant-switch-handle" />
      <span className="ant-switch-inner" />
    </button>
  );
}
