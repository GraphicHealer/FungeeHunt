<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { toast } from '$lib/toast';
  import { io } from 'socket.io-client';
  import SubmissionReview from '$lib/SubmissionReview.svelte';

  const gameId = $page.params.gameId;

  let submissions: any[] = [];
  let reviewing: any = null;
  let gameCode = '';
  let socket: any;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function loadGame() {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const g = await res.json();
      gameCode = g.code;
    }
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/submissions`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) submissions = await res.json();
  }

  function openModal(sub: any) {
    reviewing = sub;
  }

  function closeModal() {
    reviewing = null;
  }

  async function onReviewed() {
    closeModal();
    await load();
    toast.add('Review saved', 'success');
  }

  onMount(async () => {
    await loadGame();
    await load();
    if (gameCode) {
      socket = io({ transports: ['websocket', 'polling'] });
      socket.on(`game:${gameCode.toUpperCase()}`, load);
    }
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
  });
</script>

<div class="page">
  <header class="page-header">
    <h2>Submissions</h2>
  </header>

  <ul class="submissions">
    {#each submissions as sub (sub.id)}
      <li class:incomplete={sub.status === 'INCOMPLETE'} on:click={() => openModal(sub)}>
        <div class="meta">
          <span class="team">{sub.team?.name ?? 'Unknown team'}</span>
          <span class="task">{sub.task?.title ?? ''}</span>
          <span class="status">{sub.status === 'INCOMPLETE' ? 'REJECTED' : sub.status}</span>
        </div>
      </li>
    {/each}
  </ul>
</div>

{#if reviewing}
  <SubmissionReview {gameId} sub={reviewing} on:close={closeModal} on:review={onReviewed} />
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
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
  }

  .submissions li:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(31, 35, 40, 0.12);
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

  .submissions li.incomplete {
    border-color: var(--danger);
    box-shadow: 0 0 0 1px var(--danger);
  }
</style>
