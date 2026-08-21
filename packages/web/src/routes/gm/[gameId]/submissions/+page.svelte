<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let submissions: any[] = [];
  let reason = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/submissions`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) submissions = await res.json();
  }

  async function review(id: string, status: string) {
    const res = await fetch(`/api/gm/games/${gameId}/submissions/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ status, reason }),
    });
    if (res.ok) {
      reason = '';
      await load();
    }
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Submissions</h2>
  </header>

  <label for="reason">Incomplete reason (used when marking incomplete):</label>
  <input id="reason" type="text" bind:value={reason} placeholder="Reason..." />

  <ul class="submissions">
    {#each submissions as sub (sub.id)}
      <li>
        <div class="meta">
          <span class="team">{sub.team?.name ?? 'Unknown team'}</span>
          <span class="task">{sub.task?.title ?? ''}</span>
          <span class="status">{sub.status}</span>
        </div>
        {#if sub.proofUrl}
          <a href={sub.proofUrl} target="_blank" rel="noreferrer">View proof</a>
        {/if}
        {#if sub.status === 'UNDER_REVIEW' || sub.status === 'SUBMITTED'}
          <div class="actions">
            <button on:click={() => review(sub.id, 'COMPLETED')}>APPROVE</button>
            <button on:click={() => review(sub.id, 'INCOMPLETE')}>MARK INCOMPLETE</button>
          </div>
        {:else if sub.status === 'COMPLETED'}
          <div class="actions">
            <button on:click={() => review(sub.id, 'UNDER_REVIEW')}>MARK UNDER REVIEW</button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .page {
    font-family: system-ui, sans-serif;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .page-header h2 {
    margin: 0;
  }

  .submissions {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .submissions li {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .team {
    font-weight: bold;
  }

  .task {
    color: #666;
  }

  .status {
    font-weight: bold;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  input {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 1rem;
  }
</style>
