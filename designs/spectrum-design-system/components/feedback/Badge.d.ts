export interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'positive' | 'notice' | 'negative';
  fillStyle?: 'bold' | 'subtle';
  icon?: React.ReactNode;
}
export function Badge(props: BadgeProps): JSX.Element;
