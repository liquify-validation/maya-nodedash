import type { ReactElement } from "react";
import { Popover, type TriggerProps } from "../ui/Popover";

/** Hover popover showing a CACAO figure converted to dollars. */
export function DollarPopover({ title, usd, children, ...triggerProps }: { title: string; usd: number; children: ReactElement<TriggerProps> } & TriggerProps) {
  return (
    <Popover
      title={title}
      overlayClassName="dollar-popover"
      content={
        <div>
          <p>${usd.toLocaleString()}</p>
        </div>
      }
      {...triggerProps}
    >
      {children}
    </Popover>
  );
}
