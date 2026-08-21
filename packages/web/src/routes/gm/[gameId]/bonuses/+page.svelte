<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let teams: any[] = [];
  let foodDrive: Record<string, number> = {};

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const [gRes, tRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`/api/gm/games/${gameId}/teams`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (gRes.ok) game = await gRes.json();
    if (tRes.ok) {
      teams = await tRes.json();
      for (const t of teams) {
        foodDrive[t.id] = t.foodDriveItems ?? 0;
      }
    }
  }

  async function markReturn(teamId: string) {
    const res = await fetch(`/api/gm/games/${gameId}/bonuses/return/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
    });
    if (res.ok) await load();
  }

  async function saveFoodDrive(teamId: string) {
    const res = await fetch(`/api/gm/games/${gameId}/bonuses/food-drive/${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ items: foodDrive[teamId] }),
    });
    if (res.ok) await load();
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Bonuses</h2>
  </header>

  {#if game}
    <section class="card">
      <h3>Return Time Bonus</h3>
      {#if game.returnBonusEnabled}
        <p class="window">Window: {game.returnStart} — {game.returnEnd} (+{game.returnPoints})</p>
        <ul>
          {#each teams as team (team.id)}
            <li>
              <span class="team-name">{team.name ?? 'Unnamed team'}</span>
              {#if team.returnBonusAwarded}
                <span class="awarded">✓ Returned at {team.returnedAt}</span>
              {:else}
                <button on:click={() => markReturn(team.id)}>MARK RETURNED</button>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p>Return Time Bonus is not enabled for this game.</p>
      {/if}
    </section>

    <section class="card">
      <h3>Food Drive Bonus</h3>
      {#if game.foodDriveEnabled}
        <p class="window">{game.foodDrivePointsPerItem} points per item</p>
        <ul>
          {#each teams as team (team.id)}
            <li>
              <span class="team-name">{team.name ?? 'Unnamed team'}</span>
              <input type="number" bind:value={foodDrive[team.id]} min="0" />
              <button on:click={() => saveFoodDrive(team.id)}>SAVE</button>
              {#if team.foodDriveBonusAwarded}
                <span class="awarded">✓</span>
              {/if}
            </li>
          {/each}
        </ul>
      {:else}
        <p>Food Drive Bonus is not enabled for this game.</p>
      {/if}
    </section>
  {/if}
</div>

<style>
  .page {
    font-family: system-ui, sans-serif;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .page-header h2 {
    margin: 0;
  }

  .card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .card h3 {
    margin-top: 0;
  }

  .window {
    color: #666;
  }

  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid #eee;
    border-radius: 0.25rem;
  }

  .team-name {
    flex: 1;
    font-weight: bold;
  }

  input {
    width: 4rem;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
  }

  .awarded {
    color: green;
    font-weight: bold;
  }
</style>
