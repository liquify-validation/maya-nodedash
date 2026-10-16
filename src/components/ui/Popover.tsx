import {
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from "react";
import { createPortal } from "react-dom";
import { autoUpdate, computePosition, flip, offset, shift } from "@floating-ui/dom";
import { composeRefs, cx } from "./util";

type Handler = (e: MouseEvent<HTMLElement>) => void;

/** Handlers/ref an outer Popover passes down when popovers are nested on one element. */
export interface TriggerProps {
  onMouseEnter?: Handler;
  onMouseLeave?: Handler;
  onClick?: Handler;
  ref?: Ref<HTMLElement>;
}

export interface PopoverProps extends TriggerProps {
  title?: ReactNode;
  content: ReactNode;
  trigger?: "hover" | "click";
  overlayClassName?: string;
  onOpenChange?: (open: boolean) => void;
  /** A single element; it receives the trigger handlers directly (no wrapper is added). */
  children: ReactElement<TriggerProps>;
}

const HOVER_DELAY_MS = 100;

/**
 * antd v4-style popover: same markup and class names so the vendored antd CSS and the
 * dashboard overrides style it identically. Popovers can be nested on the same element.
 */
export function Popover({
  title,
  content,
  trigger = "hover",
  overlayClassName,
  onOpenChange,
  children,
  ref,
  ...outerHandlers
}: PopoverProps) {
  const [open, setOpenState] = useState(false);
  const openRef = useRef(open);
  const targetRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  const setOpen = useCallback((next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpenState(next);
    onOpenChangeRef.current?.(next);
  }, []);

  const delayedSet = useCallback(
    (next: boolean) => {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => setOpen(next), HOVER_DELAY_MS);
    },
    [setOpen]
  );

  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Report closing if we unmount while open (e.g. a row disappears after a refresh).
  useEffect(
    () => () => {
      if (openRef.current) onOpenChangeRef.current?.(false);
    },
    []
  );

  // Click popovers close on an outside mousedown or Escape.
  useEffect(() => {
    if (!open || trigger !== "click") return;
    const onDown = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      if (!targetRef.current?.contains(t) && !popupRef.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, trigger, setOpen]);

  const child = children;
  const own: TriggerProps =
    trigger === "hover"
      ? { onMouseEnter: () => delayedSet(true), onMouseLeave: () => delayedSet(false) }
      : { onClick: () => setOpen(!openRef.current) };

  const merge = (name: keyof Omit<TriggerProps, "ref">): Handler | undefined => {
    const fns = [child.props[name], outerHandlers[name], own[name]].filter(Boolean) as Handler[];
    return fns.length ? (e) => fns.forEach((fn) => fn(e)) : undefined;
  };

  const trigger$ = cloneElement(child, {
    onMouseEnter: merge("onMouseEnter"),
    onMouseLeave: merge("onMouseLeave"),
    onClick: merge("onClick"),
    ref: composeRefs(child.props.ref, ref, targetRef),
  });

  return (
    <>
      {trigger$}
      {open &&
        createPortal(
          <PopoverOverlay
            targetRef={targetRef}
            popupRef={popupRef}
            title={title}
            className={overlayClassName}
            hoverHandlers={trigger === "hover" ? { onMouseEnter: () => delayedSet(true), onMouseLeave: () => delayedSet(false) } : {}}
          >
            {content}
          </PopoverOverlay>,
          document.body
        )}
    </>
  );
}

interface OverlayProps {
  targetRef: React.RefObject<HTMLElement | null>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  title?: ReactNode;
  className?: string;
  hoverHandlers: { onMouseEnter?: () => void; onMouseLeave?: () => void };
  children: ReactNode;
}

function PopoverOverlay({ targetRef, popupRef, title, className, hoverHandlers, children }: OverlayProps) {
  const [pos, setPos] = useState<{ x: number; y: number; placement: string } | null>(null);
  const [animating, setAnimating] = useState(true);

  useLayoutEffect(() => {
    const target = targetRef.current;
    const popup = popupRef.current;
    if (!target || !popup) return;
    return autoUpdate(target, popup, () => {
      computePosition(target, popup, {
        placement: "top",
        strategy: "absolute",
        middleware: [offset(4), flip({ fallbackPlacements: ["bottom"] }), shift()],
      }).then(({ x, y, placement }) => setPos({ x: Math.round(x), y: Math.round(y), placement }));
    });
  }, [targetRef, popupRef]);

  const placement = pos?.placement ?? "top";
  return (
    <div>
      <div
        ref={popupRef}
        className={cx(
          "ant-popover",
          className,
          `ant-popover-placement-${placement}`,
          animating && pos && "ant-zoom-big-appear ant-zoom-big-appear-active"
        )}
        style={{
          left: pos?.x ?? 0,
          top: pos?.y ?? 0,
          visibility: pos ? undefined : "hidden",
          transformOrigin: placement === "top" ? "50% 100%" : "50% 0",
        }}
        onAnimationEnd={() => setAnimating(false)}
        {...hoverHandlers}
      >
        <div className="ant-popover-content">
          <div className="ant-popover-arrow">
            <span className="ant-popover-arrow-content" />
          </div>
          <div className="ant-popover-inner" role="tooltip">
            {title !== undefined && title !== null && title !== "" && <div className="ant-popover-title">{title}</div>}
            <div className="ant-popover-inner-content">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
