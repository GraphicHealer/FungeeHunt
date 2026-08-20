<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let players: any[] = [];
  let displayName = '';
  let reissued: Record<string, string> = {};

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/players`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) players = await res.json();
  }

  async function addOffline() {
    const res = await fetch(`/api/gm/games/${gameId}/players/offline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ displayName }),
    });
    if (res.ok) {
      displayName = '';
      await load();
    }
  }

  async function reissue(playerId: string) {
    const res = await fetch(`/api/gm/games/${gameId}/players/${playerId}/reissue`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const data = await res.json();
      reissued[playerId] = data.joinUrl;
      reissued = reissued;
      await load();
    }
  }

  onMount(load);
</script>

<main class="container">
  <h1>PLAYERS</h1>

  <section class="form">
    <input type="text" bind:value={displayName} placeholder="Offline player name" />
    <button on:click={addOffline} disabled={!displayName}>ADD OFFLINE PLAYER</button>
  </section>

  <ul>
    {#each players as player (player.id)}
      <li>
        <span>{player.displayName} — {player.type}</span>
        {#if player.team}<span class="team">({player.team.name})</span>{/if}
        {#if player.type === 'APP'}
          <button on:click={() => reissue(player.id)}>REISSUE JOIN LINK</button>
        {/if}
        {#if reissued[player.id]}
          <span class="link">{reissued[player.id]}</span>
        {/if}
      </li>
    {/each}
  </ul>
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .form {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
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

  .team {
    color: #666;
  }

  .link {
    color: #0366d6;
    font-size: 0.9rem;
  }
</style>
