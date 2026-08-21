<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let data: any = null;
  let error = '';

  async function load() {
    const res = await fetch(`/api/view/${code}`);
    if (res.ok) {
      data = await res.json();
    } else {
      error = 'Could not load results';
    }
  }

  onMount(load);
</script>

<main class="fungee-page">
  <div class="fungee-card wide">
    <a class="fungee-link" href="/view/{code}">← Back to live viewer</a>

    {#if data}
      <h1 class="fungee-title">{data.game.name}</h1>
      <h2 class="fungee-subtitle" style="color: var(--success);">FINAL STANDINGS</h2>

      {#if data.game.status !== 'COMPLETED'}
        <p style="color: var(--muted);">This game is still in progress.</p>
      {/if}

      <ol class="podium">
        {#each data.leaderboard as team, i (team.id)}
          <li class="fungee-list-item" style="display: flex; align-items: center; gap: 1rem; font-size: 1.25rem;">
            <span class="rank">{i + 1}</span>
            <span class="name" style="flex: 1;">{team.name ?? 'Unnamed team'}</span>
            <span class="score" style="font-weight: bold; color: var(--success);">{team.score} POINTS</span>
          </li>
        {/each}
      </ol>
    {:else if error}
      <p class="fungee-error">{error}</p>
    {:else}
      <p>Loading…</p>
    {/if}
  </div>
</main>

<style>
  .podium {
    list-style: none;
    padding: 0;
    margin: 1.5rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rank {
    width: 2.5rem;
    text-align: center;
    font-weight: bold;
    color: var(--brand);
    font-size: 1.5rem;
  }
</style>
