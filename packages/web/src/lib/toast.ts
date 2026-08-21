import { writable } from 'svelte/store';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'error' | 'success';
}

function createToastStore() {
  const { subscribe, update } = writable<ToastMessage[]>([]);

  function add(message: string, type: ToastMessage['type'] = 'info') {
    const id = Math.random().toString(36).slice(2);
    update((messages) => [...messages, { id, message, type }]);
    setTimeout(() => remove(id), 5000);
  }

  function remove(id: string) {
    update((messages) => messages.filter((m) => m.id !== id));
  }

  return { subscribe, add, remove };
}

export const toast = createToastStore();
