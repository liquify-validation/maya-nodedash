import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { RightOutlined } from "./icons";

/* Small antd v4 look-alikes: affix input, breadcrumb and card. */

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  prefix: ReactNode;
  style?: CSSProperties;
  ariaLabel?: string;
}

export function AffixInput({ value, onChange, prefix, style, ariaLabel }: SearchInputProps) {
  return (
    <span className="ant-input-affix-wrapper" style={style}>
      <span className="ant-input-prefix">{prefix}</span>
      <input className="ant-input" type="text" aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} />
    </span>
  );
}

export interface Crumb {
  label: string;
  to?: string;
  current?: boolean;
}

/**
 * Breadcrumb with antd v4 markup. A plain ">" separator is used when there is a single
 * crumb (the overview), otherwise the right-arrow icon, matching the original pages.
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  const separator = items.length === 1 ? ">" : <RightOutlined />;
  return (
    <nav className="ant-breadcrumb" aria-label="Breadcrumb">
      <ol>
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? (
              <Link className="ant-breadcrumb-link" to={item.to}>
                {item.label}
              </Link>
            ) : (
              <span className={item.current ? "current" : "ant-breadcrumb-link"} aria-current={item.current ? "page" : undefined}>
                {item.label}
              </span>
            )}
            <span className="ant-breadcrumb-separator">{separator}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Card({ title, style, children }: { title: ReactNode; style?: CSSProperties; children: ReactNode }) {
  return (
    <div className="ant-card" style={style}>
      <div className="ant-card-head">
        <div className="ant-card-head-wrapper">
          <div className="ant-card-head-title">{title}</div>
        </div>
      </div>
      <div className="ant-card-body">{children}</div>
    </div>
  );
}
