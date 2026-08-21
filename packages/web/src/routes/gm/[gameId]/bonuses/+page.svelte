<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let teams: any[] = [];
  let foodDrive: Record<string, number> = {};
  let modal: 'return' | 'food' | null = null;
  let saving = false;
  let error = '';

  let retEnabled = false;
  let retWindow = 10;
  let retPoints = 100;
  let fdEnabled = false;
  let fdPoints = 1;
  let fdPermissible = '';
  let fdSuggested = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  function toInputValue(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fmtTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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

  function openReturn() {
    if (!game) return;
    modal = 'return';
    retEnabled = game.returnBonusEnabled ?? false;
    const start = game.returnStart ? new Date(game.returnStart).getTime() : new Date(game.endAt).getTime() - 10 * 60 * 1000;
    const end = game.returnEnd ? new Date(game.returnEnd).getTime() : new Date(game.endAt).getTime();
    retWindow = Math.max(1, Math.round((end - start) / 60000));
    retPoints = game.returnPoints ?? 100;
  }

  function openFood() {
    if (!game) return;
    modal = 'food';
    fdEnabled = game.foodDriveEnabled ?? false;
    fdPoints = game.foodDrivePointsPerItem ?? 1;
    fdPermissible = game.foodDrivePermissible ?? '';
    fdSuggested = game.foodDriveSuggested ?? '';
  }

  function close() {
    modal = null;
    error = '';
  }

  async function saveReturn() {
    if (!game?.endAt) return;
    saving = true;
    error = '';
    const end = new Date(game.endAt);
    const start = new Date(end.getTime() - retWindow * 60 * 1000);
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        returnBonusEnabled: retEnabled,
        returnStart: toInputValue(start),
        returnEnd: toInputValue(end),
        returnPoints: retPoints,
      }),
    });
    saving = false;
    if (res.ok) {
      close();
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not save return bonus';
    }
  }

  async function saveFood() {
    saving = true;
    error = '';
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        foodDriveEnabled: fdEnabled,
        foodDrivePointsPerItem: fdPoints,
        foodDrivePermissible: fdPermissible,
        foodDriveSuggested: fdSuggested,
      }),
    });
    saving = false;
    if (res.ok) {
      close();
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Could not save food drive';
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
    <button class="section-card" on:click={openReturn}>
      <h3 class="fungee-section-title" style="margin: 0;">Return Time Bonus</h3>
      {#if game.returnBonusEnabled}
        <p class="window">Window: {fmtTime(game.returnStart)} — {fmtTime(game.returnEnd)} (+{game.returnPoints} points)</p>
      {:else}
        <p class="window">Return Time Bonus is not enabled for this game.</p>
      {/if}
      <p class="hint">Click to edit</p>
    </button>

    <button class="section-card" on:click={openFood}>
      <h3 class="fungee-section-title" style="margin: 0;">Food Drive</h3>
      {#if game.foodDriveEnabled}
        <p class="window">{game.foodDrivePointsPerItem} points per eligible item</p>
        <p class="window">{game.foodDrivePermissible || 'No permissible items set'}</p>
      {:else}
        <p class="window">Food Drive is not enabled for this game.</p>
      {/if}
      <p class="hint">Click to edit</p>
    </button>

    <section class="card" style="margin-top: 1.5rem;">
      <h3>Return Time Bonus Tracking</h3>
      <ul>
        {#each teams as team (team.id)}
          <li>
            <span class="team-name">{team.name ?? 'Unnamed team'}</span>
            {#if team.returnBonusAwarded}
              <span class="awarded"><span class="mdi mdi-check"></span> Returned at {fmtTime(team.returnedAt)}</span>
            {:else}
              <button class="fungee-btn" style="width: auto; margin: 0;" on:click={() => markReturn(team.id)}>MARK RETURNED</button>
            {/if}
          </li>
        {/each}
      </ul>
    </section>

    <section class="card">
      <h3>Food Drive Tracking</h3>
      <ul>
        {#each teams as team (team.id)}
          <li>
            <span class="team-name">{team.name ?? 'Unnamed team'}</span>
            <input class="fungee-input" type="number" bind:value={foodDrive[team.id]} min="0" style="width: 5rem;" />
            <button class="fungee-btn" style="width: auto; margin: 0;" on:click={() => saveFoodDrive(team.id)}>SAVE</button>
            {#if team.foodDriveBonusAwarded}
              <span class="awarded"><span class="mdi mdi-check"></span></span>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</div>

{#if modal === 'return'}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal fungee-card" on:click|stopPropagation>
      <h3 class="fungee-section-title" style="margin: 0 0 1rem;">Return Time Bonus</h3>
      <label class="fungee-check">
        <input type="checkbox" bind:checked={retEnabled} />
        Enable return bonus
      </label>

      {#if retEnabled}
        <label class="fungee-label" for="rw">Window Length (minutes)</label>
        <input class="fungee-input" id="rw" type="number" bind:value={retWindow} min="1" />
        <label class="fungee-label" for="rp">Points</label>
        <input class="fungee-input" id="rp" type="number" step="0.1" bind:value={retPoints} min="0" />
      {/if}

      {#if error}<p class="fungee-error">{error}</p>{/if}

      <div class="fungee-btn-row" style="margin-top: 1rem;">
        <button class="fungee-btn secondary" on:click={close} disabled={saving}>CANCEL</button>
        <button class="fungee-btn" on:click={saveReturn} disabled={saving}>SAVE</button>
      </div>
    </div>
  </div>
{/if}

{#if modal === 'food'}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal fungee-card" on:click|stopPropagation>
      <h3 class="fungee-section-title" style="margin: 0 0 1rem;">Food Drive</h3>
      <label class="fungee-check">
        <input type="checkbox" bind:checked={fdEnabled} />
        Enable food drive
      </label>

      {#if fdEnabled}
        <label class="fungee-label" for="fdpp">Points Per Item</label>
        <input class="fungee-input" id="fdpp" type="number" step="0.1" bind:value={fdPoints} min="0" />
        <label class="fungee-label" for="fdperm">Permissible Items</label>
        <textarea class="fungee-textarea" id="fdperm" bind:value={fdPermissible} placeholder="Cans, boxes, etc."></textarea>
        <label class="fungee-label" for="fdsug">Suggested Items</label>
        <textarea class="fungee-textarea" id="fdsug" bind:value={fdSuggested} placeholder="Peanut butter, soup, etc."></textarea>
      {/if}

      {#if error}<p class="fungee-error">{error}</p>{/if}

      <div class="fungee-btn-row" style="margin-top: 1rem;">
        <button class="fungee-btn secondary" on:click={close} disabled={saving}>CANCEL</button>
        <button class="fungee-btn" on:click={saveFood} disabled={saving}>SAVE</button>
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

  .section-card {
    width: 100%;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin-bottom: 0.75rem;
    cursor: pointer;
    text-align: left;
    transition: box-shadow 0.15s;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .section-card:hover {
    box-shadow: var(--shadow);
  }

  .window {
    margin: 0;
    color: var(--muted);
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: var(--brand);
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
  }

  .card h3 {
    margin-top: 0;
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
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    flex-wrap: wrap;
  }

  .team-name {
    flex: 1;
    font-weight: bold;
  }

  .awarded {
    color: var(--success);
    font-weight: bold;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    width: 100%;
    max-width: 40rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
