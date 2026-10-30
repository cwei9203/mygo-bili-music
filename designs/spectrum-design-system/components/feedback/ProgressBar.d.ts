export interface ProgressBarProps {
  label?: string;
  ariaLabel?: string;
  value?: number;
  isIndeterminate?: boolean;
  showValue?: boolean;
}
export function ProgressBar(props: ProgressBarProps): JSX.Element;
