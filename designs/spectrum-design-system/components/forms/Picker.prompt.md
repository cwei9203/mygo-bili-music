下拉选择器。触发器与输入框同高（32px），弹出层为浮层卡片。

```jsx
<Picker label="播放模式" items={modes} selectedKey={mode} onSelectionChange={setMode} />
```

弹出层圆角 10px、带浮起阴影；当前项显示对勾。
