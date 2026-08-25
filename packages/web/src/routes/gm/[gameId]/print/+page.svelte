<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let game: any = null;
  let tasks: any[] = [];
  let rules: any[] = [];
  let loading = true;
  let error = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const [gRes, tRes, rRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`/api/gm/games/${gameId}/tasks`, { headers: { Authorization: `Bearer ${token()}` } }),
      fetch(`/api/gm/games/${gameId}/rules`, { headers: { Authorization: `Bearer ${token()}` } }),
    ]);
    if (gRes.ok) game = await gRes.json();
    else error = 'Could not load game';
    if (tRes.ok) tasks = await tRes.json();
    if (rRes.ok) rules = await rRes.json();
    loading = false;

    // Give the DOM a moment to settle before printing.
    setTimeout(() => {
      if (!loading) window.print();
    }, 500);
  }

  onMount(load);
</script>

<svelte:head>
  <title>Print {game?.name ?? 'Game'}</title>
</svelte:head>

<main class="print-page">
  <div class="no-print actions">
    <button on:click={() => window.print()}>PRINT</button>
    <button on:click={() => history.back()}>CLOSE</button>
  </div>

  {#if loading}
    <p>Loading…</p>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <section class="print-section">
      <h1>{game?.name ?? 'Fungee-Hunt'} Tasks</h1>
      {#if tasks.length === 0}
        <p>No tasks.</p>
      {:else}
        <ol class="task-list">
          {#each tasks as task (task.id)}
            <li>
              <div class="task-header">
                <span class="order">{task.order}.</span>
                <span class="title">{task.title}</span>
                <span class="meta">+{task.points} · {task.proofType}</span>
              </div>
              <p class="description">{task.description}</p>
            </li>
          {/each}
        </ol>
      {/if}
    </section>

    <section class="print-section rules-section">
      <h1>Rules</h1>
      {#if rules.length === 0}
        <p>No rules.</p>
      {:else}
        <div class="rules-list">
          {#each rules as rule (rule.id)}
            <div class="rule">
              <h2>{rule.title}</h2>
              <p>{@html rule.body.replace(/\n/g, '<br />')}</p>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  {/if}
</main>

<style>
  .print-page {
    font-family: system-ui, sans-serif;
    padding: 2rem;
    background: #fff;
    color: #000;
    max-width: 8.5in;
    margin: 0 auto;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .actions button {
    padding: 0.5rem 1rem;
    cursor: pointer;
  }

  .print-section {
    margin-bottom: 2rem;
  }

  .rules-section {
    page-break-before: always;
  }

  h1 {
    margin-top: 0;
  }

  .task-list {
    list-style: none;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .task-list li {
    border-bottom: 1px solid #ccc;
    padding-bottom: 1rem;
    break-inside: avoid;
  }

  .task-header {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .order {
    font-weight: bold;
  }

  .title {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .meta {
    color: #555;
    font-size: 0.9rem;
  }

  .description {
    margin: 0.25rem 0 0;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .rule h2 {
    margin: 0 0 0.5rem;
  }

  .rule p {
    margin: 0;
  }

  .error {
    color: #d32f2f;
  }

  @media print {
    .actions {
      display: none;
    }

    body {
      background: #fff;
      color: #000;
    }

    .rules-section {
      page-break-before: always;
    }

    .task-list li {
      break-inside: avoid;
    }
  }
</style>
