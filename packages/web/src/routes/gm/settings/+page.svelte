<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/toast';

  let settings: any = null;
  let defaultRulesStr = '';
  let defaultTasksStr = '';
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
    } else {
      toast.add('Could not load settings', 'error');
    }
    loading = false;
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
        returnBonusEnabled: settings.returnBonusEnabled,
        returnBonusWindowMinutes: Number(settings.returnBonusWindowMinutes),
        returnBonusPoints: Number(settings.returnBonusPoints),
        defaultRules: defaultRulesStr,
        defaultTasks: defaultTasksStr,
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
    <section class="card">
      <h2>Return Time Bonus Defaults</h2>
      <label>
        <input type="checkbox" bind:checked={settings.returnBonusEnabled} />
        Enabled by default
      </label>
      <label for="rbw">Default window length (minutes)</label>
      <input id="rbw" type="number" bind:value={settings.returnBonusWindowMinutes} min="1" />
      <label for="rbp">Default points</label>
      <input id="rbp" type="number" bind:value={settings.returnBonusPoints} min="0" />
    </section>

    <section class="card">
      <h2>Food Drive Defaults</h2>
      <label>
        <input type="checkbox" bind:checked={settings.foodDriveEnabled} />
        Enabled by default
      </label>
      <label for="fdpp">Default points per item</label>
      <input id="fdpp" type="number" bind:value={settings.foodDrivePointsPerItem} min="0" />
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
      <h2>Default Tasks (JSON)</h2>
      <textarea class="json" bind:value={defaultTasksStr} />
    </section>

    <button on:click={save}>SAVE SETTINGS</button>
  {/if}
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
    background: #f5f5f5;
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
    background: #fff;
    border: 1px solid #ddd;
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
    border: 1px solid #ccc;
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

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
