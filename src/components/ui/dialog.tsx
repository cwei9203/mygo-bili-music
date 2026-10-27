import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps, ReactNode } from "react";
import { X } from "lucide-react";
export const Dialog = DialogPrimitive.Root;
export function DialogContent({
  title,
  description,
  children,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content> & {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm" />
      <DialogPrimitive.Content
        {...props}
        className="fixed left-1/2 top-1/2 z-50 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
      >
        <DialogPrimitive.Title className="text-xl font-semibold">
          {title}
        </DialogPrimitive.Title>
        <DialogPrimitive.Description className="my-3 text-sm text-slate-600">
          {description}
        </DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close
          aria-label="关闭"
          className="absolute right-3 top-3 grid size-11 place-items-center rounded-lg hover:bg-slate-100"
        >
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
