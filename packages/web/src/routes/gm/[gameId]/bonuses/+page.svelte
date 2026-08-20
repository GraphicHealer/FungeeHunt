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

<main class="container">
  <h1>BONUSES</h1>

  {#if game}
    <section>
      <h2>Return Time Bonus</h2>
      {#if game.returnBonusEnabled}
        <p>Window: {game.returnStart} — {game.returnEnd} (+{game.returnPoints})</p>
        <ul>
          {#each teams as team (team.id)}
            <li>
              {team.name ?? 'Unnamed team'}
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

    <section>
      <h2>Food Drive Bonus</h2>
      {#if game.foodDriveEnabled}
        <p>{game.foodDrivePointsPerItem} points per item</p>
        <ul>
          {#each teams as team (team.id)}
            <li>
              {team.name ?? 'Unnamed team'}
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
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  section {
    margin-bottom: 2rem;
  }

  ul {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  input {
    width: 4rem;
  }

  .awarded {
    color: green;
    font-weight: bold;
  }
</style>
