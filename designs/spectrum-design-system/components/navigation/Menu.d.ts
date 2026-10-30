export interface MenuItem { id: string; label: string; icon?: string; }
export interface MenuProps {
  label?: string;
  icon?: string;
  items: MenuItem[];
  variant?: 'primary' | 'secondary' | 'accent' | 'negative' | 'quiet';
  size?: 'S' | 'M' | 'L' | 'XL';
  onAction?: (key: string) => void;
}
export function Menu(props: MenuProps): JSX.Element;
