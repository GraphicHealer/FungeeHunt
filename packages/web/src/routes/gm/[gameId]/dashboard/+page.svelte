<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let error = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      game = await res.json();
    } else {
      error = 'Could not load game';
    }
  }

  async function setStatus(status: string) {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await load();
  }

  function remaining() {
    if (!game || game.status !== 'LIVE' || !game.endAt) return null;
    const ms = Math.max(0, new Date(game.endAt).getTime() - Date.now());
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 1000 / 60) % 60;
    const h = Math.floor(ms / 1000 / 60 / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  let remainingStr = '';
  let interval: ReturnType<typeof setInterval>;

  onMount(() => {
    load();
    interval = setInterval(() => {
      remainingStr = remaining() ?? '';
    }, 1000);
  });
</script>

<main class="container">
  {#if game}
    <h1>{game.name}</h1>

    <p class="status">● {game.status}</p>
    {#if remainingStr}<p class="timer">{remainingStr} REMAINING</p>{/if}

    <p class="code">GAME CODE: {game.code}</p>
    <p class="join">
      Join: <a href={game.joinUrl} target="_blank" rel="noreferrer">{game.joinUrl}</a>
      <button on:click={() => navigator.clipboard.writeText(game.joinUrl)}>COPY</button>
    </p>

    <div class="controls">
      <button on:click={() => setStatus('LIVE')} disabled={game.status !== 'NOT_STARTED'}>START GAME</button>
      <button on:click={() => setStatus('COMPLETED')} disabled={game.status !== 'LIVE'}>END GAME</button>
      {#if game.status === 'COMPLETED'}
        <a href="/view/{game.code}/results">VIEW RESULTS</a>
      {/if}
    </div>

    <nav>
      <a href="/gm/{gameId}/tasks">Tasks</a>
      <a href="/gm/{gameId}/teams">Teams</a>
      <a href="/gm/{gameId}/players">Players</a>
      <a href="/gm/{gameId}/submissions">Submissions</a>
      <a href="/gm/{gameId}/bonuses">Bonuses</a>
      <a href="/gm/{gameId}/rules">Rules</a>
    </nav>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .status {
    font-weight: bold;
    font-size: 1.2rem;
  }

  .timer {
    font-size: 1.5rem;
    font-weight: bold;
  }

  .code {
    font-size: 1.5rem;
    letter-spacing: 0.25rem;
  }

  .join {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  nav {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }

  a {
    padding: 0.75rem 1.5rem;
    background: #eee;
    text-decoration: none;
    color: #000;
  }

  .error {
    color: red;
  }
</style>
