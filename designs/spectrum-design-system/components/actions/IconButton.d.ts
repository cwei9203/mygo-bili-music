export interface IconButtonProps {
  /** Icon 组件中的图标名 */
  icon: string;
  /** 无障碍标签，同时作为 tooltip */
  label: string;
  variant?: 'quiet' | 'secondary';
  size?: 'S' | 'M';
  isDisabled?: boolean;
  onPress?: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}
export function IconButton(props: IconButtonProps): JSX.Element;
