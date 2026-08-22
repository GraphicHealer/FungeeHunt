<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';

  const gameId = $page.params.gameId;

  let game: any = null;
  let socket: any;
  let remainingStr = '';
  let interval: ReturnType<typeof setInterval>;

  const nav = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Players', path: 'players' },
    { label: 'Teams', path: 'teams' },
    { label: 'Tasks', path: 'tasks' },
    { label: 'Submissions', path: 'submissions' },
    { label: 'Bonuses', path: 'bonuses' },
    { label: 'Rules', path: 'rules' },
    { label: 'Settings', path: 'settings' },
  ];

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) game = await res.json();
  }

  function remaining() {
    if (!game || !game.endAt) return '';
    const target = game.status === 'NOT_STARTED' ? new Date(game.startAt) : new Date(game.endAt);
    const ms = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 1000 / 60) % 60;
    const h = Math.floor(ms / 1000 / 60 / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  onMount(async () => {
    await load();
    remainingStr = remaining();
    if (game?.code) {
      socket = io({ transports: ['websocket', 'polling'] });
      socket.on(`game:${game.code.toUpperCase()}`, load);
    }
    interval = setInterval(() => {
      remainingStr = remaining();
    }, 1000);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (interval) clearInterval(interval);
  });

  $: active = $page.url.pathname.split('/').pop() ?? '';

  function fmtTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="layout">
  <aside class="sidebar">
    <a class="home" href="/gm">← Game Board</a>
    <nav>
      {#each nav as item (item.path)}
        <a
          class="item"
          class:active={active === item.path}
          href={`/gm/${gameId}/${item.path}`}
        >
          {item.label}
        </a>
      {/each}
    </nav>
  </aside>

  <main class="main">
    <header class="topbar">
      {#if game}
        <div class="title">
          <h1>{game.name}</h1>
          <span class="code">{game.code}</span>
          <span class="status">{game.status}</span>
        </div>
        <div class="countdown">{remainingStr}</div>
        <div class="topbar-actions">
          <div class="timer">
            {#if game.startAt && game.endAt}
              <span>{fmtTime(game.startAt)} – {fmtTime(game.endAt)}</span>
            {/if}
          </div>
          <a class="spectator" href={game.viewUrl} target="_blank" rel="noreferrer" title="Open spectator screen">
            <span class="mdi mdi-open-in-new"></span>
            <span class="label">SPECTATOR</span>
          </a>
        </div>
      {:else}
        <h1>Loading…</h1>
      {/if}
    </header>
    <div class="content">
      <slot />
    </div>
  </main>
</div>

<style>
  .layout {
    display: flex;
    min-height: 100vh;
    font-family: system-ui, sans-serif;
  }

  .sidebar {
    width: 14rem;
    background: #1a1a2e;
    color: #fff;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .home {
    color: #fff;
    text-decoration: none;
    font-weight: bold;
    padding: 0.5rem;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .item {
    color: #fff;
    text-decoration: none;
    padding: 0.75rem 1rem;
    border-radius: 0.25rem;
    transition: background 0.15s;
  }

  .item:hover,
  .item.active {
    background: #16213e;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--bg);
  }

  .topbar {
    position: relative;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .topbar h1 {
    margin: 0;
    font-size: 1.25rem;
  }

  .code {
    font-family: monospace;
    letter-spacing: 0.15rem;
    color: var(--muted);
  }

  .status {
    font-weight: bold;
    color: var(--brand);
  }

  .timer {
    color: var(--muted);
  }

  .countdown {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 1.5rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .spectator {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--text);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .spectator .mdi {
    font-size: 1.25rem;
  }

  .spectator:hover {
    color: var(--brand);
  }

  .content {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
  }
</style>
