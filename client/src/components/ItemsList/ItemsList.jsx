import { observer } from 'mobx-react-lite';
import { itemStore } from './store';
import { useEffect, useRef } from 'react';

export const ItemsList = observer(() => {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;

    itemStore.loadState().then(() => {
      itemStore.loadItems(true);
    });

    const onScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 50
      ) {
        itemStore.loadItems();
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleDrag = (e, index) => {
    e.dataTransfer.setData('from', index);
  };

  const handleDrop = (e, index) => {
    const from = parseInt(e.dataTransfer.getData('from'));
    itemStore.reorder(from, index);
    itemStore.saveState();
  };

  return (
    <>
      <input
        type="text"
        placeholder="Поиск..."
        onChange={(e) => itemStore.setSearch(e.target.value)}
      />
      <div
        ref={ref}
        style={{ height: '500px', overflow: 'auto', border: '1px solid gray' }}
      >
        {itemStore.items.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDrag(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragOver={(e) => e.preventDefault()}
            style={{
              padding: '10px',
              background: itemStore.selectedIds.has(item.id) ? '#cce5ff' : '#fff',
              borderBottom: '1px solid #ccc',
              cursor: 'move',
            }}
            onClick={() => {
              itemStore.toggleSelect(item.id);
              itemStore.saveState();
            }}
          >
            <input
              type="checkbox"
              checked={itemStore.selectedIds.has(item.id)}
              readOnly
            />
            {item.label}
          </div>
        ))}
        {itemStore.loading && <div>Загрузка...</div>}
      </div>
    </>
  );
});
