<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { formatPoints } from '$lib/format';

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

  let showAddMenu = false;
  let showSelectModal = false;
  let defaultTasks: any[] = [];
  let selectedDefaults: any[] = [];
  let expandedDefault: string | null = null;

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

  async function loadDefaults() {
    const res = await fetch('/api/gm/settings', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const s = await res.json();
      defaultTasks = s.defaultTasks ?? [];
    }
  }

  function toggleAddMenu() {
    showAddMenu = !showAddMenu;
  }

  function openCustom() {
    showAddMenu = false;
    resetForm();
    showModal = true;
  }

  async function openSelect() {
    showAddMenu = false;
    selectedDefaults = [];
    expandedDefault = null;
    await loadDefaults();
    showSelectModal = true;
  }

  function closeSelect() {
    showSelectModal = false;
    selectedDefaults = [];
    expandedDefault = null;
  }

  function isSelected(task: any) {
    return selectedDefaults.some((t) => t.title.toLowerCase() === task.title.toLowerCase());
  }

  function toggleDefault(task: any) {
    if (isSelected(task)) {
      selectedDefaults = selectedDefaults.filter((t) => t.title.toLowerCase() !== task.title.toLowerCase());
    } else {
      selectedDefaults = [...selectedDefaults, task];
    }
  }

  function toggleDefaultExpand(task: any) {
    expandedDefault = expandedDefault === task.title ? null : task.title;
  }

  async function addSelected() {
    if (selectedDefaults.length === 0) return;
    const res = await fetch(`/api/gm/games/${gameId}/tasks/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ tasks: selectedDefaults }),
    });
    if (res.ok) {
      showSelectModal = false;
      selectedDefaults = [];
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not add tasks';
    }
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
    <div class="add-menu-wrap">
      <button class="fungee-btn" on:click={toggleAddMenu} style="width: auto; margin: 0;">+ ADD TASK</button>
      {#if showAddMenu}
        <div class="add-menu">
          <button type="button" on:click={openSelect}>Select task</button>
          <button type="button" on:click={openCustom}>Custom task</button>
        </div>
      {/if}
    </div>
  </header>

  <ul class="task-list">
    {#each tasks as task (task.id)}
      <li on:click={() => openEdit(task)}>
        <div class="task-main">
          <span class="order">{task.order}</span>
          <span class="title">{task.title}</span>
          <span class="meta">+{formatPoints(task.points)} · {task.proofType}</span>
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <form on:submit|preventDefault={save}>
        <h3>{editId ? 'Edit Task' : 'Add Task'}</h3>

        <label for="title">Title</label>
        <input id="title" type="text" bind:value={title} placeholder="Title" />

        <label for="description">Description</label>
        <textarea id="description" bind:value={description} placeholder="Description" />

        <label for="points">Points</label>
        <input id="points" type="number" step="0.1" bind:value={points} />

        <label for="proofType">Proof Type</label>
        <select id="proofType" bind:value={proofType}>
          <option value="PHOTO">Photo</option>
          <option value="VIDEO">Video</option>
        </select>

        <label for="order">Order</label>
        <input id="order" type="number" bind:value={order} />

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={close}>Cancel</button>
          {#if editId}
            <button type="button" class="danger" on:click={() => remove(editId)}>Delete</button>
          {/if}
          <button type="submit" disabled={!title}>Save</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showSelectModal}
  <div class="modal-backdrop" on:click={closeSelect}>
    <div class="modal select-modal" on:click|stopPropagation>
      <h3>Select Tasks</h3>

      {#if defaultTasks.length === 0}
        <p>Loading default tasks…</p>
      {:else}
        {@const available = defaultTasks.filter((d) => !tasks.some((t) => t.title.toLowerCase() === d.title.toLowerCase()))}
        {#if available.length === 0}
          <p>All available default tasks are already in this game.</p>
        {:else}
          <ul class="select-list">
            {#each available as task (task.title)}
              <li class="select-item" class:expanded={expandedDefault === task.title} on:click={() => toggleDefaultExpand(task)}>
                <div class="select-row">
                  <input
                    type="checkbox"
                    checked={isSelected(task)}
                    on:click|stopPropagation={() => toggleDefault(task)}
                  />
                  <span class="select-title">{task.title}</span>
                  <span class="select-meta">+{formatPoints(task.points)} · {task.proofType}</span>
                </div>
                {#if expandedDefault === task.title}
                  <p class="select-description">{task.description}</p>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      {/if}

      {#if error}<p class="error">{error}</p>{/if}

      <div class="actions">
        <button type="button" on:click={closeSelect}>Cancel</button>
        <button type="button" on:click={addSelected} disabled={selectedDefaults.length === 0}>
          Add {selectedDefaults.length ? `(${selectedDefaults.length})` : ''}
        </button>
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
    max-width: 40rem;
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

  .modal textarea {
    min-height: 8rem;
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

  .add-menu-wrap {
    position: relative;
  }

  .add-menu {
    position: absolute;
    top: calc(100% + 0.25rem);
    right: 0;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    min-width: 10rem;
    z-index: 100;
  }

  .add-menu button {
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    text-align: left;
    cursor: pointer;
    font: inherit;
    color: var(--text);
  }

  .add-menu button:hover {
    background: var(--bg);
  }

  .select-modal .select-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 60vh;
    overflow-y: auto;
  }

  .select-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem;
    cursor: pointer;
  }

  .select-item:hover {
    box-shadow: var(--shadow);
  }

  .select-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .select-row input {
    width: auto;
    margin: 0;
  }

  .select-title {
    flex: 1;
    font-weight: bold;
  }

  .select-meta {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .select-description {
    margin: 0.75rem 0 0 1.75rem;
    color: var(--muted);
  }
</style>
