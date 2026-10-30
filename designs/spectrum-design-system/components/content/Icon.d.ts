export interface IconProps {
  /** S2 图标名，如 check / search / play / chevronDown */
  name: string;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element | null;
