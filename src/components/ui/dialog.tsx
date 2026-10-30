import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
export const Dialog = DialogPrimitive.Root;

/**
 * A preferences window: title band, a section list on the left, one scrolling
 * pane on the right. The close button sits in the band, not over the content.
 */
export function DialogWindow({
  title,
  description,
  nav,
  children,
}: {
  title: string;
  description: string;
  nav: ReactNode;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content className="prefs">
        <div className="prefs-head">
          <DialogPrimitive.Title className="prefs-title">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            {description}
          </DialogPrimitive.Description>
          <DialogPrimitive.Close aria-label="关闭" className="dialog-close">
            <X size={17} />
          </DialogPrimitive.Close>
        </div>
        <div className="prefs-body">
          <nav className="prefs-nav" aria-label={title}>
            {nav}
          </nav>
          <div className="prefs-content">{children}</div>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export function DialogContent({
  title,
  description,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        {...props}
        className="dialog-panel"
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className="dialog-description">
            {description}
          </DialogPrimitive.Description>
        )}
        <div className="dialog-body">{children}</div>
        <DialogPrimitive.Close aria-label="关闭" className="dialog-close">
          <X size={17} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
