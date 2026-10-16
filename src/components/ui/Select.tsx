import { useEffect, useId, useState, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { DownOutlined, LoadingOutlined } from "./icons";
import { useDropdown } from "./useDropdown";
import { cx } from "./util";

export interface SelectOption<V> {
  value: V;
  label: string;
}

interface SelectProps<V> {
  value: V | undefined;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  placeholder?: string;
  loading?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

/** Single-select with antd v4 markup (closed box + portal dropdown list). */
export function Select<V extends string | number>({ value, options, onChange, placeholder, loading, id, className, style }: SelectProps<V>) {
  const { open, setOpen, triggerRef, menuRef, style: menuStyle, placement } = useDropdown<HTMLDivElement>();
  const listId = useId();
  const selectedIndex = options.findIndex((o) => o.value === value);
  const [active, setActive] = useState(Math.max(0, selectedIndex));
  const selected = options[selectedIndex];

  useEffect(() => {
    if (open) setActive(Math.max(0, selectedIndex));
  }, [open, selectedIndex]);

  const choose = (opt: SelectOption<V>) => {
    onChange(opt.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open && options[active]) choose(options[active]);
      else setOpen(true);
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={cx("ant-select", className, "ant-select-single ant-select-show-arrow", open && "ant-select-open ant-select-focused", loading && "ant-select-loading")}
        style={style}
        onMouseDown={(e) => {
          e.preventDefault();
          setOpen(!open);
          (e.currentTarget.querySelector("input") as HTMLInputElement | null)?.focus();
        }}
      >
        <div className="ant-select-selector">
          <span className="ant-select-selection-search">
            <input
              id={id}
              type="search"
              readOnly
              autoComplete="off"
              className="ant-select-selection-search-input"
              role="combobox"
              aria-expanded={open}
              aria-haspopup="listbox"
              aria-controls={listId}
              value=""
              style={{ opacity: 0 }}
              onKeyDown={onKeyDown}
              onBlur={() => setOpen(false)}
            />
          </span>
          {selected ? (
            <span className="ant-select-selection-item" title={selected.label}>
              {selected.label}
            </span>
          ) : (
            <span className="ant-select-selection-placeholder">{placeholder}</span>
          )}
        </div>
        <span className="ant-select-arrow" aria-hidden="true" style={{ userSelect: "none" }}>
          {loading ? <LoadingOutlined spin /> : <DownOutlined className="ant-select-suffix" />}
        </span>
      </div>
      {open &&
        createPortal(
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%" }}>
            <div>
              <div
                ref={menuRef}
                className={`ant-select-dropdown ant-select-dropdown-placement-${placement} ant-slide-up-appear ant-slide-up-appear-active`}
                style={menuStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                <div>
                  <div className="rc-virtual-list" style={{ position: "relative" }}>
                    <div className="rc-virtual-list-holder" style={{ maxHeight: 256, overflowY: "auto", overflowAnchor: "none" }}>
                      <div>
                        <div className="rc-virtual-list-holder-inner" role="listbox" id={listId} style={{ display: "flex", flexDirection: "column" }}>
                          {options.length === 0 && (
                            <div className="ant-select-item-empty">
                              <div className="ant-empty ant-empty-normal ant-empty-small">
                                <div className="ant-empty-description">No data</div>
                              </div>
                            </div>
                          )}
                          {options.map((opt, i) => (
                            <div
                              key={opt.value}
                              role="option"
                              aria-selected={opt.value === value}
                              title={opt.label}
                              className={cx(
                                "ant-select-item ant-select-item-option",
                                i === active && "ant-select-item-option-active",
                                opt.value === value && "ant-select-item-option-selected"
                              )}
                              onMouseEnter={() => setActive(i)}
                              onClick={() => choose(opt)}
                            >
                              <div className="ant-select-item-option-content">{opt.label}</div>
                              <span className="ant-select-item-option-state" aria-hidden="true" style={{ userSelect: "none" }} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
