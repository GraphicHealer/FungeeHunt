<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let players: any[] = [];
  let reissued: Record<string, string> = {};
  let showModal = false;
  let displayName = '';
  let error = '';

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
    error = '';
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  async function addOffline() {
    error = '';
    const res = await fetch(`/api/gm/games/${gameId}/players/offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ displayName }),
    });
    const data = await res.json();
    if (res.ok) {
      displayName = '';
      showModal = false;
      await load();
    } else {
      error = data.error ?? 'Could not add player';
    }
  }

  async function reissue(playerId: string) {
    const res = await fetch(`/api/gm/games/${gameId}/players/${playerId}/reissue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const data = await res.json();
      reissued[playerId] = data.joinUrl;
      reissued = reissued;
      await load();
    }
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Players</h2>
    <button on:click={openNew}>+ ADD OFFLINE PLAYER</button>
  </header>

  <ul class="player-list">
    {#each players as player (player.id)}
      <li>
        <div class="player-main">
          <span class="name">{player.displayName}</span>
          <span class="type">{player.type}</span>
          {#if player.team}<span class="team">{player.team.name}</span>{/if}
        </div>
        {#if player.type === 'APP'}
          <button on:click={() => reissue(player.id)}>REISSUE JOIN LINK</button>
        {/if}
        {#if reissued[player.id]}
          <span class="link" title={reissued[player.id]}>{reissued[player.id]}</span>
        {/if}
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <h3>Add Offline Player</h3>

      <label for="displayName">Display Name</label>
      <input id="displayName" type="text" bind:value={displayName} placeholder="Player name" />

      {#if error}<p class="error">{error}</p>{/if}

      <div class="actions">
        <button on:click={close}>Cancel</button>
        <button on:click={addOffline} disabled={!displayName}>Add</button>
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

  .player-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .player-list li {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    transition: box-shadow 0.15s;
  }

  .player-list li:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .player-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
  }

  .name {
    font-weight: bold;
  }

  .type {
    color: #666;
  }

  .team {
    color: #0366d6;
    font-size: 0.9rem;
  }

  .link {
    color: #0366d6;
    font-size: 0.85rem;
    max-width: 12rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    background: #fff;
    border-radius: 0.75rem;
    padding: 2rem;
    width: 90%;
    max-width: 24rem;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  }

  .modal h3 {
    margin-top: 0;
  }

  .modal input {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
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
    background: #0366d6;
    color: #fff;
  }

  .actions button:first-child {
    background: #eee;
    color: #333;
  }

  .actions button:disabled {
    background: #999;
    cursor: not-allowed;
  }

  .error {
    color: red;
  }
</style>
