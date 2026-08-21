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

  let step = 1;

  let name = 'Fungee-Hunt';
  let date = '';
  let startTime = '';
  let endTime = '';
  let submissionMode = 'AUTOMATIC';

  let returnBonusEnabled = false;
  let returnStart = '';
  let returnEnd = '';
  let returnPoints = 100;
  let returnBonusWindowMinutes = 10;

  let foodDriveEnabled = false;
  let foodDrivePointsPerItem = 1;
  let foodDrivePermissible = '';
  let foodDriveSuggested = '';

  let error = '';

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
    }
  });

  $: startAt = `${date}T${startTime}`;
  $: endAt = `${date}T${endTime}`;
  $: if (date && startTime && endTime) {
    const end = fromInputValue(endAt);
    const retStart = new Date(end.getTime() - returnBonusWindowMinutes * 60 * 1000);
    returnStart = toInputValue(retStart);
    returnEnd = endAt;
  }

  function token() {
    return localStorage.getItem('gmToken') ?? '';
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
        foodDriveEnabled,
        foodDrivePointsPerItem,
        foodDrivePermissible,
        foodDriveSuggested,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      goto(`/gm/${data.id}/dashboard`);
    } else {
      error = data.error ?? 'Could not create game';
    }
  }
</script>

<main class="fungee-page">
  <div class="fungee-card wide">
    <h1 class="fungee-title">NEW GAME</h1>

    <div class="wizard">
      {#if step === 1}
        <h2 class="fungee-section-title">1. Basics</h2>
        <label class="fungee-label" for="name">Game Name</label>
        <input class="fungee-input" id="name" type="text" bind:value={name} />

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

        <button class="fungee-btn" on:click={() => step = 2} disabled={!name || !date || !startTime || !endTime}>NEXT</button>
      {:else if step === 2}
        <h2 class="fungee-section-title">2. Return Bonus</h2>
        <label style="display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0 0.5rem;">
          <input type="checkbox" bind:checked={returnBonusEnabled} />
          Enable return bonus
        </label>
        {#if returnBonusEnabled}
          <label class="fungee-label" for="rs">Window Start (default is last {returnBonusWindowMinutes} minutes)</label>
          <input class="fungee-input" id="rs" type="datetime-local" bind:value={returnStart} />
          <label class="fungee-label" for="re">Window End</label>
          <input class="fungee-input" id="re" type="datetime-local" bind:value={returnEnd} />
          <label class="fungee-label" for="rp">Points</label>
          <input class="fungee-input" id="rp" type="number" bind:value={returnPoints} />
        {/if}

        <div class="fungee-btn-row">
          <button class="fungee-btn secondary" on:click={() => step = 1}>BACK</button>
          <button class="fungee-btn" on:click={() => step = 3}>NEXT</button>
        </div>
      {:else if step === 3}
        <h2 class="fungee-section-title">3. Food Drive</h2>
        <label style="display: flex; align-items: center; gap: 0.5rem; margin: 1rem 0 0.5rem;">
          <input type="checkbox" bind:checked={foodDriveEnabled} />
          Enable food drive bonus
        </label>
        {#if foodDriveEnabled}
          <label class="fungee-label" for="fdpp">Points Per Item</label>
          <input class="fungee-input" id="fdpp" type="number" bind:value={foodDrivePointsPerItem} />
          <label class="fungee-label" for="fdperm">Permissible Items</label>
          <textarea class="fungee-textarea" id="fdperm" bind:value={foodDrivePermissible} placeholder="Cans, boxes, etc."></textarea>
          <label class="fungee-label" for="fdsug">Suggested Items</label>
          <textarea class="fungee-textarea" id="fdsug" bind:value={foodDriveSuggested} placeholder="Peanut butter, soup, etc."></textarea>
        {/if}

        {#if error}<p class="fungee-error">{error}</p>{/if}

        <div class="fungee-btn-row">
          <button class="fungee-btn secondary" on:click={() => step = 2}>BACK</button>
          <button class="fungee-btn" on:click={createGame}>CREATE GAME</button>
        </div>
      {/if}
    </div>
  </div>
</main>
