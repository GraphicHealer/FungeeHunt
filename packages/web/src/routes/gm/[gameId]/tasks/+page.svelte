<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let tasks: any[] = [];
  let error = '';
  let showModal = false;
  let editId = '';
  let title = '';
  let description = '';
  let points = 0;
  let proofType = 'PHOTO';
  let order = 0;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/tasks`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) tasks = await res.json();
  }

  function resetForm() {
    editId = '';
    title = '';
    description = '';
    points = 0;
    proofType = 'PHOTO';
    order = tasks.length + 1;
    error = '';
  }

  function openNew() {
    resetForm();
    showModal = true;
  }

  function openEdit(task: any) {
    editId = task.id;
    title = task.title;
    description = task.description ?? '';
    points = task.points;
    proofType = task.proofType;
    order = task.order;
    error = '';
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  async function save() {
    error = '';
    const url = editId
      ? `/api/gm/games/${gameId}/tasks/${editId}`
      : `/api/gm/games/${gameId}/tasks`;
    const method = editId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ title, description, points, proofType, order }),
    });
    if (res.ok) {
      showModal = false;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not save task';
    }
  }

  async function remove(taskId: string) {
    if (!confirm('Delete this task?')) return;
    const res = await fetch(`/api/gm/games/${gameId}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) await load();
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Tasks</h2>
    <button on:click={openNew}>+ ADD TASK</button>
  </header>

  <ul class="task-list">
    {#each tasks as task (task.id)}
      <li on:click={() => openEdit(task)}>
        <div class="task-main">
          <span class="order">{task.order}</span>
          <span class="title">{task.title}</span>
          <span class="meta">+{task.points} · {task.proofType}</span>
        </div>
        <button class="danger" on:click|stopPropagation={() => remove(task.id)}>DELETE</button>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <h3>{editId ? 'Edit Task' : 'Add Task'}</h3>

      <label for="title">Title</label>
      <input id="title" type="text" bind:value={title} placeholder="Title" />

      <label for="description">Description</label>
      <textarea id="description" bind:value={description} placeholder="Description" />

      <label for="points">Points</label>
      <input id="points" type="number" bind:value={points} />

      <label for="proofType">Proof Type</label>
      <select id="proofType" bind:value={proofType}>
        <option value="PHOTO">Photo</option>
        <option value="VIDEO">Video</option>
        <option value="EITHER">Photo or Video</option>
      </select>

      <label for="order">Order</label>
      <input id="order" type="number" bind:value={order} />

      {#if error}<p class="error">{error}</p>{/if}

      <div class="actions">
        <button on:click={close}>Cancel</button>
        <button on:click={save} disabled={!title}>Save</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .page {
    font-family: system-ui, sans-serif;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .page-header h2 {
    margin: 0;
  }

  .task-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .task-list li {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }

  .task-list li:hover {
    box-shadow: var(--shadow);
  }

  .task-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .order {
    font-weight: bold;
    color: var(--muted);
    min-width: 1.5rem;
  }

  .title {
    font-weight: bold;
  }

  .meta {
    color: var(--muted);
  }

  .danger {
    background: var(--danger);
    color: #fff;
    border: none;
    border-radius: 0.25rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--card);
    border-radius: 0.75rem;
    padding: 2rem;
    width: 90%;
    max-width: 28rem;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
  }

  .modal h3 {
    margin-top: 0;
  }

  .modal input,
  .modal select,
  .modal textarea {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 0.75rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .actions button {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
    border: none;
    border-radius: 0.25rem;
    background: var(--brand);
    color: #fff;
  }

  .actions button:first-child {
    background: var(--bg);
    color: var(--text);
  }

  .actions button:disabled {
    background: var(--border);
    cursor: not-allowed;
  }

  .error {
    color: var(--danger);
  }
</style>
