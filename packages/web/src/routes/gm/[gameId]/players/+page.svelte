<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  const gameId = $page.params.gameId;

  let players: any[] = [];
  let showModal = false;
  let displayName = '';
  let carValue = '';
  let error = '';

  let showEditModal = false;
  let editId = '';
  let editName = '';
  let editCarValue = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/players`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) players = await res.json();
  }

  function openNew() {
    displayName = '';
    carValue = '';
    error = '';
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  function openEdit(player: any) {
    editId = player.id;
    editName = player.displayName;
    editCarValue = player.hasCar ? 'true' : 'false';
    error = '';
    showEditModal = true;
  }

  function closeEdit() {
    showEditModal = false;
  }

  async function saveEdit() {
    error = '';
    if (!editCarValue) {
      error = 'Please select whether the player has a car';
      return;
    }
    const res = await fetch(`/api/gm/games/${gameId}/players/${editId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ displayName: editName, hasCar: editCarValue === 'true' }),
    });
    if (res.ok) {
      showEditModal = false;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not save player';
    }
  }

  async function addOffline() {
    error = '';
    if (!carValue) {
      error = 'Please select whether the player has a car';
      return;
    }
    const res = await fetch(`/api/gm/games/${gameId}/players/offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ displayName, hasCar: carValue === 'true' }),
    });
    const data = await res.json();
    if (res.ok) {
      displayName = '';
      carValue = '';
      showModal = false;
      await load();
    } else {
      error = data.error ?? 'Could not add player';
    }
  }

  async function remove(player: any) {
    if (!confirm(`Delete player "${player.displayName}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/gm/games/${gameId}/players/${player.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) await load();
    else {
      const data = await res.json();
      alert(data.error ?? 'Could not delete player');
    }
  }

  onMount(load);
</script>

<div class="page" data-tour="players-page">
  <header class="page-header">
    <h2>Players</h2>
    <button class="fungee-btn" on:click={openNew} style="width: auto; margin: 0;">+ ADD OFFLINE PLAYER</button>
  </header>

  <ul class="player-list">
    {#each players as player (player.id)}
      <li>
        <div class="player-main">
          <span class="name">{player.displayName}</span>
          <span class="type">{player.type}</span>
          {#if player.hasCar}<span class="mdi mdi-car" title="Has a car" style="color: var(--brand);"></span>{/if}
          {#if player.team}<span class="team">{player.team.name}</span>{/if}
        </div>
        <div class="actions">
          <button class="edit" on:click={() => openEdit(player)} title="Edit player">
            <span class="mdi mdi-pencil"></span>
          </button>
          {#if player.team?.managerId !== player.id}
            <button class="delete" on:click={() => remove(player)} title="Delete player">
              <span class="mdi mdi-trash-can-outline"></span>
            </button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={addOffline}>
        <h3>Add Offline Player</h3>

        <label for="displayName">Display Name</label>
        <input id="displayName" type="text" bind:value={displayName} placeholder="Player name" />

        <label for="carValue">Has a car available to drive</label>
        <select id="carValue" bind:value={carValue} required>
          <option value="">Select one…</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={close}>Cancel</button>
          <button type="submit" disabled={!displayName}>Add</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showEditModal}
  <div class="modal-backdrop" on:click={closeEdit} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={saveEdit}>
        <h3>Edit Player</h3>

        <label for="editName">Display Name</label>
        <input id="editName" type="text" bind:value={editName} placeholder="Player name" />

        <label for="editCarValue">Has a car available to drive</label>
        <select id="editCarValue" bind:value={editCarValue} required>
          <option value="">Select one…</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={closeEdit}>Cancel</button>
          <button type="submit" disabled={!editName}>Save</button>
        </div>
      </form>
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

  .player-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .player-list li {
    transition: box-shadow 0.15s, transform 0.15s;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    transition: box-shadow 0.15s;
  }

  .player-list li:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
  }

  .player-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    flex-wrap: wrap;
  }

  .name {
    font-weight: bold;
  }

  .type {
    color: var(--muted);
  }

  .team {
    color: var(--brand);
    font-size: 0.9rem;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .edit,
  .delete {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
  }

  .edit {
    color: var(--brand);
  }

  .delete {
    color: var(--danger);
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
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 2rem;
    width: 90%;
    max-width: 24rem;
    box-shadow: var(--shadow);
  }

  .modal h3 {
    margin-top: 0;
  }

  .modal input {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 0.75rem;
  }

  .modal input[type="checkbox"] {
    width: auto;
    margin: 0;
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
    color: var(--muted);
    cursor: not-allowed;
  }

  .error {
    color: var(--danger);
  }
</style>
