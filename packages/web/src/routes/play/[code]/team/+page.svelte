<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let state: any = null;
  let newName = '';
  let error = '';

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
      newName = state.team?.name ?? '';
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

  onMount(load);
</script>

<main class="fungee-page">
  <div class="fungee-card wide">
    <a class="fungee-link" href="/play/{code}/tasks">← Back to tasks</a>

    {#if state}
      <h1 class="fungee-title">{state.team?.name ?? 'Unnamed team'}</h1>
      <p class="fungee-subtitle" style="font-size: 1.25rem; font-weight: 600;">{state.team?.score ?? 0} POINTS</p>

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
              <span class="fungee-status">Manager</span>
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
