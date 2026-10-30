下拉菜单：一个按钮触发，弹出操作列表。

```jsx
<Menu label="更多" items={[{id: 'rename', label: '重命名'}, {id: 'delete', label: '删除'}]} onAction={run} />
```

点击外部或按 Esc 关闭；每项 32px 高，悬停为浅灰底。
