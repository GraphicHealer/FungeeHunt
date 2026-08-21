<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let game: any = null;

  const nav = [
    { label: 'Dashboard', path: 'dashboard' },
    { label: 'Players', path: 'players' },
    { label: 'Teams', path: 'teams' },
    { label: 'Tasks', path: 'tasks' },
    { label: 'Submissions', path: 'submissions' },
    { label: 'Bonuses', path: 'bonuses' },
    { label: 'Rules', path: 'rules' },
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

  onMount(load);

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
        <div class="timer">
          {#if game.startAt && game.endAt}
            <span>{fmtTime(game.startAt)} – {fmtTime(game.endAt)}</span>
          {/if}
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

  .content {
    padding: 1.5rem;
    flex: 1;
    overflow-y: auto;
  }
</style>
