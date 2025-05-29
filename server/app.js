const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const ITEMS_COUNT = 1_000_000;
const ITEMS = Array.from({ length: ITEMS_COUNT }, (_, i) => ({
  id: i + 1,
  label: `Item ${i + 1}`,
}));

let userState = {
  selectedIds: new Set(),
  sortedIds: [],
};

app.get('/items', (req, res) => {
  const { q = '', offset = 0, limit = 20 } = req.query;
  let items = ITEMS;

  if (q) {
    items = items.filter(item => item.label.toLowerCase().includes(q.toLowerCase()));
  }

  const sortedSet = new Set(userState.sortedIds);
  const sorted = userState.sortedIds
    .map(id => items.find(i => i.id === id))
    .filter(Boolean);

  const unsorted = items.filter(i => !sortedSet.has(i.id));
  const final = [...sorted, ...unsorted];

  const paginated = final.slice(+offset, +offset + +limit);
  res.json(paginated);
});

app.post('/state', (req, res) => {
  const { selectedIds, sortedIds } = req.body;
  userState = {
    selectedIds: new Set(selectedIds),
    sortedIds,
  };
  res.sendStatus(200);
});

app.get('/state', (req, res) => {
  res.json({
    selectedIds: Array.from(userState.selectedIds),
    sortedIds: userState.sortedIds,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
