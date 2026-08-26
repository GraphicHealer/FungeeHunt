<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;

  let state: any = null;
  let newName = '';
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
      <h1 class="fungee-title">{state.team?.name ?? 'Unnamed team'}</h1>
      <p class="fungee-subtitle" style="font-size: 1.25rem; font-weight: 600;">{formatPoints(state.team?.score ?? 0)} POINTS</p>

      {#if isManager()}
        <div style="display: flex; gap: 0.75rem; margin: 1rem 0; flex-wrap: wrap;">
          <input class="fungee-input" type="text" bind:value={newName} placeholder="Team name" style="flex: 1; margin: 0;" />
          <button class="fungee-btn" style="width: auto; margin: 0;" on:click={rename}>RENAME TEAM</button>
        </div>
      {/if}

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
              <span class="fungee-status incomplete">Offline</span>
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
  <div class="modal-backdrop" on:click={() => (showManagerInfo = false)}>
    <div class="modal" on:click|stopPropagation>
      <h3>You are the Team Captain</h3>
      <p>
        As Team Captain, your device is the one the team uses to submit photos/videos for tasks.
      </p>
      <p>
        Make sure your phone is charged and ready once the game starts. Good luck!
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
