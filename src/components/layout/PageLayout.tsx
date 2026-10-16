import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { icons, themed } from "../../assets";
import { useTheme, useThemed } from "../../hooks/theme";
import { Popover } from "../ui/Popover";
import { cx } from "../ui/util";

export type NodeFilter = "active" | "standby" | "others";

const headerStyle: CSSProperties = {
  color: "white",
  fontSize: 25,
  fontWeight: 700,
  height: 110,
  display: "flex",
  alignItems: "center",
};

interface PageLayoutProps {
  /** Header filter toggles; omitted on the report page. */
  filters?: { active: Record<NodeFilter, boolean>; onToggle: (f: NodeFilter) => void };
  /** The report page stretches to the viewport width instead of the 1920px dashboard. */
  fullWidth?: boolean;
  children: ReactNode;
}

const FILTERS: { key: NodeFilter; icon: string; label: string }[] = [
  { key: "active", icon: icons.activeIcon, label: "Active nodes" },
  { key: "standby", icon: icons.powerIcon, label: "Standby nodes" },
  { key: "others", icon: icons.threeDotsIcon, label: "Other nodes" },
];

export function PageLayout({ filters, fullWidth, children }: PageLayoutProps) {
  return (
    <section className="ant-layout" style={fullWidth ? { width: "100vw" } : undefined}>
      <header className="ant-layout-header" style={headerStyle}>
        <div className="header-left">
          <Link to="/" style={{ color: "white", textDecoration: "none" }}>
            <img alt="Maya" src={icons.mayaLogo} style={{ width: 180, margin: "auto 10px auto 0", verticalAlign: "middle" }} />
            <span style={{ color: "white", verticalAlign: "middle", marginTop: "25px" }}>Monitor</span>
          </Link>
        </div>
        <div className="header-right">
          {filters && (
            <>
              {FILTERS.map((f) => (
                <Popover key={f.key} content={f.label} title="Filter by">
                  <button
                    type="button"
                    aria-label={`Filter by ${f.label.toLowerCase()}`}
                    aria-pressed={filters.active[f.key]}
                    className={cx("active-node", filters.active[f.key] && "active-node--active")}
                    style={{ border: "none", background: "transparent", padding: 0 }}
                    onClick={() => filters.onToggle(f.key)}
                  >
                    <img alt="" src={f.icon} />
                  </button>
                </Popover>
              ))}
              <div className="active-node">
                <ThemeToggle />
              </div>
            </>
          )}
        </div>
      </header>
      <main className="ant-layout-content">{children}</main>
      <Footer />
    </section>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer" }}
      onClick={toggleTheme}
    >
      <img src={theme === "light" ? icons.darkModeIcon : icons.lightModeIcon} alt="" />
    </button>
  );
}

function Footer() {
  const pick = useThemed();
  return (
    <footer className="ant-layout-footer">
      <a href="https://github.com/liquify-validation" target="_blank" rel="noopener noreferrer" className="link" aria-label="Liquify on GitHub">
        <img alt="" src={icons.githubIcon} className="overview-item__icon" />
      </a>
      <a href="https://twitter.com/Liquify_ltd" target="_blank" rel="noopener noreferrer" className="link" aria-label="Liquify on X">
        <img alt="" src={icons.twitterIcon} className="overview-item__icon" />
      </a>
      <div className="logo-wrapper">
        <span>Built by:</span>
        <a href="https://liquify.io" target="_blank" rel="noopener noreferrer">
          <img alt="Liquify" src={pick(...themed.liquify)} className="overview-item__icon" />
        </a>
      </div>
    </footer>
  );
}

export function Loading() {
  return (
    <div className="loading" role="status" aria-label="Loading">
      <img src={icons.loadingIcon} className="loading_icon" alt="" />
    </div>
  );
}
