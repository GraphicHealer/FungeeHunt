<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { gmToken } from '$lib/gmToken';

  const gameId = $page.params.gameId;

  let teams: any[] = [];
  let players: any[] = [];
  let error = '';
  let loading = true;

  let showModal = false;
  let showAutoModal = false;
  let autoCount = '';
  let editId = '';
  let name = '';
  let managerId = '';
  let selectedMembers: string[] = [];

  function token() {
    return gmToken(gameId);
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

  function isAvailable(player: any) {
    if (!player.team) return true;
    return editId && player.team.id === editId;
  }

  function close() {
    showModal = false;
  }

  function suggestedTeamCount(total: number) {
    if (total <= 0) return 0;
    if (total <= 5) return 1;
    return Math.floor((total + 5) / 5);
  }

  function openAuto() {
    const total = players.length;
    const suggested = suggestedTeamCount(total);
    autoCount = suggested ? String(suggested) : '';
    error = '';
    showAutoModal = true;
  }

  function closeAuto() {
    showAutoModal = false;
  }

  async function autoCreate() {
    error = '';
    const res = await fetch(`/api/gm/games/${gameId}/teams/auto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ teamCount: Number(autoCount) }),
    });
    const data = await res.json();
    if (res.ok) {
      showAutoModal = false;
      await load();
    } else {
      error = data.error ?? 'Could not auto-create teams';
    }
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

  async function removeTeam() {
    if (!editId || !confirm('Delete this team?')) return;
    const res = await fetch(`/api/gm/games/${gameId}/teams/${editId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      showModal = false;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not delete team';
    }
  }

  onMount(load);
</script>

<div class="page" data-tour="teams-page">
  <header class="page-header">
    <h2 data-tour="teams-title">Teams</h2>
    <div style="display: flex; gap: 0.5rem;">
      <button class="fungee-btn secondary" on:click={openAuto} style="width: auto; margin: 0;">AUTO-CREATE</button>
      <button class="fungee-btn" data-tour="add-team" on:click={openNew} style="width: auto; margin: 0;">+ ADD TEAM</button>
    </div>
  </header>

  {#if error && !showModal}<p class="error">{error}</p>{/if}
  {#if loading}<p>Loading…</p>{/if}

  {#if !loading && teams.length === 0}
    <div class="empty-card">
      <h2>No teams yet</h2>
      <p>Would you like to auto-create teams from your players?</p>
      <button class="fungee-btn" on:click={openAuto} style="width: auto; margin: 0;">AUTO-CREATE TEAMS</button>
    </div>
  {/if}

  <ul class="team-list">
    {#each teams as team (team.id)}
      <li on:click={() => openEdit(team)}>
        <div class="team-name">{team.name ?? 'Unnamed team'}</div>
        <div class="team-meta">
          Team Captain: {team.manager?.displayName ?? '—'} · {team.members?.length ?? 0} members
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if showModal}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={save}>
        <h3>{editId ? 'Edit Team' : 'Add Team'}</h3>

        <label for="team-name">Team Name</label>
        <input id="team-name" type="text" bind:value={name} placeholder="Optional" />

        <label for="manager">Team Captain</label>
        <select id="manager" bind:value={managerId}>
          <option value="">Select Team Captain…</option>
          {#each players.filter((p) => p.type === 'APP' && isAvailable(p)) as player (player.id)}
            <option value={player.id}>{player.displayName}</option>
          {/each}
        </select>

        <p class="label">Members</p>
        <div class="members">
          {#each players.filter(isAvailable) as player (player.id)}
            <label>
              <input type="checkbox" value={player.id} bind:group={selectedMembers} />
              {player.displayName} ({player.type})
            </label>
          {/each}
        </div>

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={close}>Cancel</button>
          {#if editId}
            <button type="button" class="danger" on:click={removeTeam}>Delete</button>
          {/if}
          <button type="submit" disabled={!managerId}>Save</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if showAutoModal}
  <div class="modal-backdrop" on:click={closeAuto} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={autoCreate}>
        <h3>Auto-Create Teams</h3>

        <p style="margin: 0 0 0.75rem; color: var(--muted);">
          Each team will get one app player as Team Captain, at least one driver, and the rest will be distributed.
        </p>

        {#if players.length > 0}
          <p style="margin: 0 0 0.75rem;">
            <strong>{players.length} players</strong> — we recommend <strong>{suggestedTeamCount(players.length)} teams</strong>
            ({players.length > 0 && suggestedTeamCount(players.length) > 0
              ? `about ${Math.round(players.length / suggestedTeamCount(players.length))} per team`
              : ''})
          </p>
        {/if}

        <label for="auto-count">Number of teams</label>
        <input id="auto-count" type="number" min="1" bind:value={autoCount} placeholder="How many teams?" />

        {#if error}<p class="error">{error}</p>{/if}

        <div class="actions">
          <button type="button" on:click={closeAuto}>Cancel</button>
          <button type="submit" disabled={!autoCount || Number(autoCount) < 1}>Create</button>
        </div>
      </form>
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
    transition: box-shadow 0.15s, transform 0.15s;
  }

  .team-list li:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
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

  .members input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
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

  .actions button.danger {
    background: var(--danger);
    color: #fff;
  }

  .actions button:disabled {
    background: var(--border);
    cursor: not-allowed;
  }

  .empty-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 2rem;
    text-align: center;
    margin-bottom: 1rem;
  }

  .empty-card h2 {
    margin: 0 0 0.5rem;
  }

  .empty-card p {
    color: var(--muted);
    margin: 0 0 1.5rem;
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
