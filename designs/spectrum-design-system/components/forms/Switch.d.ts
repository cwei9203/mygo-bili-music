export interface SwitchProps {
  children?: React.ReactNode;
  isSelected?: boolean;
  isDisabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}
export function Switch(props: SwitchProps): JSX.Element;
