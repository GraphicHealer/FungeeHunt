<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '$lib/toast';
  import { io } from 'socket.io-client';
  import SubmissionReview from '$lib/SubmissionReview.svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let submissions: any[] = [];
  let reviewing: any = null;
  let error = '';
  let socket: any;
  let interval: ReturnType<typeof setInterval>;

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

  async function loadSubmissions() {
    const res = await fetch(`/api/gm/games/${gameId}/submissions`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) submissions = await res.json();
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

  function remaining() {
    if (!game || game.status !== 'LIVE' || !game.endAt) return null;
    const ms = Math.max(0, new Date(game.endAt).getTime() - Date.now());
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 1000 / 60) % 60;
    const h = Math.floor(ms / 1000 / 60 / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  let remainingStr = '';

  onMount(async () => {
    await load();
    await loadSubmissions();
    if (game?.code) {
      socket = io({ transports: ['websocket', 'polling'] });
      socket.on(`game:${game.code.toUpperCase()}`, async () => {
        await load();
        await loadSubmissions();
      });
    }
    interval = setInterval(() => {
      remainingStr = remaining() ?? '';
    }, 1000);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (interval) clearInterval(interval);
  });
</script>

<main class="container">
  {#if game}
    <p class="status">● {game.status}</p>
    {#if remainingStr}<p class="timer">{remainingStr} REMAINING</p>{/if}

    <p class="code">GAME CODE: {game.code}</p>
    <p class="join">
      Join: <a href={game.joinUrl} target="_blank" rel="noreferrer">{game.joinUrl}</a>
      <button class="fungee-btn" style="width: auto; margin: 0;" on:click={() => navigator.clipboard.writeText(game.joinUrl)}>COPY</button>
    </p>

    <div class="controls">
      <button class="fungee-btn" on:click={() => setStatus('LIVE')} disabled={game.status !== 'NOT_STARTED'}>START GAME</button>
      <button class="fungee-btn danger" on:click={() => setStatus('COMPLETED')} disabled={game.status !== 'LIVE'}>END GAME</button>
      {#if game.status === 'COMPLETED'}
        <a class="fungee-btn secondary" href="/view/{game.code}/results">VIEW RESULTS</a>
      {/if}
    </div>

    <section class="feed" style="margin-top: 2rem;">
      <h2 class="fungee-section-title" style="margin-bottom: 1rem;">Submission Feed</h2>
      {#if submissions.length === 0}
        <p class="empty">No submissions yet.</p>
      {:else}
        <ul class="submissions">
          {#each submissions.slice(0, 20) as sub (sub.id)}
            <li on:click={() => (reviewing = sub)}>
              <div class="meta">
                <span class="team">{sub.team?.name ?? 'Unknown'}</span>
                <span class="task">{sub.task?.title ?? ''}</span>
                <span class="status">{sub.status}</span>
              </div>
              <span class="hint">Review</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</main>

{#if reviewing}
  <SubmissionReview {gameId} sub={reviewing} on:close={() => (reviewing = null)} on:review={loadSubmissions} />
{/if}

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
    flex-wrap: wrap;
  }

  .join a {
    color: var(--text);
  }

  .controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .feed {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .submissions {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .submissions li {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: box-shadow 0.15s;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .submissions li:hover {
    box-shadow: var(--shadow);
  }

  .meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .team {
    font-weight: bold;
  }

  .task {
    color: var(--muted);
  }

  .status {
    font-weight: bold;
  }

  .hint {
    color: var(--brand);
    font-size: 0.85rem;
    font-weight: 600;
  }

  .empty {
    color: var(--muted);
  }

  a {
    color: var(--text);
    text-decoration: none;
  }

  .error {
    color: var(--danger);
  }
</style>
