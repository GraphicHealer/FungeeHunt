<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '$lib/toast';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';
  import SubmissionReview from '$lib/SubmissionReview.svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let submissions: any[] = [];
  let teams: any[] = [];
  let foodDrive: Record<string, number> = {};
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

  async function loadTeams() {
    const res = await fetch(`/api/gm/games/${gameId}/teams`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      teams = await res.json();
      for (const t of teams) {
        foodDrive[t.id] = t.foodDriveItems ?? 0;
      }
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

  function teamScore(team: any) {
    if (!game) return 0;
    const completed = submissions.filter((s: any) => s.teamId === team.id && s.status === 'COMPLETED');
    const taskScore = completed.reduce((sum: number, s: any) => sum + (s.task?.points ?? 0), 0);
    const returnBonus = team.returnBonusAwarded ? game.returnPoints : 0;
    const foodDriveBonus = team.foodDriveBonusAwarded ? (team.foodDriveItems ?? 0) * game.foodDrivePointsPerItem : 0;
    return taskScore + returnBonus + foodDriveBonus;
  }

  $: leaderboard = game && teams.length
    ? [...teams].map((t: any) => ({ ...t, score: teamScore(t) })).sort((a: any, b: any) => b.score - a.score)
    : [];

  function isInReturnWindow() {
    if (!game || !game.returnBonusEnabled || !game.returnStart || !game.returnEnd) return false;
    return now >= new Date(game.returnStart).getTime() && now <= new Date(game.returnEnd).getTime();
  }

  async function markReturn(teamId: string) {
    if (!isInReturnWindow()) return;
    const res = await fetch(`/api/gm/games/${gameId}/bonuses/return/${teamId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      await loadTeams();
      toast.add('Return marked', 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not mark return', 'error');
    }
  }

  async function saveFoodDrive(teamId: string) {
    const res = await fetch(`/api/gm/games/${gameId}/bonuses/food-drive/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ items: foodDrive[teamId] }),
    });
    if (res.ok) {
      await loadTeams();
      toast.add('Food drive saved', 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not save food drive', 'error');
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
  let now = Date.now();

  onMount(async () => {
    await load();
    await loadSubmissions();
    await loadTeams();
    if (game?.code) {
      socket = io({ transports: ['websocket', 'polling'] });
      socket.on(`game:${game.code.toUpperCase()}`, async () => {
        await load();
        await loadSubmissions();
        await loadTeams();
      });
    }
    interval = setInterval(() => {
      now = Date.now();
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
    <div class="main">
      <section class="feed" style="margin-bottom: 1rem;">
        <h2 class="fungee-section-title" style="margin-bottom: 1rem;">Leaderboard</h2>
        {#if leaderboard.length === 0}
          <p class="empty">No scores yet.</p>
        {:else}
          <ol class="leaderboard-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            {#each leaderboard as team, i (team.id)}
              <li class="team-item" style="font-size: 1rem; gap: 0.5rem;">
                <span class="rank" style="width: 1.5rem; color: var(--brand); font-weight: bold;">{i + 1}</span>
                <span class="team-name">{team.name ?? 'Unnamed'}</span>
                <span class="score" style="font-weight: bold; margin-left: auto; color: var(--success);">{formatPoints(team.score)}</span>
              </li>
            {/each}
          </ol>
        {/if}
      </section>

      <section class="feed">
        <h2 class="fungee-section-title" style="margin-bottom: 1rem;">Submission Feed</h2>
        {#if submissions.length === 0}
          <p class="empty">No submissions yet.</p>
        {:else}
          <ul class="submissions">
            {#each submissions.slice(0, 20) as sub (sub.id)}
              <li class:incomplete={sub.status === 'INCOMPLETE'} on:click={() => (reviewing = sub)}>
                <div class="meta">
                  <span class="team">{sub.team?.name ?? 'Unknown'}</span>
                  <span class="task">{sub.task?.title ?? ''}</span>
                  <span class="status">{sub.status === 'INCOMPLETE' ? 'REJECTED' : sub.status}</span>
                </div>
                <span class="hint">Review</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    <aside class="side">
      <section class="side-card controls-card">
        <h3 class="fungee-section-title" style="font-size: 1rem; margin: 0;">Game Controls</h3>
        <p class="status" style="margin: 0.25rem 0 0;">● {game.status}</p>
        {#if remainingStr}<p class="timer" style="margin: 0 0 0.5rem;">{remainingStr}</p>{/if}
        <p class="code" style="font-size: 1.1rem; letter-spacing: 0.15rem; margin: 0;">{game.code}</p>
        <p class="join" style="margin: 0.25rem 0 0.75rem;">
          <a href={game.joinUrl} target="_blank" rel="noreferrer">{game.joinUrl}</a>
        </p>
        <div class="controls" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="fungee-btn" style="width: auto; flex: 1; min-width: 6rem;" on:click={() => navigator.clipboard.writeText(game.joinUrl)}>COPY</button>
          <button class="fungee-btn" style="width: auto; flex: 1; min-width: 6rem;" on:click={() => setStatus('LIVE')} disabled={game.status !== 'NOT_STARTED'}>START</button>
          <button class="fungee-btn danger" style="width: auto; flex: 1; min-width: 6rem;" on:click={() => setStatus('COMPLETED')} disabled={game.status !== 'LIVE'}>END</button>
          {#if game.status === 'COMPLETED'}
            <a class="fungee-btn secondary" style="width: auto; flex: 1; min-width: 6rem; text-align: center;" href="/view/{game.code}/results">RESULTS</a>
          {/if}
        </div>
      </section>

      {#if game.returnBonusEnabled}
        <section class="side-card">
          <h3 class="fungee-section-title" style="font-size: 1rem; margin: 0;">Return Bonus</h3>
          <p class="window">{formatPoints(game.returnPoints)} pts · {game.returnStart ? new Date(game.returnStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''} – {game.returnEnd ? new Date(game.returnEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}</p>
          <ul class="team-list">
            {#each teams as team (team.id)}
              <li class="team-item">
                <span class="team-name">{team.name ?? 'Unnamed'}</span>
                {#if team.returnBonusAwarded}
                  <span class="awarded"><span class="mdi mdi-check"></span></span>
                {:else}
                  <button class="fungee-btn" style="width: auto; margin: 0; padding: 0.4rem 0.6rem; font-size: 0.8rem;" on:click={() => markReturn(team.id)} disabled={!isInReturnWindow()}>MARK</button>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if game.foodDriveEnabled}
        <section class="side-card">
          <h3 class="fungee-section-title" style="font-size: 1rem; margin: 0;">Food Drive</h3>
          <p class="window">{formatPoints(game.foodDrivePointsPerItem)} pts / item</p>
          <ul class="team-list">
            {#each teams as team (team.id)}
              <li class="team-item">
                <span class="team-name">{team.name ?? 'Unnamed'}</span>
                <div class="fd-row">
                  <input class="fungee-input" type="number" bind:value={foodDrive[team.id]} min="0" style="width: 3.5rem; padding: 0.25rem; font-size: 0.85rem;" />
                  <button class="fungee-btn" style="width: auto; margin: 0; padding: 0.4rem 0.6rem; font-size: 0.8rem;" on:click={() => saveFoodDrive(team.id)}>SAVE</button>
                </div>
                {#if team.foodDriveBonusAwarded}
                  <span class="awarded"><span class="mdi mdi-check"></span></span>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </aside>
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
    display: grid;
    grid-template-columns: 1fr 18rem;
    gap: 1rem;
    align-items: start;
    font-family: system-ui, sans-serif;
  }

  @media (max-width: 64rem) {
    .container {
      grid-template-columns: 1fr;
    }
  }

  .main {
    min-width: 0;
  }

  .feed {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.25rem;
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
    padding: 0.85rem;
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

  .side {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .side-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    font-size: 0.9rem;
  }

  .controls-card .status {
    font-size: 1.1rem;
  }

  .controls-card .timer {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--brand);
  }

  .controls-card .join {
    word-break: break-all;
  }

  .controls-card .join a {
    color: var(--text);
  }

  .window {
    margin: 0.25rem 0 0.75rem;
    color: var(--muted);
    font-size: 0.85rem;
  }

  .team-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .team-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .team-name {
    flex: 1;
    min-width: 4rem;
    font-weight: 600;
    font-size: 0.85rem;
  }

  .fd-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .awarded {
    color: var(--success);
    font-size: 1rem;
  }

  .submissions li.incomplete {
    border-color: var(--danger);
    box-shadow: 0 0 0 1px var(--danger);
  }

  .error {
    color: var(--danger);
  }
</style>
