<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from 'socket.io-client';
  import { formatPoints } from './format';

  const code = $page.params.code;

  let state: any = null;
  let remainingStr = '';
  let socket: any;
  let interval: ReturnType<typeof setInterval>;
  let showAnnouncement = false;
  let announcementMessage = '';

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  function remaining() {
    if (!state?.game) return '';
    const game = state.game;
    let target: Date | null = null;
    let label = '';
    if (game.status === 'LIVE' && game.endAt) {
      target = new Date(game.endAt);
      label = 'REMAINING';
    } else if (game.status === 'NOT_STARTED' && game.startAt) {
      target = new Date(game.startAt);
      label = 'STARTS IN';
    }
    if (!target) return game.status === 'COMPLETED' ? 'GAME OVER' : '';
    const ms = Math.max(0, target.getTime() - Date.now());
    const s = Math.floor(ms / 1000) % 60;
    const m = Math.floor(ms / 1000 / 60) % 60;
    const h = Math.floor(ms / 1000 / 60 / 60);
    return `${label} ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      state = await res.json();
      remainingStr = remaining();
    }
  }

  onMount(() => {
    load();
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on(`game:${code.toUpperCase()}`, (payload: any) => {
      if (payload?.type === 'deleted') {
        localStorage.removeItem(`token:${code}`);
        goto('/');
        return;
      }
      if (payload?.type === 'announce') {
        const matchAll = !payload.teamIds || payload.teamIds === 'all' || (Array.isArray(payload.teamIds) && payload.teamIds.length === 0);
        const matchTeam = state?.team && Array.isArray(payload.teamIds) && payload.teamIds.includes(state.team.id);
        const matchCaptain = !payload.captainsOnly || state?.player?.id === state?.team?.managerId;
        if (matchCaptain && (matchAll || matchTeam)) {
          announcementMessage = payload.message;
          showAnnouncement = true;
        }
      } else {
        load();
      }
    });
    interval = setInterval(() => {
      remainingStr = remaining();
    }, 1000);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (interval) clearInterval(interval);
  });
</script>

{#if state?.game}
  <header class="player-topbar">
    <span class="side left">{state.team?.name ?? ''}</span>
    <span class="countdown">{remainingStr}</span>
    <span class="side right">{formatPoints(state.team?.score ?? 0)} pts</span>
  </header>
{/if}

{#if showAnnouncement}
  <div class="announcement-backdrop" on:click={() => (showAnnouncement = false)}>
    <div class="announcement-modal" on:click|stopPropagation>
      <h3>Announcement</h3>
      <p>{announcementMessage}</p>
      <button class="fungee-btn" style="width: 100%;" on:click={() => (showAnnouncement = false)}>OK</button>
    </div>
  </div>
{/if}

<style>
  .player-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 3rem;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    z-index: 1000;
    box-shadow: var(--shadow);
    padding: 0 1rem;
  }

  .side {
    font-size: 0.95rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .left {
    text-align: left;
    color: var(--text);
  }

  .right {
    text-align: right;
    color: var(--success);
  }

  .countdown {
    font-size: 1.1rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    color: var(--brand);
    text-align: center;
  }

  .announcement-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    padding: 1rem;
  }

  .announcement-modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    max-width: 24rem;
    width: 100%;
    box-shadow: var(--shadow);
    text-align: center;
  }

  .announcement-modal h3 {
    margin-top: 0;
    color: var(--brand);
  }

  .announcement-modal p {
    white-space: pre-wrap;
    margin: 0 0 1rem;
  }
</style>
