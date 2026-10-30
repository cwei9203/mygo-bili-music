模态对话框。半透明遮罩 + 居中浮层卡片，Esc 或点击遮罩关闭。

```jsx
<Dialog isOpen={open} onClose={close} title="删除列表？" footer={<><Button variant="secondary">取消</Button><Button variant="negative">删除</Button></>}>
  列表里的 8 首歌不会被删除，只是不再出现在这里。
</Dialog>
```

默认宽度 440px，圆角 10px，内边距 24px；底部操作右对齐。
