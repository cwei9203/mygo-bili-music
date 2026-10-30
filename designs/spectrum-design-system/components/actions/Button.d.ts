/**
 * @startingPoint section="Components" subtitle="Spectrum 2 按钮：primary / secondary / accent / negative / outline，四种尺寸" viewport="700x360"
 */
export interface ButtonProps {
  /** 按钮文字 */
  children?: React.ReactNode;
  /** 视觉变体，默认 primary */
  variant?: 'primary' | 'secondary' | 'accent' | 'negative' | 'quiet';
  /** fill 实心；outline 描边 */
  fillStyle?: 'fill' | 'outline';
  /** 尺寸，默认 M */
  size?: 'S' | 'M' | 'L' | 'XL';
  /** 前置图标名（Icon 组件） */
  icon?: string;
  isDisabled?: boolean;
  onPress?: () => void;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}
export function Button(props: ButtonProps): JSX.Element;
