/**
 * @startingPoint section="Components" subtitle="带标签、说明与错误态的文本输入" viewport="700x260"
 */
export interface TextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  type?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}
export function TextField(props: TextFieldProps): JSX.Element;
