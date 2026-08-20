<script lang="ts">
  import { goto } from '$app/navigation';

  let name = '';
  let startAt = '';
  let endAt = '';
  let submissionMode = 'AUTOMATIC';

  let returnBonusEnabled = false;
  let returnStart = '';
  let returnEnd = '';
  let returnPoints = 0;

  let foodDriveEnabled = false;
  let foodDrivePointsPerItem = 0;
  let foodDrivePermissible = '';
  let foodDriveSuggested = '';

  let error = '';
  let game: any = null;

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
      game = data;
    } else {
      error = data.error ?? 'Could not create game';
    }
  }

  function copyCode() {
    if (game) navigator.clipboard.writeText(game.code);
  }
</script>

<main class="container">
  <h1>CREATE GAME</h1>

  <label for="name">Game Name</label>
  <input id="name" type="text" bind:value={name} placeholder="Fungee-Hunt 2026" />

  <label for="start">Start</label>
  <input id="start" type="datetime-local" bind:value={startAt} />

  <label for="end">End</label>
  <input id="end" type="datetime-local" bind:value={endAt} />

  <label for="mode">Submission Review</label>
  <select id="mode" bind:value={submissionMode}>
    <option value="AUTOMATIC">Automatic Approval</option>
    <option value="MANUAL">Game Master Approval</option>
  </select>

  <hr />

  <h2>RETURN TIME BONUS</h2>
  <label>
    <input type="checkbox" bind:checked={returnBonusEnabled} />
    Enable
  </label>
  {#if returnBonusEnabled}
    <label for="rs">Window Start</label>
    <input id="rs" type="datetime-local" bind:value={returnStart} />
    <label for="re">Window End</label>
    <input id="re" type="datetime-local" bind:value={returnEnd} />
    <label for="rp">Points</label>
    <input id="rp" type="number" bind:value={returnPoints} />
  {/if}

  <hr />

  <h2>FOOD DRIVE BONUS</h2>
  <label>
    <input type="checkbox" bind:checked={foodDriveEnabled} />
    Enable
  </label>
  {#if foodDriveEnabled}
    <label for="fdpp">Points Per Item</label>
    <input id="fdpp" type="number" bind:value={foodDrivePointsPerItem} />
    <label for="fdperm">Permissible Items</label>
    <textarea id="fdperm" bind:value={foodDrivePermissible} />
    <label for="fdsug">Suggested Items</label>
    <textarea id="fdsug" bind:value={foodDriveSuggested} />
  {/if}

  {#if error}<p class="error">{error}</p>{/if}

  <button on:click={createGame} disabled={!name}>CREATE GAME</button>

  {#if game}
    <section class="result">
      <h2>{game.name}</h2>
      <p class="code">GAME CODE: {game.code}</p>
      <button on:click={copyCode}>COPY CODE</button>
      <button on:click={() => goto(`/gm/${game.id}/dashboard`)}>DASHBOARD</button>
    </section>
  {/if}
</main>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  input, select, textarea {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    width: 18rem;
  }

  textarea {
    height: 5rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .error {
    color: red;
  }

  .result {
    margin-top: 1rem;
    text-align: center;
  }

  .code {
    font-size: 1.5rem;
    letter-spacing: 0.25rem;
    font-weight: bold;
  }
</style>
