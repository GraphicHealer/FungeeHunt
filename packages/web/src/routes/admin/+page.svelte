<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';

  let games: any[] = [];
  let loading = true;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  function statusLabel(status: string) {
    if (status === 'NOT_STARTED') return 'Pending';
    if (status === 'LIVE') return 'Live';
    if (status === 'COMPLETED') return 'Ended';
    return status;
  }

  async function load() {
    const res = await fetch('/api/gm/games', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      games = await res.json();
    } else if (res.status === 401 || res.status === 403) {
      goto('/login');
    } else {
      toast.add('Could not load games', 'error');
    }
    loading = false;
  }

  async function remove(game: any) {
    if (!confirm(`Delete game "${game.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/gm/games/${game.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      toast.add('Game deleted', 'success');
      await load();
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not delete game', 'error');
    }
  }

  function openGame(game: any) {
    window.open(`/gm/${game.id}/dashboard`, '_blank');
  }

  async function copyUrl(game: any) {
    try {
      await navigator.clipboard.writeText(game.joinUrl ?? window.location.origin + `/play/${game.code}`);
      toast.add('Join link copied', 'success');
    } catch {
      toast.add('Could not copy link', 'error');
    }
  }

  onMount(load);
</script>

<main class="board">
  <header class="topbar">
    <h1>Admin Dashboard</h1>
    <div class="actions">
      <button on:click={() => goto('/admin/settings')}><span class="mdi mdi-cog"></span> System Settings</button>
      <button on:click={() => { localStorage.removeItem('gmToken'); goto('/'); }}><span class="mdi mdi-logout"></span> Log Out</button>
    </div>
  </header>

  {#if loading}
    <p>Loading…</p>
  {:else if games.length === 0}
    <div class="empty-card">
      <h2>No games yet</h2>
      <p>Games created from the main page will appear here.</p>
    </div>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Game ID</th>
            <th>Name</th>
            <th>Status</th>
            <th>Teams</th>
            <th>Players</th>
            <th>Submissions</th>
            <th>Storage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each games as game (game.id)}
            <tr>
              <td><span class="game-id">{game.id}</span></td>
              <td class="name">{game.name}</td>
              <td><span class="status {game.status}">{statusLabel(game.status)}</span></td>
              <td>{game.teamCount}</td>
              <td>{game.playerCount}</td>
              <td>{game.submissionCount}</td>
              <td>{game.storageSize}</td>
              <td class="actions">
                <button class="icon" title="Copy game URL" on:click={() => copyUrl(game)}>
                  <span class="mdi mdi-content-copy"></span>
                </button>
                <button class="icon" title="Open GM dashboard in new tab" on:click={() => openGame(game)}>
                  <span class="mdi mdi-open-in-new"></span>
                </button>
                <button class="icon danger" title="Delete game" on:click={() => remove(game)}>
                  <span class="mdi mdi-trash-can-outline"></span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</main>

<style>
  .board {
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: var(--bg);
    min-height: 100vh;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .topbar h1 {
    margin: 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .actions button {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--card);
    color: var(--text);
    cursor: pointer;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .actions button:hover {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }

  .table-wrap {
    overflow-x: auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.95rem;
  }

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  th {
    background: var(--bg);
    font-weight: 700;
  }

  .game-id {
    font-family: monospace;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .name {
    font-weight: 600;
  }

  .status {
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
  }

  .status.NOT_STARTED { background: #f0ad4e; color: #fff; }
  .status.LIVE { background: #5cb85c; color: #fff; }
  .status.COMPLETED { background: #777; color: #fff; }

  td.actions {
    display: flex;
    gap: 0.35rem;
  }

  .icon {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.35rem;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
  }

  .icon:hover {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }

  .icon.danger:hover {
    background: #ff4444;
    border-color: #ff4444;
  }

  .empty-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
  }

  .empty-card h2 {
    margin: 0 0 0.5rem;
  }

  .empty-card p {
    color: var(--muted);
    margin: 0;
  }
</style>
