<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;

  let data: any = null;
  let error = '';
  let currentSlide = 0;
  let slideTimer: ReturnType<typeof setInterval> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let socket: any;

  let now = Date.now();

  function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function load() {
    const res = await fetch(`/api/view/${code}`);
    if (res.ok) {
      const next = await res.json();
      if (data && next.recent?.[0]?.id !== data.recent?.[0]?.id) {
        currentSlide = 0;
      }
      data = next;
      setupTimers();
    } else {
      error = 'Could not load viewer';
    }
  }

  function setupTimers() {
    if (slideTimer) clearInterval(slideTimer);
    if (countdownTimer) clearInterval(countdownTimer);

    if (data?.game?.status === 'LIVE') {
      slideTimer = setInterval(() => {
        if (data?.recent?.length) {
          currentSlide = (currentSlide + 1) % data.recent.length;
        }
      }, 6000);
    } else {
      countdownTimer = setInterval(() => {
        now = Date.now();
      }, 1000);
    }
  }

  onMount(() => {
    load();

    socket = io({
      transports: ['websocket', 'polling'],
    });
    socket.on(`game:${code.toUpperCase()}`, load);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (slideTimer) clearInterval(slideTimer);
    if (countdownTimer) clearInterval(countdownTimer);
  });

  $: startsIn = data?.game?.startAt
    ? new Date(data.game.startAt).getTime() - now
    : null;
</script>

<main class="viewer">
  {#if data}
    {#if data.game.status === 'NOT_STARTED'}
      <div class="viewer-join">
        <h1 class="viewer-title">{data.game.name}</h1>
        <p class="viewer-hint">Scan the QR code or visit the URL below to join</p>

        {#if data.game.qrUrl}
          <img class="qr" src={data.game.qrUrl} alt="Join game QR code" />
        {/if}

        <p class="viewer-code">{data.game.code}</p>
        <a class="viewer-url" href={data.game.joinUrl} target="_blank" rel="noreferrer">{data.game.joinUrl}</a>

        {#if startsIn !== null}
          <p class="viewer-countdown">{formatDuration(startsIn)}</p>
          <p class="viewer-hint">until the game starts</p>
        {:else}
          <p class="viewer-countdown">Waiting for the Game Master to start…</p>
        {/if}
      </div>
    {:else}
      <header class="viewer-header">
        <h1>{data.game.name}</h1>
        <div class="viewer-status">
          <span class="viewer-badge">{data.game.status}</span>
          {#if data.remaining}
            <span class="viewer-remaining">{data.remaining} REMAINING</span>
          {/if}
        </div>
      </header>

      <section class="viewer-main">
        <aside class="viewer-panel viewer-leaderboard">
          <h2>LEADERBOARD</h2>
          <ol>
            {#each data.leaderboard as team, i (team.id)}
              <li>
                <span class="rank">{i + 1}</span>
                <span class="name">{team.name ?? 'Unnamed team'}</span>
                <span class="score">{formatPoints(team.score)}</span>
              </li>
            {/each}
          </ol>
        </aside>

        <div class="viewer-stage">
          {#if data.recent?.length}
            <figure class="viewer-slide">
              <img
                src={data.recent[currentSlide].proofUrl}
                alt={data.recent[currentSlide].task?.title ?? 'Submitted photo'}
              />
              <figcaption>
                <span class="team">{data.recent[currentSlide].team?.name ?? 'Unknown team'}</span>
                <span class="task">{data.recent[currentSlide].task?.title ?? ''}</span>
                <span class="points">+{formatPoints(data.recent[currentSlide].task?.points ?? 0)}</span>
              </figcaption>
            </figure>
          {:else}
            <div class="viewer-empty">Waiting for the first submission…</div>
          {/if}
        </div>
      </section>

      <footer class="viewer-panel viewer-feed">
        <h2>LATEST UPDATES</h2>
        <div class="viewer-ticker">
          {#each data.recent.slice(0, 8) as item (item.id)}
            <div class="viewer-item">
              <strong>{item.team?.name ?? 'Unknown team'}</strong>
              completed <em>{item.task?.title ?? ''}</em>
              <span class="viewer-pts">+{formatPoints(item.task?.points ?? 0)}</span>
            </div>
          {/each}
        </div>
      </footer>
    {/if}
  {:else if error}
    <p class="viewer-error">{error}</p>
  {:else}
    <p class="viewer-loading">Loading…</p>
  {/if}
</main>

<style>
  .viewer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1.5rem;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }

  .viewer-join {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .viewer-title {
    margin: 0;
    font-size: 3rem;
    color: var(--brand);
  }

  .viewer-hint {
    margin: 0;
    color: var(--muted);
    font-size: 1.25rem;
  }

  .qr {
    width: 16rem;
    height: 16rem;
    max-width: 40vw;
    max-height: 40vh;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: #fff;
    padding: 0.5rem;
  }

  .viewer-code {
    margin: 0;
    font-family: monospace;
    font-size: 3.5rem;
    font-weight: bold;
    letter-spacing: 0.4rem;
    color: var(--brand);
  }

  .viewer-url {
    color: var(--brand);
    font-size: 1.5rem;
    text-decoration: none;
    word-break: break-all;
  }

  .viewer-url:hover {
    text-decoration: underline;
  }

  .viewer-countdown {
    margin: 0;
    font-size: 3rem;
    font-weight: bold;
    font-family: monospace;
  }

  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .viewer-header h1 {
    margin: 0;
    font-size: 2rem;
    color: var(--text);
  }

  .viewer-status {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 1.25rem;
  }

  .viewer-badge {
    background: var(--success);
    color: #fff;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .viewer-remaining {
    font-weight: bold;
  }

  .viewer-main {
    flex: 1;
    display: flex;
    gap: 1rem;
    min-height: 0;
  }

  .viewer-panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: var(--shadow);
  }

  .viewer-panel h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .viewer-leaderboard {
    width: 22rem;
    overflow-y: auto;
  }

  .viewer-leaderboard ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .viewer-leaderboard li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.15rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
  }

  .rank {
    width: 1.75rem;
    font-weight: bold;
    color: var(--brand);
  }

  .name {
    flex: 1;
  }

  .score {
    font-weight: bold;
  }

  .viewer-stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    position: relative;
    overflow: hidden;
  }

  .viewer-slide {
    margin: 0;
    text-align: center;
    max-height: 100%;
  }

  .viewer-slide img {
    max-width: 100%;
    max-height: 65vh;
    object-fit: contain;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
  }

  figcaption {
    margin-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 1.35rem;
    color: var(--text);
  }

  .points {
    font-weight: bold;
    color: var(--success);
  }

  .viewer-empty,
  .viewer-loading {
    font-size: 2rem;
    color: var(--muted);
  }

  .viewer-feed {
    margin-top: 1rem;
  }

  .viewer-ticker {
    display: flex;
    gap: 2rem;
    overflow-x: auto;
  }

  .viewer-item {
    white-space: nowrap;
    font-size: 1.1rem;
    color: var(--text);
  }

  .viewer-pts {
    color: var(--success);
    margin-left: 0.5rem;
    font-weight: bold;
  }

  .viewer-error {
    color: var(--danger);
  }
</style>
