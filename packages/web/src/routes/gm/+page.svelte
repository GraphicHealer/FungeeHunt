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
      <button on:click={() => goto('/gm/new')}>NEW GAME</button>
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
        <button class="delete" on:click={() => remove(game)} title="Delete game">🗑</button>
      </div>
    {/each}
  </section>
</main>

<style>
  .board {
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: #f5f5f5;
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
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    transition: box-shadow 0.15s;
  }

  .game-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
    color: #666;
    margin: 0 0 0.5rem;
  }

  .status {
    font-weight: bold;
    color: #0366d6;
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
</style>
