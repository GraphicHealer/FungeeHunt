<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let state: any = null;
  let error = '';
  let selected: Record<string, FileList | null> = {};
  let expanded = '';

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  function isManager() {
    return state && state.team && state.player.id === state.team.managerId;
  }

  function accept(task: any) {
    if (task.proofType === 'PHOTO') return 'image/*';
    if (task.proofType === 'VIDEO') return 'video/*';
    return 'image/*,video/*';
  }

  function handleFile(taskId: string, e: Event) {
    selected[taskId] = (e.currentTarget as HTMLInputElement).files;
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      state = await res.json();
    } else {
      error = 'Could not load game state';
    }
  }

  async function submitTask(taskId: string) {
    const file = selected[taskId]?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('proof', file);
    const res = await fetch(`/api/play/${code}/tasks/${taskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token()}` },
      body: form,
    });
    if (res.ok) {
      selected[taskId] = null;
      await load();
    } else {
      const data = await res.json();
      error = data.error ?? 'Submit failed';
    }
  }

  onMount(load);
</script>

<main class="fungee-page">
  <div class="fungee-card wide">
    <nav class="fungee-nav">
      <a href="/play/{code}/team">Team</a>
      <a href="/play/{code}/rules">Rules</a>
    </nav>

    {#if state}
      {#if state.game.status !== 'LIVE'}
        <div class="fungee-pending" style="text-align: center;">
          <h1 class="fungee-title">GAME PENDING</h1>
          <p class="fungee-subtitle">Your team is <strong>{state.team?.name ?? 'Unnamed team'}</strong>.</p>
          <p>Waiting for the Game Master to start the game…</p>
        </div>
      {:else}
        <header style="margin-bottom: 1.25rem;">
          <h1 class="fungee-title">{state.game.name}</h1>
          <p class="fungee-subtitle" style="margin: 0;">
            {#if state.team}
              <a class="fungee-link" href="/play/{code}/team">{state.team.name ?? 'Unnamed team'}</a>
            {:else}No team yet{/if}
            &nbsp;• {state.player.displayName}
          </p>
        </header>

        <ul class="fungee-list">
          {#each state.tasks as task (task.id)}
            <li class="fungee-accordion">
              <button class="fungee-accordion-header" on:click={() => (expanded = expanded === task.id ? '' : task.id)}>
                <span class="fungee-section-title" style="margin: 0;">{task.title}</span>
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                  <span>+{task.points}</span>
                  {#if task.submission}
                    <span class="fungee-status {task.submission.status.toLowerCase()}">{task.submission.status}</span>
                  {:else}
                    <span class="fungee-status">Available</span>
                  {/if}
                </span>
              </button>

              {#if expanded === task.id}
                <div class="fungee-accordion-body">
                  <p style="margin: 0 0 0.5rem; white-space: pre-line;">{task.description || 'No description'}</p>
                  <p style="margin: 0 0 0.75rem; color: var(--muted); font-size: 0.95rem;">Proof: {task.proofType}</p>

                  {#if isManager() && !task.submission}
                    <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                      <input
                        class="fungee-input"
                        type="file"
                        accept={accept(task)}
                        capture={task.proofType === 'PHOTO' ? 'environment' : undefined}
                        on:change={(e) => handleFile(task.id, e)}
                        style="flex: 1; min-width: 14rem; margin: 0;"
                      />
                      <button class="fungee-btn" style="margin: 0; width: auto;" on:click={() => submitTask(task.id)}>SUBMIT PROOF</button>
                    </div>
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>

        {#if state.game.foodDriveEnabled}
          <div class="fungee-list-item" style="margin-top: 1.5rem;">
            <h2 class="fungee-section-title">FOOD DRIVE REFERENCE</h2>
            <p style="margin: 0.25rem 0;">{state.game.foodDrivePointsPerItem} points per eligible item</p>
            {#if state.game.foodDrivePermissible}
              <p style="margin: 0.25rem 0; color: var(--muted);"><strong>Permissible:</strong> {state.game.foodDrivePermissible}</p>
            {/if}
            {#if state.game.foodDriveSuggested}
              <p style="margin: 0.25rem 0; color: var(--muted);"><strong>Suggested:</strong> {state.game.foodDriveSuggested}</p>
            {/if}
          </div>
        {/if}
      {/if}
    {:else if error}
      <p class="fungee-error">{error}</p>
    {:else}
      <p>Loading…</p>
    {/if}
  </div>
</main>
