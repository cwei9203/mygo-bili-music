export interface DialogProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
}
export function Dialog(props: DialogProps): JSX.Element | null;
