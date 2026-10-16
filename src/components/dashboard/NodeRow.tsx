import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { icons, ispLogos, themed } from "../../assets";
import { BASE_UNITS, explorer, formatAmount } from "../../chain";
import { useTheme, useThemed } from "../../hooks/theme";
import { chainDelta } from "../../lib/nodes";
import { CHAINS, type BondProvider, type Chain, type ColumnKey, type Node } from "../../types";
import { HistoryPopover } from "../charts/HistoryChart";
import { DotChartOutlined, HistoryOutlined, ProjectOutlined } from "../ui/icons";
import { showInfo } from "../ui/Modal";
import { Popover } from "../ui/Popover";
import { cx } from "../ui/util";
import { DollarPopover } from "./DollarPopover";
import type { NodeTableProps } from "./NodeTable";

const cellStyle: CSSProperties = { minWidth: 60, fontSize: 14, padding: "10px 15px", textAlign: "center" };
const historyLinkStyle: CSSProperties = { display: "inline-flex", color: "#1890ff", cursor: "pointer" };

const short = (address: string) => address.slice(-4);
const whole = (base: number) => Math.round(base / BASE_UNITS);

async function copyWithConfirmation(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    // Clipboard blocked (e.g. insecure context); still show the value so it can be copied by hand.
  }
  showInfo({
    title: <h3>Success</h3>,
    className: "feedback-modal",
    content: (
      <div className="modal-content">
        <p>
          <strong>{`${label} `}</strong> {value}
        </p>
      </div>
    ),
  });
}

function IspLogo({ isp }: { isp: string }) {
  const pick = useThemed();
  const logo = ispLogos[isp];
  if (!logo) return <>-</>;
  return <img alt={isp} src={logo === "aws" ? pick(...themed.aws) : logo} style={{ width: 25, height: 25 }} />;
}

function BondProviders({ providers }: { providers: BondProvider[] }) {
  const total = providers.reduce((sum, p) => sum + parseInt(p.bond, 10), 0);
  return (
    <>
      {providers.map((p, i) => (
        <div key={i} style={{ width: 200, display: "flex", justifyContent: "space-between" }}>
          <span>{p.bond_address.slice(-4)}</span>
          <span>{((Number(p.bond) / total) * 100).toFixed(2)}%</span>
          <span>{formatAmount(whole(Number(p.bond)))}</span>
        </div>
      ))}
    </>
  );
}

function ChainCell({ node, chain, maxChainHeights, hidden }: { node: Node; chain: Chain; maxChainHeights: NodeTableProps["maxChainHeights"]; hidden: boolean }) {
  const delta = chainDelta(node, chain, maxChainHeights);
  const missing = !Number.isFinite(delta);
  return (
    <td className={cx(hidden && "hidden")} style={{ textAlign: "center", color: missing || delta < -5 ? "red" : undefined }}>
      {missing ? "-" : delta === 0 ? "OK" : String(delta)}
    </td>
  );
}

/** External links, IP copy and favourite toggle shown after the node address. */
function NodeLinks({ node, isFavourite, onToggleFavourite }: { node: Node; isFavourite: boolean; onToggleFavourite: () => void }) {
  const pick = useThemed();
  const svgProps = { focusable: false, preserveAspectRatio: "xMidYMid meet", style: { verticalAlign: "middle" }, fill: "none" } as const;
  const stroke = { stroke: "currentColor", strokeWidth: "1.2", strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <span style={{ height: 20, marginLeft: 5 }} className="icons-wrapper">
      <Popover content="Explore Node">
        <a href={explorer.address(node.node_address)} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }} aria-label="Explore node">
          <svg {...svgProps} width="14" height="14" viewBox="0 0 14 14">
            <path {...stroke} d="M8.21201 6.12094C7.93815 5.79037 7.59622 5.52244 7.20939 5.33531C6.82257 5.14818 6.3999 5.04623 5.97006 5.03638C5.54022 5.02653 5.11326 5.10902 4.71815 5.27823C4.32303 5.44745 3.969 5.69944 3.68006 6.01712L1.96996 7.89664C1.45171 8.48651 1.18641 9.25576 1.23118 10.0387C1.27595 10.8217 1.62723 11.5557 2.20934 12.0827C2.79146 12.6097 3.55784 12.8875 4.34342 12.8562C5.12901 12.825 5.87094 12.4872 6.40942 11.9157L7.38417 10.8444" />
            <path {...stroke} d="M5.39864 7.52442C5.63159 7.8849 5.93954 8.19119 6.3016 8.42251C6.66366 8.65384 7.07135 8.80479 7.49704 8.86513C7.92272 8.92546 8.35644 8.89377 8.76876 8.77221C9.18109 8.65064 9.56238 8.44204 9.88678 8.16056L11.8067 6.49526C12.3909 5.97045 12.7451 5.23775 12.793 4.45497C12.8409 3.67219 12.5787 2.90196 12.0628 2.31017C11.5469 1.71838 10.8186 1.35238 10.0348 1.291C9.25103 1.22962 8.47442 1.47778 7.87227 1.98201L6.77194 2.93082" />
          </svg>
        </a>
      </Popover>

      <Popover content={explorer.nodeLabel}>
        <a href={explorer.node(node.node_address)} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 5 }} aria-label={`Node on ${explorer.nodeLabel}`}>
          <svg {...svgProps} width="13" height="13" viewBox="0 0 13 13">
            <path {...stroke} d="M10.0209 5.95871L9.20835 6.77121L6.22919 3.79204L7.04169 2.97954C7.44794 2.57327 8.93752 1.8962 10.0209 2.97954C11.1042 4.06288 10.4271 5.55243 10.0209 5.95871Z" />
            <path {...stroke} d="M11.375 1.625L10.0208 2.97917" />
            <path {...stroke} d="M2.97917 7.04199L3.79167 6.22949L6.77083 9.20866L5.95833 10.0212C5.55208 10.4274 4.0625 11.1045 2.97917 10.0212C1.89583 8.93783 2.57292 7.44827 2.97917 7.04199Z" />
            <path {...stroke} d="M6.22919 8.66634L7.31252 7.58301" />
            <path {...stroke} d="M1.625 11.3747L2.97917 10.0205" />
            <path {...stroke} d="M4.33331 6.77083L5.41665 5.6875" />
          </svg>
        </a>
      </Popover>

      <Popover content={node.ip_address} title="IP Address">
        <span
          role="button"
          tabIndex={0}
          aria-label="Copy IP address"
          style={{ cursor: "pointer", marginLeft: 5 }}
          onClick={() => copyWithConfirmation("IP Copied to clipboard:", node.ip_address)}
          onKeyDown={(e) => e.key === "Enter" && copyWithConfirmation("IP Copied to clipboard:", node.ip_address)}
        >
          <svg {...svgProps} width="13" height="13" viewBox="0 0 13 13">
            <path
              fill="currentColor"
              d="M10.2916 1.08301H5.95831C5.81465 1.08301 5.67688 1.14008 5.5753 1.24166C5.47371 1.34324 5.41665 1.48102 5.41665 1.62467C5.41665 1.76833 5.47371 1.90611 5.5753 2.00769C5.67688 2.10927 5.81465 2.16634 5.95831 2.16634H10.2916C10.4353 2.16634 10.5731 2.22341 10.6747 2.32499C10.7762 2.42657 10.8333 2.56435 10.8333 2.70801V6.49967H1.62498C1.48132 6.49967 1.34355 6.55674 1.24196 6.65833C1.14038 6.75991 1.08331 6.89768 1.08331 7.04134V8.12467C1.08331 8.55565 1.25452 8.96898 1.55926 9.27372C1.86401 9.57847 2.27734 9.74967 2.70831 9.74967H4.33331V10.833H2.70831C2.56465 10.833 2.42688 10.8901 2.3253 10.9917C2.22371 11.0932 2.16665 11.231 2.16665 11.3747C2.16665 11.5183 2.22371 11.6561 2.3253 11.7577C2.42688 11.8593 2.56465 11.9163 2.70831 11.9163H10.2916C10.4353 11.9163 10.5731 11.8593 10.6747 11.7577C10.7762 11.6561 10.8333 11.5183 10.8333 11.3747C10.8333 11.231 10.7762 11.0932 10.6747 10.9917C10.5731 10.8901 10.4353 10.833 10.2916 10.833H8.66665V9.74967H10.2916C10.7226 9.74967 11.1359 9.57847 11.4407 9.27372C11.7454 8.96898 11.9166 8.55565 11.9166 8.12467V2.70801C11.9166 2.27703 11.7454 1.86371 11.4407 1.55896C11.1359 1.25421 10.7226 1.08301 10.2916 1.08301ZM7.58331 10.833H5.41665V9.74967H7.58331V10.833ZM10.8333 8.12467C10.8333 8.26833 10.7762 8.40611 10.6747 8.50769C10.5731 8.60927 10.4353 8.66634 10.2916 8.66634H2.70831C2.56465 8.66634 2.42688 8.60927 2.3253 8.50769C2.22371 8.40611 2.16665 8.26833 2.16665 8.12467V7.58301H10.8333V8.12467Z"
            />{" "}
            <path stroke="currentColor" d="M3.9044 3.30042L2.78573 4.75234L1.66706 3.30042C1.36512 2.90853 1.36759 2.45798 1.57491 2.09161C1.78501 1.72031 2.21379 1.42871 2.78573 1.42871C3.35767 1.42871 3.78646 1.72031 3.99656 2.09161C4.20388 2.45798 4.20634 2.90853 3.9044 3.30042Z" />
            <path stroke="currentColor" strokeLinecap="round" d="M1.85712 5.57129H3.71426" />
          </svg>
        </span>
      </Popover>

      <img
        alt={isFavourite ? "Remove from favourites" : "Add to favourites"}
        role="button"
        tabIndex={0}
        onClick={onToggleFavourite}
        onKeyDown={(e) => e.key === "Enter" && onToggleFavourite()}
        src={isFavourite ? icons.heartFull : pick(...themed.heartBlank)}
        style={{ cursor: "pointer", marginLeft: 5, marginTop: 2, width: 15, height: 15 }}
      />
    </span>
  );
}

interface NodeRowProps extends NodeTableProps {
  node: Node;
  index: number;
}

export function NodeRow({ node, index, showChains, centerIndex, visibleColumns, maxChainHeights, runePrice, favourites, onToggleFavourite }: NodeRowProps) {
  const { theme } = useTheme();
  const pick = useThemed();
  const tail = short(node.node_address);
  const cell = (key: ColumnKey, content: ReactNode, style: CSSProperties = cellStyle) => (
    <td className={cx(!visibleColumns[key] && "hidden")} style={style}>
      {content}
    </td>
  );
  const linkColor = { color: theme === "light" ? "rgba(0,0,0,0.85)" : "white" };

  return (
    <tr style={{ height: 45 }}>
      <td style={{ backgroundColor: "rgba(24, 34, 51, 0.4)", minWidth: 35, width: 50, ...(centerIndex ? { paddingLeft: 3, textAlign: "center" } : { paddingLeft: 5 }) }}>
        {index}
      </td>
      {cell(
        "nodes",
        <>
          <Popover content={node.node_address} title={explorer.addressTitle}>
            <span
              role="button"
              tabIndex={0}
              style={{ cursor: "pointer" }}
              className="nodeaddress"
              onClick={() => copyWithConfirmation("Node address copied to clipboard:", node.node_address)}
              onKeyDown={(e) => e.key === "Enter" && copyWithConfirmation("Node address copied to clipboard:", node.node_address)}
            >
              {`...${tail}`}
            </span>
          </Popover>
          <HistoryPopover kind="position" node={node.node_address} title={`Performance Over Time for ${tail}`}>
            <span className="icon-wrapper" role="button" tabIndex={0} aria-label="Performance over time">
              <DotChartOutlined style={{ stroke: "currentColor" }} />
            </span>
          </HistoryPopover>
          <Popover content="Generate Report">
            <Link to={`/report/${encodeURIComponent(node.node_address)}`} aria-label="Generate report">
              <span className="icon-wrapper">
                <ProjectOutlined style={{ stroke: "currentColor" }} />
              </span>
            </Link>
          </Popover>
          <NodeLinks node={node} isFavourite={favourites.includes(node.node_address)} onToggleFavourite={() => onToggleFavourite(node.node_address)} />
        </>,
        { ...cellStyle, minWidth: 250, maxWidth: 300 }
      )}
      {cell("age", node.age.toFixed(2))}
      {cell("action", node.action, { ...cellStyle, fontSize: 12 })}
      {cell(
        "isp",
        <Popover content={node.isp} title="Provider">
          <span style={{ cursor: "pointer" }}>
            <IspLogo isp={node.isp} />
          </span>
        </Popover>
      )}
      {cell("location", node.location, { ...cellStyle, fontSize: 12 })}
      {cell(
        "bond",
        <DollarPopover title={`Bond Value in Dollars for ${tail}`} usd={whole(node.bond) * runePrice}>
          <HistoryPopover kind="bond" node={node.node_address} title={`Bond Value Over Time for ${tail}`}>
            <span style={historyLinkStyle} role="button" tabIndex={0}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              {whole(node.bond).toLocaleString()}
            </span>
          </HistoryPopover>
        </DollarPopover>,
        // The original bond cell never got the shared cell padding; keep its width.
        { textAlign: "center" }
      )}
      {cell(
        "providers",
        <Popover content={<BondProviders providers={node.providers} />} title="Bond Providers">
          <span style={{ cursor: "pointer" }}>{node.providers.length}</span>
        </Popover>
      )}
      {cell(
        "rewards",
        <DollarPopover title={`Rewards in Dollars for ${tail}`} usd={whole(node.current_award) * runePrice}>
          <HistoryPopover kind="rewards" node={node.node_address} title={`Rewards Over Time for ${tail}`}>
            <span style={historyLinkStyle} role="button" tabIndex={0}>
              <HistoryOutlined style={{ marginRight: 4 }} />
              {whole(node.current_award).toLocaleString()}
            </span>
          </HistoryPopover>
        </DollarPopover>
      )}
      {cell("apy", node.apy === null ? "-" : `${node.apy.toFixed(2)}%`)}
      {cell(
        "slashes",
        <HistoryPopover kind="slashes" node={node.node_address} title={`Slashes Over Time for ${tail}`}>
          <span style={historyLinkStyle} role="button" tabIndex={0}>
            <HistoryOutlined style={{ marginRight: 4 }} />
            {node.slash_points.toLocaleString()}
          </span>
        </HistoryPopover>
      )}
      {cell("score", node.score === null ? "-" : node.score.toFixed(1))}
      {cell("version", node.version)}
      {cell("leave", node.leaving ? "yes" : "-")}
      {cell(
        "jailed",
        node.is_jailed ? (
          <Popover
            title="Jailed Information"
            content={
              <div>
                <p>Release Height: {node.jail?.release_height}</p>
                <p>Reason: {node.jail?.reason}</p>
              </div>
            }
          >
            <span style={{ cursor: "pointer" }}>
              <img src={pick(...themed.jail)} style={{ width: 20, height: 20, display: "block", marginLeft: "15px" }} alt="Jailed" />
            </span>
          </Popover>
        ) : (
          "-"
        )
      )}
      {cell(
        "rpc",
        <a style={linkColor} href={`http://${node.ip_address}:27147/health?`} target="_blank" rel="noopener noreferrer">
          {node.rpcOk ? "*" : "Bad"}
        </a>
      )}
      {cell(
        "bfr",
        <a style={linkColor} href={`http://${node.ip_address}:6040/p2pid`} target="_blank" rel="noopener noreferrer">
          {node.bifrostOk ? "*" : "Bad"}
        </a>
      )}
      {showChains && CHAINS.map((chain) => <ChainCell key={chain} node={node} chain={chain} maxChainHeights={maxChainHeights} hidden={!visibleColumns[chain]} />)}
    </tr>
  );
}
