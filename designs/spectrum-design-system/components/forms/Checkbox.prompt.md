复选框。16px 方框、4px 圆角，选中后填充品牌蓝并显示对勾。

```jsx
<Checkbox isSelected={on} onChange={e => setOn(e.target.checked)}>记住选择</Checkbox>
```

`isIndeterminate` 用于部分选中的父级（如多 P 稿件里选中了部分分 P）。
