export interface ToastItem { id: string; message: string; actionLabel?: string; onAction?: () => void; }
export interface ToastProps {
  toasts: ToastItem[];
  onDismiss?: (id: string) => void;
}
export function Toast(props: ToastProps): JSX.Element | null;
