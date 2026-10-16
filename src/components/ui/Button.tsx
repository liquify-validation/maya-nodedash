import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router";
import { cx } from "./util";

type ButtonType = "default" | "primary" | "secondary";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  type?: ButtonType;
  children?: ReactNode;
}

/** antd v4 button markup. String children are wrapped in <span> like antd does. */
export function Button({ type = "default", className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={cx("ant-btn", `ant-btn-${type}`, className)} {...rest}>
      {wrapText(children)}
    </button>
  );
}

/** A router link styled as an antd button (antd renders href buttons as <a class="ant-btn">). */
export function ButtonLink({ to, type = "primary", className, children }: { to: string; type?: ButtonType; className?: string; children: ReactNode }) {
  return (
    // <button> doesn't inherit the page letter-spacing; match it so link buttons size identically.
    <Link to={to} className={cx("ant-btn", `ant-btn-${type}`, className)} style={{ letterSpacing: "normal" }}>
      {wrapText(children)}
    </Link>
  );
}

function wrapText(children: ReactNode) {
  return typeof children === "string" ? <span>{children}</span> : children;
}
