<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';

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
    if (res.ok) {
      await load();
      toast.add(`Game ${status === 'LIVE' ? 'started' : status === 'COMPLETED' ? 'ended' : 'status updated'}`, 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not update game status', 'error');
    }
  }

  async function setViewerEnabled(enabled: boolean) {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ viewerEnabled: enabled }),
    });
    if (res.ok) {
      await load();
      toast.add(`Viewer ${enabled ? 'enabled' : 'disabled'}`, 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not update viewer', 'error');
    }
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
    <p class="status">● {game.status}</p>
    {#if remainingStr}<p class="timer">{remainingStr} REMAINING</p>{/if}

    <p class="code">GAME CODE: {game.code}</p>
    <p class="join">
      Join: <a href={game.joinUrl} target="_blank" rel="noreferrer">{game.joinUrl}</a>
      <button on:click={() => navigator.clipboard.writeText(game.joinUrl)}>COPY</button>
    </p>

    <p class="view">
      Viewer:
      {#if game.viewerEnabled}
        <a href={game.viewUrl} target="_blank" rel="noreferrer">{game.viewUrl}</a>
        <button on:click={() => navigator.clipboard.writeText(game.viewUrl)}>COPY</button>
      {:else}
        <span class="disabled">disabled</span>
      {/if}
      <button on:click={() => setViewerEnabled(!game.viewerEnabled)}>
        {game.viewerEnabled ? 'DISABLE VIEWER' : 'ENABLE VIEWER'}
      </button>
    </p>

    <div class="controls">
      <button on:click={() => setStatus('LIVE')} disabled={game.status !== 'NOT_STARTED'}>START GAME</button>
      <button on:click={() => setStatus('COMPLETED')} disabled={game.status !== 'LIVE'}>END GAME</button>
      {#if game.status === 'COMPLETED'}
        <a href="/view/{game.code}/results">VIEW RESULTS</a>
      {/if}
    </div>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</main>

<style>
  .container {
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

  .join,
  .view {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem 0;
  }

  .disabled {
    color: #666;
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
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
