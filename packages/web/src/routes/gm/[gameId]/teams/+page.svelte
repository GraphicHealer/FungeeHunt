<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let teams: any[] = [];
  let players: any[] = [];
  let error = '';
  let loading = true;

  let showModal = false;
  let editId = '';
  let name = '';
  let managerId = '';
  let selectedMembers: string[] = [];

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    loading = true;
    error = '';
    const [tRes, pRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}/teams`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`/api/gm/games/${gameId}/players`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (tRes.ok) teams = await tRes.json();
    else error = 'Could not load teams';
    if (pRes.ok) players = await pRes.json();
    else error = 'Could not load players';
    loading = false;
  }

  function openNew() {
    editId = '';
    name = '';
    managerId = '';
    selectedMembers = [];
    error = '';
    showModal = true;
  }

  function openEdit(team: any) {
    editId = team.id;
    name = team.name ?? '';
    managerId = team.managerId ?? '';
    selectedMembers = (team.members ?? []).map((m: any) => m.id);
    error = '';
    showModal = true;
  }

  function close() {
    showModal = false;
  }

  async function save() {
    error = '';
    const url = editId
      ? `/api/gm/games/${gameId}/teams/${editId}`
      : `/api/gm/games/${gameId}/teams`;
    const method = editId ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ name, managerId, memberIds: selectedMembers }),
    });
    const data = await res.json();
    if (res.ok) {
      showModal = false;
      await load();
    } else {
      error = data.error ?? 'Could not save team';
    }
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Teams</h2>
    <button on:click={openNew}>+ ADD TEAM</button>
  </header>

  {#if error && !showModal}<p class="error">{error}</p>{/if}
  {#if loading}<p>Loading…</p>{/if}

  <ul class="team-list">
    {#each teams as team (team.id)}
      <li on:click={() => openEdit(team)}>
        <div class="team-name">{team.name ?? 'Unnamed team'}</div>
        <div class="team-meta">
          Manager: {team.manager?.displayName ?? '—'} · {team.members?.length ?? 0} members
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <h3>{editId ? 'Edit Team' : 'Add Team'}</h3>

      <label for="team-name">Team Name</label>
      <input id="team-name" type="text" bind:value={name} placeholder="Optional" />

      <label for="manager">Manager</label>
      <select id="manager" bind:value={managerId}>
        <option value="">Select manager…</option>
        {#each players.filter((p) => p.type === 'APP') as player (player.id)}
          <option value={player.id}>{player.displayName}</option>
        {/each}
      </select>

      <p class="label">Members</p>
      <div class="members">
        {#each players as player (player.id)}
          <label>
            <input type="checkbox" value={player.id} bind:group={selectedMembers} />
            {player.displayName} ({player.type})
          </label>
        {/each}
      </div>

      {#if error}<p class="error">{error}</p>{/if}

      <div class="actions">
        <button on:click={close}>Cancel</button>
        <button on:click={save} disabled={!managerId}>Save</button>
      </div>
    </div>
  </div>
{/if}

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

  .team-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .team-list li {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }

  .team-list li:hover {
    box-shadow: var(--shadow);
  }

  .team-name {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .team-meta {
    color: var(--muted);
    margin-top: 0.25rem;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--card);
    border-radius: 0.75rem;
    padding: 2rem;
    width: 90%;
    max-width: 28rem;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
  }

  .modal h3 {
    margin-top: 0;
  }

  .modal input,
  .modal select {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 0.75rem;
  }

  .label {
    font-weight: bold;
    margin: 0.5rem 0 0.25rem;
  }

  .members {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
    max-height: 12rem;
    overflow-y: auto;
    border: 1px solid var(--border);
    padding: 0.5rem;
  }

  .members label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0;
    cursor: pointer;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .actions button {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
    border: none;
    border-radius: 0.25rem;
    background: var(--brand);
    color: #fff;
  }

  .actions button:first-child {
    background: var(--bg);
    color: var(--text);
  }

  .actions button:disabled {
    background: var(--border);
    cursor: not-allowed;
  }

  .error {
    color: var(--danger);
  }

  button {
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
