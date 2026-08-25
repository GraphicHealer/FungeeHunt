<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';

  let games: any[] = [];

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch('/api/gm/games', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      games = await res.json();
    } else {
      toast.add('Could not load games', 'error');
    }
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

  onMount(load);
</script>

<main class="board">
  <header class="topbar">
    <h1>Game Master Board</h1>
    <div class="actions">
      <button on:click={() => goto('/gm/settings')}>SYSTEM SETTINGS</button>
      <button data-tour="new-game" on:click={() => goto('/gm/new')}>NEW GAME</button>
    </div>
  </header>

  <section class="games">
    {#each games as game (game.id)}
      <div class="game-card">
        <button class="open" on:click={() => goto(`/gm/${game.id}/dashboard`)}>
          <h2>{game.name}</h2>
          <p class="code">{game.code}</p>
          <span class="status">{game.status}</span>
        </button>
        <button class="delete" on:click={() => remove(game)} title="Delete game">
          <span class="mdi mdi-trash-can-outline"></span>
        </button>
      </div>
    {:else}
      <div class="empty-card">
        <h2>No games yet</h2>
        <p>Would you like to create one now?</p>
        <button class="fungee-btn" data-tour="no-games-create" style="width: auto; margin: 0;" on:click={() => goto('/gm/new')}>CREATE GAME</button>
      </div>
    {/each}
  </section>
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

  .games {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1rem;
  }

  .game-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    transition: box-shadow 0.15s;
  }

  .game-card:hover {
    box-shadow: var(--shadow);
  }

  .open {
    flex: 1;
    text-align: left;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }

  .open h2 {
    margin: 0 0 0.5rem;
  }

  .code {
    font-family: monospace;
    letter-spacing: 0.15rem;
    color: var(--muted);
    margin: 0 0 0.5rem;
  }

  .status {
    font-weight: bold;
    color: var(--brand);
  }

  .delete {
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .empty-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    grid-column: 1 / -1;
  }

  .empty-card h2 {
    margin: 0 0 0.5rem;
  }

  .empty-card p {
    color: var(--muted);
    margin: 0 0 1.5rem;
  }
</style>
