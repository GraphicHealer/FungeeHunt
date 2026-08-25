<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

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

  let taskCount = 20;
  let availableTasks: any[] = [];
  let taskCategories: string[] = [];

  let foodDriveEnabled = false;
  let foodDrivePointsPerItem = 1;
  let foodDrivePermissible = '';
  let foodDriveSuggested = '';

  let error = '';

  $: startAt = `${date}T${startTime}`;
  $: endAt = `${date}T${endTime}`;
  $: returnStart = date && returnStartTime ? `${date}T${returnStartTime}` : '';
  $: returnEnd = date && returnEndTime ? `${date}T${returnEndTime}` : '';

  $: if (date && returnStartTime && returnBonusWindowMinutes) {
    const start = fromInputValue(returnStart);
    const end = new Date(start.getTime() + returnBonusWindowMinutes * 60 * 1000);
    returnEndTime = toInputValue(end).slice(11, 16);
  }

  onMount(async () => {
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

  async function createGame() {
    error = '';
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
        foodDriveEnabled,
        foodDrivePointsPerItem,
        foodDrivePermissible,
        foodDriveSuggested,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      try {
        await fetch('/api/config', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tourStep: 7 }),
        });
      } catch {
        // ignore
      }
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
      {#if step === 1}
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
        <form on:submit|preventDefault={createGame}>
          <h2 class="fungee-section-title">4. Food Drive</h2>
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

          {#if error}<p class="fungee-error">{error}</p>{/if}

          <div class="fungee-btn-row">
            <button class="fungee-btn secondary" type="button" on:click={() => step = 3}>BACK</button>
            <button class="fungee-btn" type="submit" data-tour="create-game">CREATE GAME</button>
          </div>
        </form>
      {/if}
    </div>
  </div>
</main>
