import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { autoUpdate, computePosition, flip, offset } from "@floating-ui/dom";

/**
 * Shared open/close + positioning for menus that drop below a trigger (Select, Dropdown).
 * Closes on outside mousedown and Escape.
 */
export function useDropdown<T extends HTMLElement>() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<T>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; minWidth: number; placement: string } | null>(null);

  useLayoutEffect(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!open || !trigger || !menu) {
      setPos(null);
      return;
    }
    return autoUpdate(trigger, menu, () => {
      computePosition(trigger, menu, {
        placement: "bottom-start",
        strategy: "absolute",
        middleware: [offset(4), flip({ fallbackPlacements: ["top-start"] })],
      }).then(({ x, y, placement }) =>
        setPos({
          left: Math.round(x),
          top: Math.round(y),
          minWidth: trigger.getBoundingClientRect().width,
          placement: placement === "top-start" ? "topLeft" : "bottomLeft",
        })
      );
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const style = {
    left: pos?.left ?? 0,
    top: pos?.top ?? 0,
    minWidth: pos?.minWidth,
    visibility: pos ? undefined : ("hidden" as const),
  };
  return { open, setOpen, triggerRef, menuRef, style, placement: pos?.placement ?? "bottomLeft" };
}
