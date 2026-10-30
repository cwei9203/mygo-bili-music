export interface SearchFieldProps {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  isDisabled?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onClear?: () => void;
}
export function SearchField(props: SearchFieldProps): JSX.Element;
