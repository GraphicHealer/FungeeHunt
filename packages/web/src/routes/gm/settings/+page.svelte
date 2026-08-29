<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/toast';
  import { downloadTemplate } from '$lib/taskCsv';

  let settings: any = null;
  let defaultRulesStr = '';
  let defaultTasksStr = '';
  let taskCategoriesStr = '';
  let loading = true;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch('/api/gm/settings', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      settings = await res.json();
      defaultRulesStr = JSON.stringify(settings.defaultRules ?? [], null, 2);
      defaultTasksStr = JSON.stringify(settings.defaultTasks ?? [], null, 2);
      taskCategoriesStr = JSON.stringify(settings.taskCategories ?? [], null, 2);
    } else {
      toast.add('Could not load settings', 'error');
    }
    loading = false;
  }

  async function reEnableTutorial() {
    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ welcomeShown: false, tourStep: 0, tourDone: false }),
    });
    if (res.ok) {
      toast.add('Tutorial will reappear on the main screen', 'success');
    } else {
      toast.add('Could not re-enable tutorial', 'error');
    }
  }

  async function save() {
    const res = await fetch('/api/gm/settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        foodDriveEnabled: settings.foodDriveEnabled,
        foodDrivePointsPerItem: Number(settings.foodDrivePointsPerItem),
        foodDrivePermissible: settings.foodDrivePermissible,
        foodDriveSuggested: settings.foodDriveSuggested,
        captainCanUpdateFoodDrive: settings.captainCanUpdateFoodDrive,
        returnBonusEnabled: settings.returnBonusEnabled,
        returnBonusWindowMinutes: Number(settings.returnBonusWindowMinutes),
        returnBonusPoints: Number(settings.returnBonusPoints),
        randomizeReturnBonus: settings.randomizeReturnBonus,
        defaultRules: defaultRulesStr,
        taskCategories: taskCategoriesStr,
      }),
    });
    if (res.ok) {
      toast.add('Settings saved', 'success');
      await load();
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not save settings', 'error');
    }
  }

  async function importDefaultTasks(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const csv = await file.text();
    const res = await fetch('/api/gm/settings/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ csv }),
    });
    if (res.ok) {
      const data = await res.json();
      toast.add(`${data.count} default tasks imported`, 'success');
      await load();
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not import tasks', 'error');
    }
    input.value = '';
  }

  onMount(load);
</script>

<main class="container">
  <header class="topbar">
    <h1>System Settings</h1>
    <button on:click={() => goto('/gm')}>BACK TO GAMES</button>
  </header>

  {#if loading}
    <p>Loading…</p>
  {:else if settings}
    <form on:submit|preventDefault={save}>
      <section class="card">
        <h2>Return Time Bonus Defaults</h2>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={settings.returnBonusEnabled} />
          Enabled by default
        </label>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={settings.randomizeReturnBonus} />
          Randomize return bonus start when opening new game wizard
        </label>
        <label for="rbw">Default window length (minutes)</label>
        <input id="rbw" type="number" bind:value={settings.returnBonusWindowMinutes} min="1" />
        <label for="rbp">Default points</label>
        <input id="rbp" type="number" step="0.1" bind:value={settings.returnBonusPoints} min="0" />
      </section>

      <section class="card">
        <h2>Food Drive Defaults</h2>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={settings.foodDriveEnabled} />
          Enabled by default
        </label>
        <label class="fungee-check">
          <input type="checkbox" bind:checked={settings.captainCanUpdateFoodDrive} />
          Captains can update food drive count
        </label>
        <label for="fdpp">Default points per item</label>
        <input id="fdpp" type="number" step="0.1" bind:value={settings.foodDrivePointsPerItem} min="0" />
        <label for="fdperm">Default permissible items</label>
        <textarea id="fdperm" bind:value={settings.foodDrivePermissible} />
        <label for="fdsug">Default suggested items</label>
        <textarea id="fdsug" bind:value={settings.foodDriveSuggested} />
      </section>

      <section class="card">
        <h2>Default Rules (JSON)</h2>
        <textarea class="json" bind:value={defaultRulesStr} />
      </section>

      <section class="card">
        <h2>Default Tasks (CSV)</h2>
        <p style="margin: 0 0 1rem; color: var(--muted);">
          Download the existing default task list, edit it in your spreadsheet, then upload the CSV. This replaces the current list.
        </p>
        <div class="csv-actions">
          <button class="fungee-btn" type="button" on:click={() => downloadTemplate('fungeehunt-default-tasks.csv', settings?.defaultTasks ?? [])} style="width: auto; margin: 0;">
            Download Existing Tasks
          </button>
          <label class="fungee-btn" for="default-tasks-csv" style="width: auto; margin: 0;">
            Upload CSV
          </label>
          <input id="default-tasks-csv" type="file" accept=".csv,text/csv" on:change={importDefaultTasks} />
        </div>
      </section>

      <section class="card">
        <h2>Default Task Categories (JSON)</h2>
        <textarea class="json" bind:value={taskCategoriesStr} />
      </section>

      <button type="submit">SAVE SETTINGS</button>

      <section class="card" style="margin-top: 1rem;">
        <h2>Tutorial</h2>
        <p style="margin: 0 0 1rem; color: var(--muted);">Make the welcome and guided tour appear again the next time the main page is opened.</p>
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={reEnableTutorial}>RE-ENABLE TUTORIAL</button>
      </section>
    </form>
  {/if}
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: var(--bg);
    min-height: 100vh;
  }

  .topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .topbar h1 {
    margin: 0;
  }

  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .card h2 {
    margin: 0 0 0.5rem;
  }

  input, textarea {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    min-height: 5rem;
  }

  .json {
    font-family: monospace;
    min-height: 10rem;
  }

  .csv-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .csv-actions input[type="file"] {
    display: none;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
