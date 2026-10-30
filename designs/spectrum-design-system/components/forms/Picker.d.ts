export interface PickerItem { id: string; label: string; }
export interface PickerProps {
  label?: string;
  items: PickerItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  placeholder?: string;
  isDisabled?: boolean;
  onSelectionChange?: (key: string) => void;
}
export function Picker(props: PickerProps): JSX.Element;
