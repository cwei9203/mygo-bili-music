const { useState } = React;

export function Tabs({ items = [], selectedKey, defaultSelectedKey, onSelectionChange, children }) {
  const [internalKey, setInternalKey] = useState(defaultSelectedKey || (items[0] && items[0].id));
  const key = selectedKey !== undefined ? selectedKey : internalKey;
  const active = items.find((item) => item.id === key);

  const select = (id) => {
    if (selectedKey === undefined) setInternalKey(id);
    if (onSelectionChange) onSelectionChange(id);
  };

  return (
    <div className="s2-tabs">
      <div className="s2-tablist" role="tablist">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === key}
            className="s2-tab"
            onClick={() => select(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="s2-tabpanel" role="tabpanel">
        {children || (active ? active.content : null)}
      </div>
    </div>
  );
}
