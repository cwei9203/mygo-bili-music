export interface TabItem { id: string; label: string; content?: React.ReactNode; }
export interface TabsProps {
  items: TabItem[];
  selectedKey?: string;
  defaultSelectedKey?: string;
  children?: React.ReactNode;
  onSelectionChange?: (key: string) => void;
}
export function Tabs(props: TabsProps): JSX.Element;
