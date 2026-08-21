<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';

  const gameId = $page.params.gameId;

  let submissions: any[] = [];
  let reviewing: any = null;
  let denying = false;
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

  async function review(status: string) {
    if (status === 'INCOMPLETE' && !reason.trim()) {
      toast.add('A reason is required when denying a submission', 'error');
      return;
    }

    const res = await fetch(`/api/gm/games/${gameId}/submissions/${reviewing.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ status, reason: reason.trim() }),
    });
    if (res.ok) {
      closeModal();
      await load();
      toast.add(status === 'COMPLETED' ? 'Submission approved' : 'Submission denied', 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not update submission', 'error');
    }
  }

  function openModal(sub: any) {
    reviewing = sub;
    denying = false;
    reason = '';
  }

  function closeModal() {
    reviewing = null;
    denying = false;
    reason = '';
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Submissions</h2>
  </header>

  <ul class="submissions">
    {#each submissions as sub (sub.id)}
      <li>
        <div class="meta">
          <span class="team">{sub.team?.name ?? 'Unknown team'}</span>
          <span class="task">{sub.task?.title ?? ''}</span>
          <span class="status">{sub.status}</span>
        </div>
        <button on:click={() => openModal(sub)}>REVIEW</button>
      </li>
    {/each}
  </ul>
</div>

{#if reviewing}
  <div class="modal-overlay" on:click={closeModal}>
    <div class="modal" on:click|stopPropagation>
      <h2>Review Submission</h2>
      <div class="details">
        <p><strong>Team:</strong> {reviewing.team?.name ?? 'Unknown'}</p>
        <p><strong>Task:</strong> {reviewing.task?.title ?? ''}</p>
        <p><strong>Status:</strong> {reviewing.status}</p>
        {#if reviewing.reason}<p class="reason"><strong>Reason:</strong> {reviewing.reason}</p>{/if}
      </div>

      {#if reviewing.proofUrl}
        <div class="proof">
          {#if reviewing.task?.proofType === 'VIDEO'}
            <video src={reviewing.proofUrl} controls />
          {:else}
            <img src={reviewing.proofUrl} alt="Proof" />
          {/if}
        </div>
      {/if}

      {#if denying}
        <label for="reason">Reason for denying (required)</label>
        <textarea id="reason" bind:value={reason} placeholder="Explain why this submission is denied…" />
      {/if}

      <div class="actions">
        <button on:click={() => review('COMPLETED')}>APPROVE</button>
        {#if denying}
          <button class="deny" on:click={() => review('INCOMPLETE')}>CONFIRM DENY</button>
          <button on:click={() => { denying = false; reason = ''; }}>CANCEL</button>
        {:else}
          <button class="deny" on:click={() => (denying = true)}>DENY</button>
        {/if}
      </div>

      <button class="close" on:click={closeModal}>CLOSE</button>
    </div>
  </div>
{/if}

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
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .meta {
    display: flex;
    gap: 1rem;
    align-items: center;
    flex-wrap: wrap;
  }

  .team {
    font-weight: bold;
  }

  .task {
    color: var(--muted);
  }

  .status {
    font-weight: bold;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .modal {
    background: var(--card);
    border-radius: 0.5rem;
    padding: 2rem;
    width: 90%;
    max-width: 40rem;
    max-height: 90vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .modal h2 {
    margin: 0;
  }

  .details p {
    margin: 0.25rem 0;
  }

  .reason {
    color: var(--danger);
  }

  .proof img,
  .proof video {
    max-width: 100%;
    max-height: 50vh;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
  }

  textarea {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    width: 100%;
    min-height: 5rem;
    box-sizing: border-box;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .deny {
    background: var(--danger);
    color: #fff;
    border: none;
  }

  .close {
    align-self: flex-start;
  }
</style>
