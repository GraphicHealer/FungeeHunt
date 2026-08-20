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

<main class="results">
  {#if data}
    <h1>{data.game.name}</h1>
    <h2>FINAL STANDINGS</h2>

    {#if data.game.status !== 'COMPLETED'}
      <p class="note">This game is still in progress.</p>
    {/if}

    <ol class="podium">
      {#each data.leaderboard as team, i (team.id)}
        <li class="place">
          <span class="rank">{i + 1}</span>
          <span class="name">{team.name ?? 'Unnamed team'}</span>
          <span class="score">{team.score} POINTS</span>
        </li>
      {/each}
    </ol>

    <a href="/view/{code}">Back to live viewer</a>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</main>

<style>
  .results {
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: #111;
    color: #fff;
    min-height: 100vh;
  }

  h1 {
    margin-bottom: 0;
  }

  h2 {
    color: #4ade80;
    margin-top: 0.5rem;
  }

  .note {
    color: #aaa;
  }

  .podium {
    list-style: none;
    padding: 0;
    max-width: 40rem;
    margin: 2rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .place {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #1a1a1a;
    font-size: 1.25rem;
  }

  .rank {
    width: 2.5rem;
    text-align: center;
    font-weight: bold;
    font-size: 1.5rem;
  }

  .name {
    flex: 1;
  }

  .score {
    font-weight: bold;
  }

  a {
    color: #4ade80;
  }
</style>
