胶囊形搜索框，左侧放大镜、右侧清除按钮。

```jsx
<SearchField placeholder="搜索 B 站" value={query} onChange={e => setQuery(e.target.value)} />
```

有内容时才显示清除按钮；整体高度 32px、全圆角。
