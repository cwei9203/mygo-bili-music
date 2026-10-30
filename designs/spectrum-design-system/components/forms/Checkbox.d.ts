export interface CheckboxProps {
  children?: React.ReactNode;
  isSelected?: boolean;
  isIndeterminate?: boolean;
  isDisabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}
export function Checkbox(props: CheckboxProps): JSX.Element;
