<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';

  const code = $page.params.code;

  let state: any = null;
  let status = 'Checking game state…';
  let editing = false;
  let newName = '';
  let error = '';
  let socket: any;

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  function isManager() {
    return state && state.team && state.player.id === state.team.managerId;
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      state = await res.json();
      if (state.game?.status === 'LIVE' && state.team) {
        goto(`/play/${code}/tasks`);
        return;
      }
      if (state.game?.status === 'COMPLETED') {
        goto(`/play/${code}`);
        return;
      }
      status = state.team ? (state.game?.status === 'LIVE' ? 'You have not been assigned to a team yet' : 'Game not started yet') : 'Waiting for the Game Master to assign you to a team…';
      newName = state.team?.name ?? '';
    } else if (res.status === 404) {
      goto('/?notfound=1');
      return;
    } else {
      const data = await res.json().catch(() => ({}));
      status = data.error ?? 'Could not load game state.';
    }
  }

  async function rename() {
    error = '';
    if (!newName.trim()) return;
    const res = await fetch(`/api/play/${code}/team`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      editing = false;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not rename team';
    }
  }

  onMount(() => {
    load();
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on(`game:${code.toUpperCase()}`, load);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
  });
</script>

<main class="fungee-page">
  <div class="fungee-card wide">
    <h1 class="fungee-title">GAME PENDING</h1>
    <p class="fungee-code">{code}</p>

    {#if state}
      {#if !state.team}
        <p class="fungee-subtitle">No team yet</p>
        <p>{status}</p>
      {:else}
        <div class="team-name">
          {#if editing}
            <form class="team-name" on:submit|preventDefault={rename}>
              <input class="fungee-input" type="text" bind:value={newName} placeholder="Team name" style="flex: 1; margin: 0;" />
              <button class="fungee-btn" style="width: auto; margin: 0;" type="submit">
                <span class="mdi mdi-check"></span>
              </button>
              <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={() => { editing = false; newName = state.team?.name ?? ''; }}>
                <span class="mdi mdi-close"></span>
              </button>
            </form>
          {:else}
            <h2 class="fungee-section-title" style="margin: 0;">{state.team.name ?? 'Unnamed team'}</h2>
            {#if isManager()}
              <button class="edit" on:click={() => { editing = true; }} title="Rename team">
                <span class="mdi mdi-pencil"></span>
              </button>
            {/if}
          {/if}
        </div>

        {#if error}<p class="fungee-error">{error}</p>{/if}

        <p>{status}</p>

        <h3 class="fungee-section-title" style="margin-top: 1.5rem;">Members</h3>
        <ul class="fungee-list">
          {#each state.team?.members ?? [] as member (member.id)}
            <li class="fungee-list-item" style="display: flex; justify-content: space-between; align-items: center;">
              <span>
                {#if member.id === state.team?.managerId}
                  <span class="mdi mdi-star" style="color: var(--warning);"></span>
                {/if}
                {member.displayName}{#if member.id === state.player.id}<span style="color: var(--muted);"> (You)</span>{/if}
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    {:else}
      <p>{status}</p>
    {/if}
  </div>
</main>

<style>
  .team-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .edit {
    background: none;
    border: none;
    color: var(--brand);
    font-size: 1.25rem;
    cursor: pointer;
  }
</style>
