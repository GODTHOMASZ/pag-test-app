import { makeAutoObservable, runInAction } from 'mobx';
import axios from 'axios';
import debounce from 'lodash.debounce';

const API_URL = import.meta.env.VITE_API_URL;

class ItemStore {
  items = [];
  selectedIds = new Set();
  sortedIds = [];
  search = '';
  offset = 0;
  loading = false;
  hasMore = true;

  constructor() {
    makeAutoObservable(this);
    this.debouncedLoadItems = debounce(() => this.loadItems(true), 400);
  }

  async loadItems(reset = false) {
    if (this.loading || (!reset && !this.hasMore)) return;

    this.loading = true;
    if (reset) {
      this.offset = 0;
      this.items = [];
      this.hasMore = true;
    }

    try {
      const { data } = await axios.get(`${API_URL}/items`, {
        params: {
          q: this.search,
          offset: this.offset,
          limit: 20,
        },
      });

      runInAction(() => {
        const newItems = reset ? data : [...this.items, ...data];

        const selectedItemsMap = new Map(newItems.map(item => [item.id, item]));

        const sortedSelected = this.sortedIds
          .map(id => selectedItemsMap.get(id))
          .filter(Boolean);

        const remaining = newItems.filter(item => !this.sortedIds.includes(item.id));

        this.items = [...sortedSelected, ...remaining];
        this.offset += 20;
        this.hasMore = data.length === 20;
      });
    } catch (error) {
      console.error('Ошибка при загрузке элементов:', error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  toggleSelect(id) {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
      this.sortedIds = this.sortedIds.filter((x) => x !== id);
    } else {
      this.selectedIds.add(id);
      this.sortedIds.push(id);
    }
  }

  async loadState() {
    try {
      const { data } = await axios.get(`${API_URL}/state`);
      runInAction(() => {
        this.selectedIds = new Set(data.selectedIds);
        this.sortedIds = data.sortedIds;
      });
    } catch (error) {
      console.error('Ошибка при загрузке состояния:', error);
    }
  }

  async saveState() {
    try {
      await axios.post(`${API_URL}/state`, {
        selectedIds: Array.from(this.selectedIds),
        sortedIds: this.sortedIds,
      });
    } catch (error) {
      console.error('Ошибка при сохранении состояния:', error);
    }
  }

  setSearch(q) {
    this.search = q;
    this.debouncedLoadItems();
  }

  reorder(fromIndex, toIndex) {
    const moved = this.items.splice(fromIndex, 1)[0];
    this.items.splice(toIndex, 0, moved);
    this.sortedIds = this.items.map(item => item.id);
  }
}

export const itemStore = new ItemStore();
