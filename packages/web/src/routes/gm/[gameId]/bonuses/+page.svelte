<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { gmToken } from '$lib/gmToken';

  const gameId = $page.params.gameId;

  let game: any = null;
  let modal: 'return' | 'food' | 'bonus' | null = null;
  let saving = false;
  let error = '';

  let retEnabled = false;
  let retStartTime = '';
  let retWindow = 10;
  let retPoints = 100;
  let fdEnabled = false;
  let fdPoints = 1;
  let fdPermissible = '';
  let fdSuggested = '';

  let allTasks: any[] = [];
  let defaultTasks: any[] = [];
  let bonusEnabled = false;
  let bonusStart = '';
  let bonusEnd = '';
  let bonusMode: 'built-in' | 'custom' = 'built-in';
  let bonusBuiltInIndex = 0;
  let bonusTaskId = '';
  let customTitle = '';
  let customDescription = '';
  let customPoints = 10;
  let customProofType = 'PHOTO';
  let customPhotoCount: number | null = null;

  function token() {
    return gmToken(gameId);
  }

  function toInputValue(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromInputValue(v: string) {
    return new Date(v);
  }

  function gameDate() {
    if (!game?.endAt) return '';
    return toInputValue(new Date(game.endAt)).slice(0, 10);
  }

  function fmtTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) game = await res.json();
  }

  async function loadTasks() {
    const res = await fetch(`/api/gm/games/${gameId}/tasks`, { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) allTasks = (await res.json()).filter((t: any) => t.isBonus || !t.isBonus);
  }

  async function loadDefaults() {
    const res = await fetch('/api/gm/settings', { headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) {
      const s = await res.json();
      defaultTasks = s.defaultTasks ?? [];
    }
  }

  function openReturn() {
    if (!game) return;
    modal = 'return';
    retEnabled = game.returnBonusEnabled ?? false;
    retPoints = game.returnPoints ?? 100;
    const end = fromInputValue(`${gameDate()}T${toInputValue(new Date(game.endAt)).slice(11, 16)}`);
    if (game.returnStart && game.returnEnd) {
      retStartTime = toInputValue(new Date(game.returnStart)).slice(11, 16);
      retWindow = Math.max(1, Math.round((new Date(game.returnEnd).getTime() - new Date(game.returnStart).getTime()) / 60000));
    } else {
      retWindow = 10;
      const start = new Date(end.getTime() - retWindow * 60 * 1000);
      retStartTime = toInputValue(start).slice(11, 16);
    }
  }

  function openFood() {
    if (!game) return;
    modal = 'food';
    fdEnabled = game.foodDriveEnabled ?? false;
    fdPoints = game.foodDrivePointsPerItem ?? 1;
    fdPermissible = game.foodDrivePermissible ?? '';
    fdSuggested = game.foodDriveSuggested ?? '';
  }

  async function openBonus() {
    if (!game) return;
    await Promise.all([loadTasks(), loadDefaults()]);
    modal = 'bonus';
    bonusEnabled = !!game.bonusStart && !!game.bonusEnd;
    bonusStart = game.bonusStart ? toInputValue(new Date(game.bonusStart)).slice(11, 16) : '';
    bonusEnd = game.bonusEnd ? toInputValue(new Date(game.bonusEnd)).slice(11, 16) : '';

    const existing = allTasks.find((t: any) => t.isBonus);
    if (existing) {
      bonusTaskId = existing.id;
      const match = defaultTasks.findIndex((t: any) => t.title.trim().toLowerCase() === existing.title.trim().toLowerCase());
      if (match >= 0) {
        bonusMode = 'built-in';
        bonusBuiltInIndex = match;
      } else {
        bonusMode = 'custom';
        customTitle = existing.title;
        customDescription = existing.description ?? '';
        customPoints = existing.points;
        customProofType = existing.proofType;
        customPhotoCount = existing.photoCount ?? null;
      }
    } else {
      bonusMode = 'built-in';
      bonusBuiltInIndex = 0;
      bonusTaskId = '';
      customTitle = '';
      customDescription = '';
      customPoints = 10;
      customProofType = 'PHOTO';
      customPhotoCount = null;
    }
  }

  async function saveBonus() {
    saving = true;
    error = '';

    const date = gameDate();
    const start = bonusEnabled && date && bonusStart ? toInputValue(fromInputValue(`${date}T${bonusStart}`)) : null;
    const end = bonusEnabled && date && bonusEnd ? toInputValue(fromInputValue(`${date}T${bonusEnd}`)) : null;
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ bonusStart: start, bonusEnd: end }),
    });
    if (!res.ok) {
      saving = false;
      const data = await res.json();
      error = data.error ?? 'Could not save bonus window';
      return;
    }

    if (bonusEnabled) {
      const existingIds = allTasks.filter((t: any) => t.isBonus).map((t: any) => t.id);
      for (const id of existingIds) {
        await fetch(`/api/gm/games/${gameId}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      }

      const builtIn = defaultTasks[bonusBuiltInIndex];
      const body = bonusMode === 'built-in' && builtIn
        ? {
            title: builtIn.title,
            description: builtIn.description ?? '',
            points: Number(builtIn.points) || 0,
            proofType: builtIn.proofType ?? 'PHOTO',
            photoCount: builtIn.photoCount ?? null,
            category: 'Bonus',
            isBonus: true,
            order: 0,
          }
        : {
            title: customTitle.trim() || 'Bonus task',
            description: customDescription,
            points: Number(customPoints) || 0,
            proofType: customProofType,
            photoCount: customProofType === 'PHOTOS' ? customPhotoCount : null,
            category: 'Bonus',
            isBonus: true,
            order: 0,
          };

      const createRes = await fetch(`/api/gm/games/${gameId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });
      if (!createRes.ok) {
        saving = false;
        const data = await createRes.json();
        error = data.error ?? 'Could not create bonus task';
        return;
      }
    } else {
      const existingIds = allTasks.filter((t: any) => t.isBonus).map((t: any) => t.id);
      for (const id of existingIds) {
        await fetch(`/api/gm/games/${gameId}/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
      }
    }

    saving = false;
    close();
    await load();
  }

  function close() {
    modal = null;
    error = '';
  }

  function randomizeReturn() {
    if (!game?.endAt) return;
    const end = fromInputValue(`${gameDate()}T${toInputValue(new Date(game.endAt)).slice(11, 16)}`);
    const possibleMinutes = [5, 6, 7, 8, 9, 11, 12, 13, 14, 15];
    for (let i = 0; i < 50; i++) {
      const windowMinutes = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
      const endOffset = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
      const retEnd = new Date(end.getTime() - endOffset * 60 * 1000);
      const retStart = new Date(retEnd.getTime() - windowMinutes * 60 * 1000);
      if (retEnd.getMinutes() % 10 !== 0 && retStart.getMinutes() % 10 !== 0) {
        retStartTime = toInputValue(retStart).slice(11, 16);
        retWindow = windowMinutes;
        return;
      }
    }
    const fallbackWindow = 13;
    const retEnd = new Date(end.getTime() - 6 * 60 * 1000);
    const retStart = new Date(retEnd.getTime() - fallbackWindow * 60 * 1000);
    retStartTime = toInputValue(retStart).slice(11, 16);
    retWindow = fallbackWindow;
  }

  async function saveReturn() {
    if (!game?.endAt) return;
    saving = true;
    error = '';
    const date = gameDate();
    const start = fromInputValue(`${date}T${retStartTime}`);
    const end = new Date(start.getTime() + retWindow * 60 * 1000);
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

    <button class="section-card" on:click={openBonus}>
      <h3 class="fungee-section-title" style="margin: 0;"><span class="mdi mdi-star"></span> Bonus Task</h3>
      {#if game.bonusStart && game.bonusEnd}
        <p class="window">Window: {fmtTime(game.bonusStart)} — {fmtTime(game.bonusEnd)}</p>
      {:else}
        <p class="window">No limited-time bonus task is set for this game.</p>
      {/if}
      <p class="hint">Click to edit</p>
    </button>
  {/if}
</div>

{#if modal === 'return'}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal fungee-card" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={saveReturn}>
        <h3 class="fungee-section-title" style="margin: 0 0 1rem;">Return Time Bonus</h3>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={retEnabled} />
          Enable return bonus
        </label>

        {#if retEnabled}
          <label class="fungee-label" for="rs">Window Start Time</label>
          <input class="fungee-input" id="rs" type="time" bind:value={retStartTime} />

          <label class="fungee-label" for="rw">Window Length (minutes)</label>
          <input class="fungee-input" id="rw" type="number" style="margin-bottom: 0.75rem;" bind:value={retWindow} min="1" />

          <button class="fungee-btn secondary" type="button" on:click={randomizeReturn} style="width: auto; margin: 0;">RANDOMIZE</button>

          <label class="fungee-label" for="rp">Points</label>
          <input class="fungee-input" id="rp" type="number" step="0.1" bind:value={retPoints} min="0" />
        {/if}

        {#if error}<p class="fungee-error">{error}</p>{/if}

        <div class="fungee-btn-row" style="margin-top: 1rem;">
          <button class="fungee-btn secondary" type="button" on:click={close} disabled={saving}>CANCEL</button>
          <button class="fungee-btn" type="submit" disabled={saving}>SAVE</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if modal === 'bonus'}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal fungee-card" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={saveBonus}>
        <h3 class="fungee-section-title" style="margin: 0 0 1rem;"><span class="mdi mdi-star"></span> Bonus Task</h3>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={bonusEnabled} />
          Enable limited-time bonus task
        </label>

        {#if bonusEnabled}
          <label class="fungee-label" for="bts">Window Start</label>
          <input class="fungee-input" id="bts" type="time" bind:value={bonusStart} />

          <label class="fungee-label" for="bte">Window End</label>
          <input class="fungee-input" id="bte" type="time" bind:value={bonusEnd} />

          <label class="fungee-label">Task Source</label>
          <div style="display: flex; gap: 1rem; margin-bottom: 0.75rem;">
            <label class="fungee-check" style="margin: 0;">
              <input type="radio" value="built-in" bind:group={bonusMode} /> Built-in
            </label>
            <label class="fungee-check" style="margin: 0;">
              <input type="radio" value="custom" bind:group={bonusMode} /> Custom
            </label>
          </div>

          {#if bonusMode === 'built-in'}
            <label class="fungee-label" for="bt">Choose a default task</label>
            <select class="fungee-input" id="bt" bind:value={bonusBuiltInIndex}>
              {#each defaultTasks as t, i}
                <option value={i}>{t.title} (+{t.points} pts)</option>
              {/each}
            </select>
          {:else}
            <label class="fungee-label" for="ct">Title</label>
            <input class="fungee-input" id="ct" type="text" bind:value={customTitle} placeholder="Title" />

            <label class="fungee-label" for="cd">Description</label>
            <textarea class="fungee-textarea" id="cd" bind:value={customDescription} placeholder="Description"></textarea>

            <label class="fungee-label" for="cp">Points</label>
            <input class="fungee-input" id="cp" type="number" step="0.1" bind:value={customPoints} />

            <label class="fungee-label" for="cpt">Proof Type</label>
            <select class="fungee-input" id="cpt" bind:value={customProofType}>
              <option value="PHOTO">Photo</option>
              <option value="VIDEO">Video</option>
              <option value="PHOTOS">Photos</option>
            </select>

            {#if customProofType === 'PHOTOS'}
              <label class="fungee-label" for="cpc">Number of Photos (optional)</label>
              <input class="fungee-input" id="cpc" type="number" min="1" bind:value={customPhotoCount} placeholder="e.g., number of other teams" />
            {/if}
          {/if}
        {/if}

        {#if error}<p class="fungee-error">{error}</p>{/if}

        <div class="fungee-btn-row" style="margin-top: 1rem;">
          <button class="fungee-btn secondary" type="button" on:click={close} disabled={saving}>CANCEL</button>
          <button class="fungee-btn" type="submit" disabled={saving}>SAVE</button>
        </div>
      </form>
    </div>
  </div>
{/if}

{#if modal === 'food'}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal fungee-card" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <form on:submit|preventDefault={saveFood}>
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
          <button class="fungee-btn secondary" type="button" on:click={close} disabled={saving}>CANCEL</button>
          <button class="fungee-btn" type="submit" disabled={saving}>SAVE</button>
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
