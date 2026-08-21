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
  let viewerEnabled = false;

  let returnBonusEnabled = false;
  let returnStart = '';
  let returnEnd = '';
  let returnPoints = 10;

  let foodDriveEnabled = false;
  let foodDrivePointsPerItem = 1;
  let foodDrivePermissible = '';
  let foodDriveSuggested = '';

  let error = '';
  let game: any = null;

  onMount(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    const start = now;
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);

    date = `${start.getFullYear()}-${(start.getMonth() + 1).toString().padStart(2, '0')}-${start.getDate().toString().padStart(2, '0')}`;
    startTime = `${start.getHours().toString().padStart(2, '0')}:00`;
    endTime = `${end.getHours().toString().padStart(2, '0')}:00`;
  });

  $: startAt = `${date}T${startTime}`;
  $: endAt = `${date}T${endTime}`;
  $: if (date && startTime && endTime) {
    const end = fromInputValue(endAt);
    const retStart = new Date(end.getTime() - 10 * 60 * 1000);
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
        viewerEnabled,
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
      game = data;
    } else {
      error = data.error ?? 'Could not create game';
    }
  }
</script>

{#if game}
  <main class="container">
    <div class="card">
      <h1>{game.name}</h1>
      <p class="code">GAME CODE: {game.code}</p>
      <div class="actions">
        <button on:click={() => navigator.clipboard.writeText(game.code)}>COPY CODE</button>
        <button on:click={() => goto(`/gm/${game.id}/dashboard`)}>OPEN DASHBOARD</button>
      </div>
    </div>
  </main>
{:else}
  <main class="container">
    <div class="card">
      <h1>NEW GAME</h1>

      <div class="wizard">
        {#if step === 1}
          <h2>1. Basics</h2>
          <label for="name">Game Name</label>
          <input id="name" type="text" bind:value={name} />

          <label for="date">Date</label>
          <input id="date" type="date" bind:value={date} />

          <label for="start">Start Time</label>
          <input id="start" type="time" bind:value={startTime} />

          <label for="end">End Time</label>
          <input id="end" type="time" bind:value={endTime} />

          <label for="mode">Submission Review</label>
          <select id="mode" bind:value={submissionMode}>
            <option value="AUTOMATIC">Automatic Approval</option>
            <option value="MANUAL">Game Master Approval</option>
          </select>

          <label>
            <input type="checkbox" bind:checked={viewerEnabled} />
            Enable public viewer
          </label>

          <div class="buttons">
            <button on:click={() => step = 2} disabled={!name || !date || !startTime || !endTime}>NEXT</button>
          </div>
        {:else if step === 2}
          <h2>2. Return Bonus</h2>
          <label>
            <input type="checkbox" bind:checked={returnBonusEnabled} />
            Enable return bonus
          </label>
          {#if returnBonusEnabled}
            <label for="rs">Window Start (default is last 10 minutes)</label>
            <input id="rs" type="datetime-local" bind:value={returnStart} />
            <label for="re">Window End</label>
            <input id="re" type="datetime-local" bind:value={returnEnd} />
            <label for="rp">Points</label>
            <input id="rp" type="number" bind:value={returnPoints} />
          {/if}

          <div class="buttons">
            <button on:click={() => step = 1}>BACK</button>
            <button on:click={() => step = 3}>NEXT</button>
          </div>
        {:else if step === 3}
          <h2>3. Food Drive</h2>
          <label>
            <input type="checkbox" bind:checked={foodDriveEnabled} />
            Enable food drive bonus
          </label>
          {#if foodDriveEnabled}
            <label for="fdpp">Points Per Item</label>
            <input id="fdpp" type="number" bind:value={foodDrivePointsPerItem} />
            <label for="fdperm">Permissible Items</label>
            <textarea id="fdperm" bind:value={foodDrivePermissible} placeholder="Cans, boxes, etc." />
            <label for="fdsug">Suggested Items</label>
            <textarea id="fdsug" bind:value={foodDriveSuggested} placeholder="Peanut butter, soup, etc." />
          {/if}

          {#if error}<p class="error">{error}</p>{/if}

          <div class="buttons">
            <button on:click={() => step = 2}>BACK</button>
            <button on:click={createGame}>CREATE GAME</button>
          </div>
        {/if}
      </div>
    </div>
  </main>
{/if}

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: #f5f5f5;
  }

  .card {
    background: #fff;
    border-radius: 0.75rem;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    padding: 2rem;
    width: 100%;
    max-width: 28rem;
  }

  .card h1 {
    margin-top: 0;
  }

  .wizard {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  input, select, textarea {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    min-height: 5rem;
  }

  .buttons {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .buttons button {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    cursor: pointer;
    border: none;
    border-radius: 0.25rem;
    background: #0366d6;
    color: #fff;
  }

  .buttons button:disabled {
    background: #999;
    cursor: not-allowed;
  }

  .code {
    font-size: 1.5rem;
    letter-spacing: 0.25rem;
    font-weight: bold;
    margin: 1rem 0;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }

  .actions button {
    flex: 1;
    padding: 0.75rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .error {
    color: red;
  }

  label {
    font-weight: bold;
    margin-top: 0.5rem;
  }
</style>
