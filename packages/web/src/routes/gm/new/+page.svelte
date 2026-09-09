<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { setGmToken, storedGameTokens, clearGmToken, isAdminToken } from '$lib/gmToken';

  function toInputValue(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromInputValue(v: string) {
    return new Date(v);
  }

  function focus(node: HTMLInputElement) {
    node.focus();
  }

  let step = 1;

  let name = 'Fungee-Hunt';
  let date = '';
  let startTime = '';
  let endTime = '';
  let submissionMode = 'AUTOMATIC';

  let returnBonusEnabled = false;
  let returnStartTime = '';
  let returnEndTime = '';
  let returnPoints = 100;
  let returnBonusWindowMinutes = 10;
  let returnRandomized = false;

  let taskCount = 20;
  let availableTasks: any[] = [];
  let taskCategories: string[] = [];

  let foodDriveEnabled = false;
  let foodDrivePointsPerItem = 1;
  let foodDrivePermissible = '';
  let foodDriveSuggested = '';

  let gmEmail = '';

  let bonusEnabled = true;
  let bonusStartTime = '';
  let bonusEndTime = '';
  let bonusTaskIndex = 0;
  let bonusStartDate: Date | null = null;
  let bonusEndDate: Date | null = null;

  let error = '';
  let showTourAsk = false;

  function answerTour(wants: boolean) {
    if (wants) {
      localStorage.setItem('gmTourPref', 'yes');
      localStorage.setItem('gmTourRun', '1');
      localStorage.setItem('gmTourStep', '0');
      window.dispatchEvent(new Event('gm-tour-start'));
    } else {
      localStorage.setItem('gmTourPref', 'no');
    }
    showTourAsk = false;
  }

  let existingGames: { id: string; name: string; code: string; status: string; startAt: string | null }[] = [];
  let checkingExisting = true;

  async function findExistingGames() {
    const admin = localStorage.getItem('gmToken');
    if (admin && isAdminToken(admin)) return;
    const found = await Promise.all(
      storedGameTokens().map(async ({ gameId, token }) => {
        try {
          const res = await fetch(`/api/gm/games/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const g = await res.json();
            return { id: g.id, name: g.name, code: g.code, status: g.status, startAt: g.startAt ?? null };
          }
          if (res.status === 401 || res.status === 403 || res.status === 404) clearGmToken(gameId);
        } catch {
          // offline; leave token alone
        }
        return null;
      }),
    );
    existingGames = found
      .filter((g): g is NonNullable<typeof g> => g !== null)
      .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''));
  }

  $: startAt = `${date}T${startTime}`;
  $: endAt = `${date}T${endTime}`;
  $: returnStart = date && returnStartTime ? `${date}T${returnStartTime}` : '';
  $: returnEnd = date && returnEndTime ? `${date}T${returnEndTime}` : '';
  $: bonusStart = bonusStartDate ? toInputValue(bonusStartDate) : '';
  $: bonusEnd = bonusEndDate ? toInputValue(bonusEndDate) : '';

  $: if (date && returnStartTime && returnBonusWindowMinutes) {
    const start = fromInputValue(returnStart);
    const end = new Date(start.getTime() + returnBonusWindowMinutes * 60 * 1000);
    returnEndTime = toInputValue(end).slice(11, 16);
  }

  $: if (step !== 2) returnRandomized = false;
  $: if (step === 2 && returnBonusEnabled && !returnRandomized) {
    returnRandomized = true;
    randomizeReturn();
  }

  onMount(async () => {
    if (!localStorage.getItem('gmTourPref')) showTourAsk = true;
    gmEmail = localStorage.getItem('gmEmail') ?? '';
    findExistingGames().finally(() => (checkingExisting = false));

    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const start = now;
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

    date = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;
    startTime = `${start.getHours().toString().padStart(2, '0')}:00`;
    endTime = `${end.getHours().toString().padStart(2, '0')}:00`;

    const sRes = await fetch('/api/gm/settings', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (sRes.ok) {
      const s = await sRes.json();
      returnBonusEnabled = s.returnBonusEnabled ?? true;
      returnBonusWindowMinutes = s.returnBonusWindowMinutes ?? 10;
      returnPoints = s.returnBonusPoints ?? 100;
      foodDriveEnabled = s.foodDriveEnabled ?? true;
      foodDrivePointsPerItem = s.foodDrivePointsPerItem ?? 1;
      foodDrivePermissible = s.foodDrivePermissible ?? '';
      foodDriveSuggested = s.foodDriveSuggested ?? '';
      availableTasks = s.defaultTasks ?? [];
      taskCategories = (s.taskCategories ?? []).map((c: string) => c.toLowerCase());
      taskCount = Math.min(20, availableTasks.length || 20);
      if (taskCount < 1) taskCount = 1;

      if (date && endTime && returnBonusEnabled && s.randomizeReturnBonus) {
        randomizeReturn();
      } else if (date && endTime && returnBonusEnabled) {
        const end = fromInputValue(endAt);
        const retStart = new Date(end.getTime() - returnBonusWindowMinutes * 60 * 1000);
        returnStartTime = toInputValue(retStart).slice(11, 16);
      }
    }
  });

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  function randomizeReturn() {
    const end = fromInputValue(endAt);
    if (!end) return;
    const possibleMinutes = [5, 6, 7, 8, 9, 11, 12, 13, 14, 15];
    for (let i = 0; i < 50; i++) {
      const windowMinutes = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
      const endOffset = possibleMinutes[Math.floor(Math.random() * possibleMinutes.length)];
      const retEnd = new Date(end.getTime() - endOffset * 60 * 1000);
      const retStart = new Date(retEnd.getTime() - windowMinutes * 60 * 1000);
      if (retEnd.getMinutes() % 10 !== 0 && retStart.getMinutes() % 10 !== 0) {
        returnStartTime = toInputValue(retStart).slice(11, 16);
        returnBonusWindowMinutes = windowMinutes;
        return;
      }
    }
    const fallbackWindow = 13;
    const retEnd = new Date(end.getTime() - 6 * 60 * 1000);
    const retStart = new Date(retEnd.getTime() - fallbackWindow * 60 * 1000);
    returnStartTime = toInputValue(retStart).slice(11, 16);
    returnBonusWindowMinutes = fallbackWindow;
  }

  function updateBonusTimes() {
    bonusStartTime = bonusStartDate ? toInputValue(bonusStartDate).slice(11, 16) : '';
    bonusEndTime = bonusEndDate ? toInputValue(bonusEndDate).slice(11, 16) : '';
  }

  function applyBonusStartTime() {
    if (!bonusStartDate || !bonusStartTime) return;
    const [h, m] = bonusStartTime.split(':').map(Number);
    bonusStartDate = new Date(bonusStartDate.getTime());
    bonusStartDate.setHours(h, m, 0, 0);
    bonusStartTime = toInputValue(bonusStartDate).slice(11, 16);
  }

  function applyBonusEndTime() {
    if (!bonusEndDate || !bonusEndTime) return;
    const [h, m] = bonusEndTime.split(':').map(Number);
    bonusEndDate = new Date(bonusEndDate.getTime());
    bonusEndDate.setHours(h, m, 0, 0);
    bonusEndTime = toInputValue(bonusEndDate).slice(11, 16);
  }

  function regenerateBonus() {
    if (!date || !startTime || !endTime || !availableTasks.length) return;
    const start = fromInputValue(startAt);
    let end = fromInputValue(endAt);
    if (end <= start) end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
    const mid = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2 - 10 * 60 * 1000);
    bonusStartDate = mid;
    bonusEndDate = new Date(mid.getTime() + 20 * 60 * 1000);
    updateBonusTimes();
    bonusTaskIndex = Math.floor(Math.random() * availableTasks.length);
  }

  $: if (step === 4 && bonusEnabled && availableTasks.length && !bonusStartTime) {
    regenerateBonus();
  }

  async function createGame() {
    error = '';
    if (bonusEnabled && availableTasks.length && (!bonusStartDate || !bonusEndDate)) {
      regenerateBonus();
    }
    const bonusStartStr = bonusEnabled && bonusStartDate ? toInputValue(bonusStartDate) : null;
    const bonusEndStr = bonusEnabled && bonusEndDate ? toInputValue(bonusEndDate) : null;
    const bonusTaskObj = bonusEnabled && bonusStartStr && bonusEndStr && availableTasks[bonusTaskIndex] ? availableTasks[bonusTaskIndex] : null;
    const res = await fetch('/api/gm/games', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        name,
        startAt,
        endAt,
        submissionMode,
        returnBonusEnabled,
        returnStart,
        returnEnd,
        returnPoints,
        taskCount,
        bonusStart: bonusStartStr,
        bonusEnd: bonusEndStr,
        bonusTask: bonusTaskObj,
        foodDriveEnabled,
        foodDrivePointsPerItem,
        foodDrivePermissible,
        foodDriveSuggested,
        gmEmail: gmEmail.trim(),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.gmToken) setGmToken(data.id, data.gmToken);
      if (gmEmail.trim()) localStorage.setItem('gmEmail', gmEmail.trim());
      goto(`/gm/${data.id}/dashboard`);
    } else {
      error = data.error ?? 'Could not create game';
    }
  }
</script>

<main class="fungee-page">
  <div class="fungee-card wide" data-tour="wizard-form">
    <h1 class="fungee-title">NEW GAME</h1>

    <div class="wizard">
      {#if checkingExisting}
        <p class="fungee-subtitle">Checking for your existing games…</p>
      {:else if existingGames.length}
        <h2 class="fungee-section-title">You already have a game on this device</h2>
        <p class="fungee-subtitle">Open an existing game, or start a new one.</p>
        <ul class="existing-games">
          {#each existingGames as g (g.id)}
            <li>
              <div class="existing-info">
                <strong>{g.name}</strong>
                <span class="existing-meta">Code {g.code} · {g.status.replace('_', ' ')}</span>
              </div>
              <button class="fungee-btn" type="button" style="width: auto; margin: 0;" on:click={() => goto(`/gm/${g.id}/dashboard`)}>OPEN</button>
            </li>
          {/each}
        </ul>
        <button class="fungee-btn secondary" type="button" on:click={() => (existingGames = [])}>START A NEW GAME</button>
      {:else if step === 1}
        <form on:submit|preventDefault={() => step = 2}>
          <h2 class="fungee-section-title">1. Basics</h2>
          <label class="fungee-label" for="name">Game Name</label>
          <input class="fungee-input" id="name" type="text" bind:value={name} use:focus />

          <label class="fungee-label" for="date">Date</label>
          <input class="fungee-input" id="date" type="date" bind:value={date} />

          <label class="fungee-label" for="start">Start Time</label>
          <input class="fungee-input" id="start" type="time" bind:value={startTime} />

          <label class="fungee-label" for="end">End Time</label>
          <input class="fungee-input" id="end" type="time" bind:value={endTime} />

          <label class="fungee-label" for="mode">Submission Review</label>
          <select class="fungee-select" id="mode" bind:value={submissionMode}>
            <option value="AUTOMATIC">Automatic Approval</option>
            <option value="MANUAL">Game Master Approval</option>
          </select>

          <button class="fungee-btn" type="submit" data-tour="step1-next" disabled={!name || !date || !startTime || !endTime}>NEXT</button>
        </form>
      {:else if step === 2}
        <form on:submit|preventDefault={() => step = 3}>
          <h2 class="fungee-section-title">2. Return Bonus</h2>
          <label class="fungee-check">
            <input type="checkbox" bind:checked={returnBonusEnabled} />
            Enable return bonus
          </label>
          {#if returnBonusEnabled}
            <label class="fungee-label" for="rs">Window Start Time</label>
            <input class="fungee-input" id="rs" type="time" bind:value={returnStartTime} use:focus />

            <label class="fungee-label" for="rbw">Window Length (minutes)</label>
            <input class="fungee-input" id="rbw" type="number" style="margin-bottom: 0.75rem;" bind:value={returnBonusWindowMinutes} min="1" />

            <p style="margin: 0.25rem 0 0.75rem; color: var(--muted); font-size: 0.9rem;">
              Return window: <strong>{returnStartTime || '--:--'}</strong> to <strong>{returnEndTime || '--:--'}</strong>
            </p>

            <button class="fungee-btn secondary" type="button" on:click={randomizeReturn} style="width: auto; margin: 0;">RANDOMIZE</button>

            <label class="fungee-label" for="rp">Points</label>
            <input class="fungee-input" id="rp" type="number" step="0.1" bind:value={returnPoints} />
          {/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 1}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="step2-next">NEXT</button>
          </div>
        </form>
      {:else if step === 3}
        <form on:submit|preventDefault={() => step = 4}>
          <h2 class="fungee-section-title">3. Tasks</h2>

          {#if availableTasks.length === 0}
            <p class="fungee-error">No default tasks are configured. Add tasks in System Settings.</p>
          {:else}
            <p style="margin: 0 0 1rem; color: var(--muted);">
              {availableTasks.length} default tasks available in {taskCategories.length} categories.
            </p>

            <label class="fungee-label" for="task-count">How many tasks for this game?</label>
            <input class="fungee-input" id="task-count" type="number" min="1" max={availableTasks.length} bind:value={taskCount} />

            <p style="margin: 0.5rem 0 0; color: var(--muted); font-size: 0.9rem;">
              A random mix will be pulled from categories, and one Team Photo task will always be task #1.
            </p>
          {/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 2}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="step3-next" disabled={availableTasks.length === 0}>NEXT</button>
          </div>
        </form>
      {:else if step === 4}
        <form on:submit|preventDefault={() => step = 5}>
          <h2 class="fungee-section-title">4. Bonus Task</h2>
          <label class="fungee-check">
            <input type="checkbox" bind:checked={bonusEnabled} />
            Enable limited-time bonus task
          </label>

          {#if bonusEnabled}
            <p style="margin: 0.25rem 0 1rem; color: var(--muted); font-size: 0.9rem;">
              A golden bonus task will appear for captains only during this window.
            </p>

            <label class="fungee-label" for="bs">Window Start Time</label>
            <input class="fungee-input" id="bs" type="time" bind:value={bonusStartTime} on:change={applyBonusStartTime} />

            <label class="fungee-label" for="be">Window End Time</label>
            <input class="fungee-input" id="be" type="time" bind:value={bonusEndTime} on:change={applyBonusEndTime} />

            <label class="fungee-label" for="bt">Bonus Task</label>
            <select class="fungee-select" id="bt" bind:value={bonusTaskIndex}>
              {#each availableTasks as t, i}
                <option value={i}>{t.title} (+{t.points} pts)</option>
              {/each}
            </select>

            <button class="fungee-btn secondary" type="button" on:click={regenerateBonus} style="width: auto; margin: 0;">RANDOMIZE</button>
          {/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 3}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="step4-next" disabled={bonusEnabled && (!availableTasks[bonusTaskIndex] || !bonusStartTime || !bonusEndTime)}>NEXT</button>
          </div>
        </form>
      {:else if step === 5}
        <form on:submit|preventDefault={() => step = 6}>
          <h2 class="fungee-section-title">5. Food Drive</h2>
          <label class="fungee-check">
            <input type="checkbox" bind:checked={foodDriveEnabled} />
            Enable food drive bonus
          </label>
          {#if foodDriveEnabled}
            <label class="fungee-label" for="fdpp">Points Per Item</label>
            <input class="fungee-input" id="fdpp" type="number" bind:value={foodDrivePointsPerItem} use:focus />
            <label class="fungee-label" for="fdperm">Permissible Items</label>
            <textarea class="fungee-textarea" id="fdperm" bind:value={foodDrivePermissible} placeholder="Cans, boxes, etc."></textarea>
            <label class="fungee-label" for="fdsug">Suggested Items</label>
            <textarea class="fungee-textarea" id="fdsug" bind:value={foodDriveSuggested} placeholder="Peanut butter, soup, etc."></textarea>
          {/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 4}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="step5-next">NEXT</button>
          </div>
        </form>
      {:else if step === 6}
        <form on:submit|preventDefault={createGame}>
          <h2 class="fungee-section-title">6. Email Notifications</h2>
          <p style="margin: 0 0 0.5rem; color: var(--muted); font-size: 0.95rem;">
            Optionally get emails about this game:
          </p>
          <ul style="margin: 0 0 0.75rem; padding-left: 1.25rem; color: var(--muted); font-size: 0.9rem;">
            <li>A copy of the game link when the game is created</li>
            <li>A reminder with the link about 2 hours before the game starts</li>
            <li>A warning shortly before the game is auto-deleted</li>
          </ul>
          <p style="margin: 0 0 0.75rem; color: var(--muted); font-size: 0.85rem;">
            Requires email to be configured on the server (see Admin settings).
          </p>

          <label class="fungee-label" for="gm-email">Your Email (optional)</label>
          <input class="fungee-input" id="gm-email" type="email" bind:value={gmEmail} placeholder="you@example.com" use:focus />

          {#if error}<p class="fungee-error">{error}</p>{/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 5}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="create-game">CREATE GAME</button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</main>

{#if showTourAsk}
  <div class="tour-backdrop">
    <div class="tour-modal">
      <h2>Quick tutorial?</h2>
      <p>Would you like a short guided tour of the Game Master dashboard after your game is created?</p>
      <div class="tour-actions">
        <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={() => answerTour(false)}>NO THANKS</button>
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={() => answerTour(true)}>YES, SHOW ME</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .tour-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1200;
    padding: 1rem;
  }

  .tour-modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 2rem;
    max-width: 26rem;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .tour-modal h2 {
    margin: 0 0 0.75rem;
  }

  .tour-modal p {
    color: var(--text);
    line-height: 1.5;
    margin: 0 0 1.5rem;
  }

  .tour-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
  }

  .existing-games {
    list-style: none;
    padding: 0;
    margin: 0 0 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .existing-games li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
  }

  .existing-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .existing-meta {
    font-size: 0.85rem;
    opacity: 0.75;
  }
</style>
