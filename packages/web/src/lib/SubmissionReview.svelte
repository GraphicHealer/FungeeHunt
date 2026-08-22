<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { toast } from './toast';

  export let gameId: string;
  export let sub: any;

  const dispatch = createEventDispatcher();

  let reason = '';
  let rejecting = false;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function review(status: string) {
    if (status === 'INCOMPLETE' && !reason.trim()) {
      toast.add('A reason is required when rejecting a submission', 'error');
      return;
    }

    const res = await fetch(`/api/gm/games/${gameId}/submissions/${sub.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ status, reason: reason.trim() }),
    });
    if (res.ok) {
      dispatch('review');
      toast.add(status === 'COMPLETED' ? 'Submission approved' : 'Submission rejected', 'success');
      close();
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not update submission', 'error');
    }
  }

  function close() {
    dispatch('close');
  }
</script>

<div class="modal-backdrop" on:click={close}>
  <div class="modal fungee-card" on:click|stopPropagation>
    <h2>Review Submission</h2>
    <div class="details">
      <p><strong>Team:</strong> {sub.team?.name ?? 'Unknown'}</p>
      <p><strong>Task:</strong> {sub.task?.title ?? ''}</p>
      <p><strong>Status:</strong> {sub.status}</p>
      {#if sub.reason}<p class="reason"><strong>Reason:</strong> {sub.reason}</p>{/if}
    </div>

    {#if sub.proofUrl}
      <div class="proof">
        {#if sub.task?.proofType === 'VIDEO'}
          <video src={sub.proofUrl} controls></video>
        {:else}
          <img src={sub.proofUrl} alt="Proof" />
        {/if}
      </div>
    {/if}

    {#if rejecting}
      <form on:submit|preventDefault={() => review('INCOMPLETE')}>
        <label class="fungee-label" for="reason">Reason for rejecting (required)</label>
        <textarea class="fungee-textarea" id="reason" bind:value={reason} placeholder="Explain why this submission is rejected…"></textarea>
        <div class="fungee-btn-row" style="margin-top: 1rem;">
          <button class="fungee-btn danger" type="submit">REJECT</button>
          <button class="fungee-btn" type="button" on:click={() => { rejecting = false; reason = ''; }}>CANCEL</button>
        </div>
      </form>
    {/if}

    <div class="fungee-btn-row" style="margin-top: 1rem;">
      <button class="fungee-btn secondary" on:click={close}>CLOSE</button>
      {#if !rejecting}
        <button class="fungee-btn danger" on:click={() => (rejecting = true)}>REJECT</button>
      {/if}
      {#if sub.status !== 'COMPLETED'}
        <button class="fungee-btn" on:click={() => review('COMPLETED')}>APPROVE</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal {
    width: 100%;
    max-width: 40rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
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
</style>
