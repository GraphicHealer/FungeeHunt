<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { toast } from '$lib/toast';
  import { downloadTemplate } from '$lib/taskCsv';

  let settings: any = null;
  let emailTestTo = '';

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
    } else if (res.status === 401 || res.status === 403) {
      goto('/login');
    } else {
      toast.add('Could not load settings', 'error');
    }
    loading = false;
  }

  async function reEnableTutorial() {
    // The tutorial ask + Gmail prompt are remembered per device; clear them here.
    localStorage.removeItem('gmTourPref');
    localStorage.removeItem('gmTourNext');
    localStorage.removeItem('gmailSetupDismissed');
    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ welcomeShown: false }),
    });
    if (res.ok) {
      toast.add('Welcome and tutorial prompts will reappear on this device', 'success');
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
        autoDeleteHours: Number(settings.autoDeleteHours),

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

  async function sendTestEmail() {
    const res = await fetch('/api/gm/settings/email/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ to: emailTestTo }),
    });
    if (res.ok) {
      toast.add('Test email sent', 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not send test email', 'error');
    }
  }

  async function exportSettings() {
    const res = await fetch('/api/gm/settings/export', {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (!res.ok) {
      toast.add('Could not export settings', 'error');
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fungeehunt-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importSettings(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const res = await fetch('/api/gm/settings/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token()}`,
        },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        toast.add('Settings imported', 'success');
        await load();
      } else {
        const data = await res.json();
        toast.add(data.error ?? 'Could not import settings', 'error');
      }
    } catch {
      toast.add('That file is not valid JSON', 'error');
    }
    input.value = '';
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

  function reconnectGmail() {
    window.location.href = `/api/gm/settings/email/connect?key=${encodeURIComponent(token())}`;
  }

  onMount(async () => {
    const emailResult = $page.url.searchParams.get('email');
    if (emailResult) {
      if (emailResult === 'connected') toast.add('Gmail connected', 'success');
      else if (emailResult === 'denied') toast.add('Gmail access was denied', 'error');
      else if (emailResult === 'expired') toast.add('Gmail connect link expired; try again', 'error');
      else toast.add('Gmail connect failed', 'error');
      const u = new URL($page.url);
      u.searchParams.delete('email');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }
    await load();
  });
</script>

<main class="container">
  <header class="topbar">
    <h1>System Settings</h1>
    <button on:click={() => goto('/admin')}>BACK TO ADMIN</button>
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
        <h2>Game Cleanup</h2>
        <label for="adf">Auto-delete games this many hours after they end (0 = never)</label>
        <input id="adf" type="number" bind:value={settings.autoDeleteHours} min="0" step="1" />
        <p class="hint">Deletes the game along with its teams, players, submissions, and uploaded files, this many hours after the game's scheduled end time. Games with no end time are never auto-deleted.</p>
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
        <h2>Email</h2>
        <p class="hint">
          Email is configured on the server via environment variables.
          {#if settings.emailStatus?.smtpConfigured}
            <strong>SMTP is configured and will be used.</strong>
          {:else if settings.emailStatus?.gmailConnected}
            <strong>A Gmail account is connected.</strong>
          {:else if settings.emailStatus?.gmailConfigured}
            Gmail credentials are set on the server but no account is connected yet.
          {:else}
            Email is not configured.
          {/if}
        </p>
        {#if settings.emailStatus?.gmailConfigured}
          <div class="csv-actions" style="gap: 0.75rem;">
            <button class="fungee-btn" type="button" on:click={reconnectGmail} style="width: auto; margin: 0;">
              {settings.emailStatus?.gmailConnected ? 'RECONNECT GMAIL' : 'CONNECT GMAIL'}
            </button>
          </div>
        {/if}
        {#if settings.emailStatus?.smtpConfigured || settings.emailStatus?.gmailConnected}
          <div class="csv-actions" style="margin-top: 0.75rem; gap: 0.75rem;">
            <input type="email" bind:value={emailTestTo} placeholder="Send a test email to…" style="max-width: 20rem;" />
            <button class="fungee-btn" type="button" on:click={sendTestEmail} disabled={!emailTestTo} style="width: auto; margin: 0;">SEND TEST</button>
          </div>
        {/if}
      </section>

      <section class="card" style="margin-top: 1rem;">
        <h2>Backup &amp; Restore</h2>
        <p style="margin: 0; color: var(--muted);">Download all of these settings as a JSON file, or restore them from a previous export. Server-managed secrets (session secret, push keys) are not included.</p>
        <div class="csv-actions">
          <button class="fungee-btn" type="button" on:click={exportSettings} style="width: auto; margin: 0;">Export Settings</button>
          <label class="fungee-btn" for="settings-import" style="width: auto; margin: 0;">Import Settings</label>
          <input id="settings-import" type="file" accept=".json,application/json" on:change={importSettings} />
        </div>
      </section>

      <section class="card" style="margin-top: 1rem;">
        <h2>Tutorial</h2>
        <p style="margin: 0 0 1rem; color: var(--muted);">Show the welcome screen again and reset this device's tutorial preference (the wizard will ask about the tour on next use).</p>
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

  .hint {
    margin: 0.5rem 0 0;
    font-size: 0.85rem;
    color: var(--muted, #888);
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
