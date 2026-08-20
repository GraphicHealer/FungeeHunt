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

<main class="container">
  {#if state}
    <header>
      <h1>{state.game.name}</h1>
      <p>
        {#if state.team}
          <a href="/play/{code}/team">{state.team.name ?? 'Unnamed team'}</a>
        {:else}No team yet{/if}
      </p>
      <p class="score">{state.player.displayName}</p>
    </header>

    <nav class="top-nav">
      <a href="/play/{code}/team">Team</a>
      <a href="/play/{code}/rules">Rules</a>
    </nav>

    <ul class="tasks">
      {#each state.tasks as task (task.id)}
        <li class:open={expanded === task.id}>
          <button class="summary" on:click={() => (expanded = expanded === task.id ? '' : task.id))}>
            <span class="title">{task.title}</span>
            <span class="points">+{task.points}</span>
            {#if task.submission}
              <span class="status">{task.submission.status}</span>
            {:else}
              <span class="status available">Available</span>
            {/if}
          </button>

          {#if expanded === task.id}
            <div class="detail">
              <p class="description">{task.description || 'No description'}</p>
              <p class="proof-type">Proof: {task.proofType}</p>

              {#if isManager() && !task.submission}
                <div class="submit">
                  <input
                    type="file"
                    accept={accept(task)}
                    capture={task.proofType === 'PHOTO' ? 'environment' : undefined}
                    on:change={(e) => (selected[task.id] = (e.currentTarget as HTMLInputElement).files)}
                  />
                  <button on:click={() => submitTask(task.id)}>SUBMIT PROOF</button>
                </div>
              {/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>

    {#if state.game.foodDriveEnabled}
      <section class="food-drive">
        <h2>FOOD DRIVE REFERENCE</h2>
        <p>{state.game.foodDrivePointsPerItem} points per eligible item</p>
        {#if state.game.foodDrivePermissible}
          <h3>Permissible</h3>
          <p>{state.game.foodDrivePermissible}</p>
        {/if}
        {#if state.game.foodDriveSuggested}
          <h3>Suggested</h3>
          <p>{state.game.foodDriveSuggested}</p>
        {/if}
      </section>
    {/if}
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p>Loading...</p>
  {/if}
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  header {
    margin-bottom: 1rem;
  }

  .score {
    font-weight: bold;
  }

  .tasks {
    list-style: none;
    padding: 0;
  }

  li {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    border-bottom: 1px solid #ddd;
  }

  .summary {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    width: 100%;
    cursor: pointer;
  }

  .detail {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-top: 0.5rem;
  }

  .open {
    background: #f8f8f8;
  }

  .description {
    margin: 0;
  }

  .proof-type {
    color: #666;
    font-size: 0.9rem;
    margin: 0;
  }

  .submit {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .status {
    font-weight: bold;
  }

  .available {
    color: #666;
  }

  .top-nav {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .food-drive {
    margin-top: 2rem;
    padding: 1rem;
    border: 1px solid #ddd;
  }

  .error {
    color: red;
  }
</style>
