<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;

  let state: any = null;
  let newName = '';
  let editing = false;
  let error = '';
  let showManagerInfo = false;
  let socket: any;

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  function isManager() {
    return state && state.team && state.player.id === state.team.managerId;
  }

  function maybeShowManagerInfo() {
    if (state && isManager() && state.game?.status === 'LIVE') {
      const key = `managerInfo:${code}`;
      if (!localStorage.getItem(key)) {
        showManagerInfo = true;
        localStorage.setItem(key, 'true');
      }
    }
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      state = await res.json();
      if (state.game?.status === 'COMPLETED') {
        goto(`/play/${code}`);
        return;
      }
      newName = state.team?.name ?? '';
      maybeShowManagerInfo();
    } else {
      error = 'Could not load team';
    }
  }

  async function rename() {
    error = '';
    const res = await fetch(`/api/play/${code}/team`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ name: newName }),
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

<main class="fungee-page" style="padding-top: 3rem; padding-bottom: 8rem;">
  <div class="fungee-card wide">
    {#if state}
      {#if isManager() && editing}
        <form class="team-name" on:submit|preventDefault={rename} style="display: flex; gap: 0.5rem; align-items: center; margin: 0 0 0.5rem;">
          <input class="fungee-input" type="text" bind:value={newName} placeholder="Team name" style="flex: 1; margin: 0;" />
          <button class="fungee-btn" style="width: auto; margin: 0;" type="submit" title="Save team name">
            <span class="mdi mdi-check"></span>
          </button>
          <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={() => { editing = false; newName = state.team?.name ?? ''; }} title="Cancel">
            <span class="mdi mdi-close"></span>
          </button>
        </form>
      {:else}
        <div class="team-title" style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 0 0 0.5rem;">
          <h1 class="fungee-title" style="margin: 0;">{state.team?.name ?? 'Unnamed team'}</h1>
          {#if isManager()}
            <button class="fungee-btn" style="width: auto; margin: 0; padding: 0.4rem 0.6rem;" on:click={() => { editing = true; newName = state.team?.name ?? ''; }} title="Rename team">
              <span class="mdi mdi-pencil"></span>
            </button>
          {/if}
        </div>
      {/if}
      <p class="fungee-subtitle" style="font-size: 1.25rem; font-weight: 600;">{formatPoints(state.team?.score ?? 0)} POINTS</p>

      {#if error}<p class="fungee-error">{error}</p>{/if}

      <h2 class="fungee-section-title">Members</h2>
      <ul class="fungee-list">
        {#each state.team?.members ?? [] as member (member.id)}
          <li class="fungee-list-item" style="display: flex; justify-content: space-between; align-items: center;">
            <span>
              {#if member.id === state.team?.managerId}
                <span style="font-weight: bold;"><span class="mdi mdi-star" style="color: var(--warning);"></span> {member.displayName}</span>
              {:else}
                {member.displayName}
              {/if}
            </span>
            {#if member.id === state.team?.managerId}
              <span class="fungee-status">Team Captain</span>
            {:else if member.type === 'OFFLINE'}
              <span class="mdi mdi-cellphone-off" style="color: var(--muted);" title="No phone"></span>
            {/if}
          </li>
        {/each}
      </ul>
    {:else if error}
      <p class="fungee-error">{error}</p>
    {:else}
      <p>Loading…</p>
    {/if}
  </div>
</main>

{#if showManagerInfo}
  <div class="modal-backdrop" on:click={() => (showManagerInfo = false)} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <h3>You are the Team Captain</h3>
      <p>
        As Team Captain, your device is the one the team uses to submit photos/videos for tasks.
      </p>
      <p>
        Make sure your phone is charged and ready once the game starts. Good luck!
      </p>
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0; font-size: 2.5rem; color: var(--brand);">
        <span class="mdi mdi-camera"></span>
        <span class="mdi mdi-arrow-right"></span>
        <span class="mdi mdi-send"></span>
      </div>
      <p style="font-size: 0.9rem; color: var(--muted); text-align: center;">
        After taking a photo, tap <strong>Submit</strong>.
      </p>
      <button class="fungee-btn" style="width: 100%; margin-top: 1rem;" on:click={() => (showManagerInfo = false)}>GOT IT</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
    padding: 1rem;
  }

  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    max-width: 22rem;
    width: 100%;
    box-shadow: var(--shadow);
  }

  .modal h3 {
    margin-top: 0;
  }
</style>
