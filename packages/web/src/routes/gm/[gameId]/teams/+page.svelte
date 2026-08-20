<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let teams: any[] = [];
  let players: any[] = [];
  let name = '';
  let managerId = '';
  let selectedMembers: string[] = [];

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const [tRes, pRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}/teams`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`/api/gm/games/${gameId}/players`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (tRes.ok) teams = await tRes.json();
    if (pRes.ok) players = await pRes.json();
  }

  async function addTeam() {
    const res = await fetch(`/api/gm/games/${gameId}/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ name, managerId, memberIds: selectedMembers }),
    });
    if (res.ok) {
      name = '';
      managerId = '';
      selectedMembers = [];
      await load();
    }
  }

  onMount(load);
</script>

<main class="container">
  <h1>TEAMS</h1>

  <section class="form">
    <input type="text" bind:value={name} placeholder="Team name (optional)" />
    <select bind:value={managerId}>
      <option value="">Select Manager (App only)</option>
      {#each players.filter((p) => p.type === 'APP') as player (player.id)}
        <option value={player.id}>{player.displayName}</option>
      {/each}
    </select>

    <div class="members">
      <p>Members:</p>
      {#each players as player (player.id)}
        <label>
          <input
            type="checkbox"
            value={player.id}
            bind:group={selectedMembers}
          />
          {player.displayName} ({player.type})
        </label>
      {/each}
    </div>

    <button on:click={addTeam} disabled={!managerId}>CREATE TEAM</button>
  </section>

  <ul>
    {#each teams as team (team.id)}
      <li>{team.name ?? 'Unnamed team'} — Manager: {team.manager?.displayName ?? '—'} ({team.members?.length ?? 0} members)</li>
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
    flex-direction: column;
    gap: 0.5rem;
    max-width: 24rem;
    margin-bottom: 1rem;
  }

  .members {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>
