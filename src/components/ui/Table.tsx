import { useState, type ReactNode } from "react";
import { DoubleLeftOutlined, DoubleRightOutlined, LeftOutlined, RightOutlined } from "./icons";
import { cx } from "./util";

export interface TableColumn<Row> {
  title: string;
  key: keyof Row & string;
}

interface TableProps<Row> {
  columns: TableColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  className?: string;
  pageSize?: number;
}

/** Read-only antd v4 table with right-aligned pagination (used by the report page). */
export function Table<Row>({ columns, rows, rowKey, className, pageSize = 10 }: TableProps<Row>) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className={cx("ant-table-wrapper", className)}>
      <div className="ant-spin-nested-loading">
        <div className="ant-spin-container">
          <div className="ant-table">
            <div className="ant-table-container">
              <div className="ant-table-content">
                <table style={{ tableLayout: "auto" }}>
                  <thead className="ant-table-thead">
                    <tr>
                      {columns.map((c) => (
                        <th key={c.key} className="ant-table-cell">
                          {c.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="ant-table-tbody">
                    {visible.map((row) => (
                      <tr key={rowKey(row)} className="ant-table-row ant-table-row-level-0">
                        {columns.map((c) => (
                          <td key={c.key} className="ant-table-cell">
                            {row[c.key] as ReactNode}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <Pagination current={current} pages={pages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

/** Page numbers to show, antd style: all when few, otherwise first/last with jump ellipses. */
export function pageItems(current: number, pages: number): (number | "prev-jump" | "next-jump")[] {
  if (pages <= 9) return Array.from({ length: pages }, (_, i) => i + 1);
  let start = Math.max(1, current - 2);
  let end = Math.min(pages, current + 2);
  if (current - 1 <= 2) end = 5;
  if (pages - current <= 2) start = pages - 4;
  const items: (number | "prev-jump" | "next-jump")[] = [];
  for (let i = start; i <= end; i++) items.push(i);
  if (start - 1 >= 2) items.unshift("prev-jump");
  if (pages - end >= 2) items.push("next-jump");
  if (items[0] !== 1) items.unshift(1);
  if (items[items.length - 1] !== pages) items.push(pages);
  return items;
}

function Pagination({ current, pages, onChange }: { current: number; pages: number; onChange: (p: number) => void }) {
  const go = (p: number) => onChange(Math.min(pages, Math.max(1, p)));
  return (
    <ul className="ant-pagination ant-table-pagination ant-table-pagination-right">
      <li title="Previous Page" className={cx("ant-pagination-prev", current === 1 && "ant-pagination-disabled")}>
        <button className="ant-pagination-item-link" type="button" disabled={current === 1} onClick={() => go(current - 1)} aria-label="Previous page">
          <LeftOutlined />
        </button>
      </li>
      {pageItems(current, pages).map((item) =>
        typeof item === "number" ? (
          <li
            key={item}
            title={String(item)}
            className={cx("ant-pagination-item", `ant-pagination-item-${item}`, item === current && "ant-pagination-item-active")}
            tabIndex={0}
            onClick={() => go(item)}
            onKeyDown={(e) => e.key === "Enter" && go(item)}
          >
            <a rel="nofollow">{item}</a>
          </li>
        ) : (
          <li
            key={item}
            title={item === "prev-jump" ? "Previous 5 Pages" : "Next 5 Pages"}
            className={`ant-pagination-jump-${item === "prev-jump" ? "prev" : "next"} ant-pagination-jump-${item === "prev-jump" ? "prev" : "next"}-custom-icon`}
            tabIndex={0}
            onClick={() => go(current + (item === "prev-jump" ? -5 : 5))}
          >
            <a className="ant-pagination-item-link">
              <div className="ant-pagination-item-container">
                {item === "prev-jump" ? <DoubleLeftOutlined className="ant-pagination-item-link-icon" /> : <DoubleRightOutlined className="ant-pagination-item-link-icon" />}
                <span className="ant-pagination-item-ellipsis">•••</span>
              </div>
            </a>
          </li>
        )
      )}
      <li title="Next Page" className={cx("ant-pagination-next", current === pages && "ant-pagination-disabled")}>
        <button className="ant-pagination-item-link" type="button" disabled={current === pages} onClick={() => go(current + 1)} aria-label="Next page">
          <RightOutlined />
        </button>
      </li>
    </ul>
  );
}
