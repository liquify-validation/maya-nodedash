import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { CheckCircleFilled, CloseCircleFilled, InfoCircleOutlined } from "./icons";
import { cx } from "./util";

/** Locks page scroll while at least one modal is open. */
let openModals = 0;
function lockScroll() {
  if (openModals++ === 0) {
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.width = `calc(100% - ${scrollbar}px)`;
  }
}
function unlockScroll() {
  if (--openModals === 0) {
    document.body.style.overflow = "";
    document.body.style.width = "";
  }
}

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  /** Class on .ant-modal-wrap (antd's wrapClassName). */
  wrapClassName?: string;
  /** Class on .ant-modal (antd's className). */
  className?: string;
  width?: number;
  labelledBy?: string;
  children: ReactNode;
}

/** Mask + wrap + dialog frame with antd v4 markup, Escape/mask-click to close and focus handling. */
export function ModalShell({ open, onClose, wrapClassName, className, width = 520, labelledBy, children }: ModalShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    lockScroll();
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseRef.current();
    document.addEventListener("keydown", onKey);
    return () => {
      unlockScroll();
      document.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div>
      <div className="ant-modal-root">
        <div className="ant-modal-mask ant-fade-appear ant-fade-appear-active" />
        <div
          tabIndex={-1}
          className={cx("ant-modal-wrap", wrapClassName)}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            className={cx("ant-modal", className, "ant-zoom-appear ant-zoom-appear-active")}
            style={{ width, outline: "none" }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

interface ModalProps {
  open: boolean;
  title: ReactNode;
  onOk?: () => void;
  onCancel: () => void;
  okText?: string;
  cancelText?: string;
  /** Custom footer; defaults to Cancel + OK buttons like antd. */
  footer?: ReactNode;
  wrapClassName?: string;
  children: ReactNode;
}

export function Modal({ open, title, onOk, onCancel, okText = "OK", cancelText = "Cancel", footer, wrapClassName, children }: ModalProps) {
  const titleId = useId();
  return (
    <ModalShell open={open} onClose={onCancel} wrapClassName={wrapClassName} labelledBy={titleId}>
      <div className="ant-modal-content">
        <div className="ant-modal-header">
          <div className="ant-modal-title" id={titleId}>
            {title}
          </div>
        </div>
        <div className="ant-modal-body">{children}</div>
        <div className="ant-modal-footer">
          {footer ?? (
            <>
              <Button onClick={onCancel}>{cancelText}</Button>
              <Button type="primary" onClick={onOk}>
                {okText}
              </Button>
            </>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* ------------------------------------------------------------------ */
/* Imperative info dialog (antd Modal.info) and toast messages.        */
/* ------------------------------------------------------------------ */

interface InfoDialog {
  id: number;
  title: ReactNode;
  content: ReactNode;
  className?: string;
}

interface Toast {
  id: number;
  type: "success" | "error";
  text: string;
}

let nextId = 1;
let dialogs: InfoDialog[] = [];
let toasts: Toast[] = [];
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function showInfo(dialog: Omit<InfoDialog, "id">) {
  dialogs = [...dialogs, { ...dialog, id: nextId++ }];
  emit();
}

const TOAST_MS = 3000;
function showToast(type: Toast["type"], text: string) {
  const id = nextId++;
  toasts = [...toasts, { id, type, text }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, TOAST_MS);
}

export const message = {
  success: (text: string) => showToast("success", text),
  error: (text: string) => showToast("error", text),
};

function useOverlayState() {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => void listeners.delete(l);
  }, []);
  return { dialogs, toasts };
}

/** Renders queued info dialogs and toasts; mount once near the app root. */
export function OverlayHost() {
  const { dialogs: open, toasts: active } = useOverlayState();
  const close = (id: number) => {
    dialogs = dialogs.filter((d) => d.id !== id);
    emit();
  };

  return (
    <>
      {open.map((d) => (
        <ModalShell
          key={d.id}
          open
          onClose={() => close(d.id)}
          width={416}
          className={cx("ant-modal-confirm ant-modal-confirm-info", d.className)}
        >
          <div className="ant-modal-content">
            <div className="ant-modal-body">
              <div className="ant-modal-confirm-body-wrapper">
                <div className="ant-modal-confirm-body">
                  <InfoCircleOutlined />
                  <span className="ant-modal-confirm-title">{d.title}</span>
                  <div className="ant-modal-confirm-content">{d.content}</div>
                </div>
                <div className="ant-modal-confirm-btns">
                  <Button type="primary" autoFocus onClick={() => close(d.id)}>
                    OK
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ModalShell>
      ))}
      {active.length > 0 &&
        createPortal(
          <div className="ant-message">
            <div>
              {active.map((t) => (
                <div key={t.id} className="ant-message-notice ant-move-up-appear ant-move-up-appear-active">
                  <div className="ant-message-notice-content">
                    <div className={`ant-message-custom-content ant-message-${t.type}`}>
                      {t.type === "success" ? <CheckCircleFilled /> : <CloseCircleFilled />}
                      <span>{t.text}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
