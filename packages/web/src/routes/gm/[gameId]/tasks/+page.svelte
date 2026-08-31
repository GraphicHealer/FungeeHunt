<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { formatPoints } from '$lib/format';
  import { toast } from '$lib/toast';
  import { downloadTemplate } from '$lib/taskCsv';

  const gameId = $page.params.gameId;

  let tasks: any[] = [];
  let error = '';
  let showModal = false;
  let editId = '';
  let title = '';
  let description = '';
  let points = 0;
  let proofType = 'PHOTO';
  let photoCount: number | null = null;
  let delayEnabled = false;
  let delayMinutes = 10;
  let order = 0;

  let showAddMenu = false;
  let bulkMode = false;
  let selectedIds: string[] = [];
  let lastSelectedId: string | null = null;
  let bulkPoints = 150;
  let showSetPoints = false;

  let dragId: string | null = null;
  let dragOverId: string | null = null;
  let showSelectModal = false;
  let showImportModal = false;
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
    photoCount = null;
    delayEnabled = false;
    delayMinutes = 10;
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

  function openImport() {
    showAddMenu = false;
    showImportModal = true;
  }

  function closeImport() {
    showImportModal = false;
  }

  function downloadGameTemplate() {
    downloadTemplate('fungeehunt-tasks-template.csv', []);
  }

  async function importTasks(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const csv = await file.text();
    const res = await fetch(`/api/gm/games/${gameId}/tasks/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ csv }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.add(`${data.count} tasks imported`, 'success');
      showImportModal = false;
      await load();
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not import tasks', 'error');
    }
    input.value = '';
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
    photoCount = task.photoCount ?? null;
    delayEnabled = !!task.delayMinutes;
    delayMinutes = task.delayMinutes ?? 10;
    order = task.order;
    error = '';
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  async function saveToDefault() {
    if (!title.trim()) return;
    error = '';
    const res = await fetch('/api/gm/settings/default-tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        task: {
          title,
          description,
          points,
          proofType,
          photoCount: proofType === 'PHOTOS' ? photoCount : null,
          delayMinutes: delayEnabled ? Number(delayMinutes) || null : null,
        },
      }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.add(`Task ${data.updated} in database`, 'success');
      await loadDefaults();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not save task to database';
    }
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
      body: JSON.stringify({
        title,
        description,
        points,
        proofType,
        photoCount: proofType === 'PHOTOS' ? photoCount : null,
        delayMinutes: delayEnabled ? Number(delayMinutes) || null : null,
        order,
      }),
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

  function toggleBulkMode() {
    bulkMode = !bulkMode;
    if (!bulkMode) {
      selectedIds = [];
      lastSelectedId = null;
    }
  }

  function clearSelection() {
    selectedIds = [];
    lastSelectedId = null;
  }

  function selectTo(task: any, e: MouseEvent) {
    if (!lastSelectedId) {
      toggleTask(task.id, e);
      return;
    }
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(lastSelectedId);
    const to = ids.indexOf(task.id);
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    const rangeIds = ids.slice(start, end + 1);
    selectedIds = [...new Set([...selectedIds, ...rangeIds])];
  }

  function handleTaskClick(task: any, e: MouseEvent) {
    if (!bulkMode) {
      openEdit(task);
      return;
    }
    if (e.shiftKey && lastSelectedId) {
      selectTo(task, e);
      lastSelectedId = task.id;
      return;
    }
    toggleTask(task.id, e);
    lastSelectedId = task.id;
  }

  function toggleTask(id: string, e?: MouseEvent) {
    e?.stopPropagation();
    selectedIds = selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
  }

  function allSelected() {
    return tasks.length > 0 && tasks.every((t) => selectedIds.includes(t.id));
  }

  function toggleAll() {
    selectedIds = allSelected() ? [] : tasks.map((t) => t.id);
  }

  async function bulkDelete() {
    if (!selectedIds.length || !confirm(`Delete ${selectedIds.length} tasks?`)) return;
    const res = await fetch(`/api/gm/games/${gameId}/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ action: 'delete', ids: selectedIds }),
    });
    if (res.ok) {
      selectedIds = [];
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not delete tasks';
    }
  }

  function toggleSetPoints() {
    showSetPoints = !showSetPoints;
    if (showSetPoints) bulkPoints = 150;
  }

  async function bulkSetPoints() {
    if (!selectedIds.length) return;
    const res = await fetch(`/api/gm/games/${gameId}/tasks/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ action: 'setPoints', ids: selectedIds, points: bulkPoints }),
    });
    if (res.ok) {
      selectedIds = [];
      showSetPoints = false;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not set points';
    }
  }

  function handleDragStart(task: any, e: DragEvent) {
    if (task.order === 1) {
      e.preventDefault();
      return;
    }
    dragId = task.id;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', task.id);
    }
  }

  function handleDragOver(task: any, e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    if (task.id !== dragId && task.order !== 1) {
      dragOverId = task.id;
    }
  }

  function handleDragLeave() {
    dragOverId = null;
  }

  function handleDrop(target: any, e: DragEvent) {
    e.preventDefault();
    dragOverId = null;
    if (!dragId || dragId === target.id || target.order === 1) {
      dragId = null;
      return;
    }
    const from = tasks.findIndex((t) => t.id === dragId);
    const to = tasks.findIndex((t) => t.id === target.id);
    if (from < 0 || to < 0) {
      dragId = null;
      return;
    }
    let newIndex = to;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (e.clientY - rect.top > rect.height / 2) {
      newIndex = to + 1;
    }
    const reordered = [...tasks];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(newIndex, 0, moved);
    tasks = reordered;
    dragId = null;
    saveOrder();
  }

  async function saveOrder() {
    const res = await fetch(`/api/gm/games/${gameId}/tasks/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ taskIds: tasks.map((t) => t.id) }),
    });
    if (res.ok) await load();
    else error = 'Could not save task order';
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Tasks</h2>
    <div class="header-actions">
      <button
        class="fungee-btn icon-btn"
        type="button"
        title="Bulk actions"
        on:click={toggleBulkMode}
        style="width: auto; margin: 0;"
        class:active={bulkMode}
      >
        <span class="mdi mdi-checkbox-multiple-blank-outline"></span>
      </button>
      <div class="add-menu-wrap">
        <button class="fungee-btn" on:click={toggleAddMenu} style="width: auto; margin: 0;">+ ADD TASK</button>
        {#if showAddMenu}
          <div class="add-menu">
            <button type="button" on:click={openSelect}>Select task</button>
            <button type="button" on:click={openCustom}>Custom task</button>
            <button type="button" on:click={openImport}>Import from CSV</button>
          </div>
        {/if}
      </div>
    </div>
  </header>

  {#if bulkMode}
    <div class="bulk-bar" transition:fade={{ duration: 180 }}>
      <label class="bulk-check">
        <input type="checkbox" checked={allSelected()} on:change={toggleAll} />
        <span>{selectedIds.length} selected</span>
      </label>
      <div class="bulk-actions">
        <div class="bulk-set-points-wrap">
          <button class="fungee-btn" type="button" on:click={toggleSetPoints} disabled={selectedIds.length === 0}>
            Set Points
          </button>
          {#if showSetPoints}
            <div class="set-points-popover" transition:scale={{ duration: 180, start: 0.95 }}>
              <input type="number" step="0.1" bind:value={bulkPoints} placeholder="Points" />
              <button class="fungee-btn" type="button" on:click={bulkSetPoints}>
                Apply
              </button>
            </div>
          {/if}
        </div>
        <button class="fungee-btn danger" type="button" on:click={bulkDelete} disabled={selectedIds.length === 0}>
          Delete
        </button>
        <button class="fungee-btn secondary" type="button" on:click={toggleBulkMode}>
          Done
        </button>
      </div>
    </div>
  {/if}

  {#if error}<p class="error">{error}</p>{/if}

  <ul class="task-list">
    {#each tasks as task (task.id)}
      <li
        class:selected={selectedIds.includes(task.id)}
        class:drag-over={dragOverId === task.id}
        on:click={(e) => handleTaskClick(task, e)}
        on:dragover={(e) => handleDragOver(task, e)}
        on:dragleave={handleDragLeave}
        on:drop={(e) => handleDrop(task, e)}
      >
        <div class="task-main">
          {#if bulkMode}
            <input
              class="task-check"
              type="checkbox"
              checked={selectedIds.includes(task.id)}
              on:click|stopPropagation={() => toggleTask(task.id)}
            />
          {/if}
          <span class="order">{task.order}</span>
          <span class="title">{task.title}</span>
          <span class="meta">+{formatPoints(task.points)} · {task.proofType}</span>
          {#if task.order !== 1}
            <span
              class="drag-handle"
              draggable={true}
              on:dragstart={(e) => handleDragStart(task, e)}
              on:click|stopPropagation
              title="Drag to reorder"
            >
              <span class="mdi mdi-drag-horizontal"></span>
            </span>
          {/if}
        </div>
        <p class="description">{task.description}</p>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
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
          <option value="PHOTOS">Photos</option>
        </select>

        {#if proofType === 'PHOTOS'}
          <label for="photoCount">Number of Photos (optional)</label>
          <input id="photoCount" type="number" min="1" bind:value={photoCount} placeholder="e.g., number of other teams" />
        {/if}

        <label class="fungee-check" style="display: flex; align-items: center; gap: 0.5rem;">
          <input type="checkbox" bind:checked={delayEnabled} />
          Delay this task after game start
        </label>

        {#if delayEnabled}
          <label for="delayMinutes">Delay (minutes)</label>
          <input id="delayMinutes" type="number" min="1" bind:value={delayMinutes} />
        {/if}

        <label for="order">Order</label>
        <input id="order" type="number" bind:value={order} />

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={close}>Cancel</button>
          <button type="button" on:click={saveToDefault} disabled={!title}>Save to Database</button>
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
  <div class="modal-backdrop" on:click={closeSelect} transition:fade={{ duration: 180 }}>
    <div class="modal select-modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
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

{#if showImportModal}
  <div class="modal-backdrop" on:click={closeImport} transition:fade={{ duration: 180 }}>
    <div class="modal select-modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <h3>Import Tasks from CSV</h3>
      <p style="margin: 0 0 1rem; color: var(--muted);">
        Download the template, add your tasks, then upload the CSV.
      </p>
      <div class="csv-actions">
        <button class="fungee-btn" type="button" on:click={downloadGameTemplate} style="width: auto; margin: 0;">
          Download Template
        </button>
        <label class="fungee-btn" for="game-tasks-csv" style="width: auto; margin: 0;">
          Upload CSV
        </label>
        <input id="game-tasks-csv" type="file" accept=".csv,text/csv" on:change={importTasks} />
      </div>
      <div class="actions" style="margin-top: 1rem;">
        <button type="button" on:click={closeImport}>Close</button>
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
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
  }

  .task-list li:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
  }

  .task-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .icon-btn.active {
    background: var(--bg);
    color: var(--brand);
    border: 1px solid var(--brand);
  }

  .bulk-bar {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .bulk-check {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .bulk-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .bulk-set-points-wrap {
    position: relative;
  }

  .set-points-popover {
    position: absolute;
    top: calc(100% + 0.35rem);
    right: 0;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 10rem;
    z-index: 100;
  }

  .set-points-popover input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    box-sizing: border-box;
  }

  .bulk-points {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.95rem;
  }

  .bulk-points input {
    width: 5rem;
    padding: 0.35rem 0.5rem;
    font-size: 0.95rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
  }

  .bulk-actions .fungee-btn {
    margin: 0;
    padding: 0.5rem 0.75rem;
    width: auto;
  }

  .task-list li.selected {
    border-color: var(--brand);
    box-shadow: 0 0 0 2px var(--brand);
  }

  .task-list li.drag-over {
    border-style: dashed;
    border-color: var(--brand);
  }

  .task-check {
    width: auto;
    margin: 0;
  }

  .drag-handle {
    margin-left: auto;
    color: var(--muted);
    cursor: grab;
    padding: 0.25rem;
    border-radius: 0.25rem;
    font-size: 1.25rem;
    line-height: 1;
  }

  .drag-handle:hover {
    background: var(--bg);
    color: var(--text);
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

  .description {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
    line-height: 1.4;
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

  .csv-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .csv-actions input[type="file"] {
    display: none;
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
