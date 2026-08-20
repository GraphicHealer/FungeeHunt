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

<main class="container">
  <h1>SUBMISSIONS</h1>

  <label for="reason">Incomplete reason (used when marking incomplete):</label>
  <input id="reason" type="text" bind:value={reason} placeholder="Reason..." />

  <ul class="submissions">
    {#each submissions as sub (sub.id)}
      <li>
        <div class="meta">
          <strong>{sub.team?.name ?? 'Unknown team'}</strong>
          <span>{sub.task?.title ?? ''}</span>
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
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .submissions {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  li {
    padding: 1rem;
    border: 1px solid #ddd;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .status {
    font-weight: bold;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
  }
</style>
