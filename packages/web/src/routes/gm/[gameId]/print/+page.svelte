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
    padding: 1rem;
    background: #fff;
    color: #000;
    max-width: 8.5in;
    margin: 0 auto;
    font-size: 10pt;
    line-height: 1.3;
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
    margin-bottom: 1rem;
  }

  .rules-section {
    page-break-before: always;
  }

  h1 {
    margin: 0 0 0.25rem;
    font-size: 1.25rem;
  }

  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .task-list li {
    border-bottom: 0.5pt solid #ccc;
    padding-bottom: 0.35rem;
    break-inside: avoid;
  }

  .task-header {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    flex-wrap: wrap;
  }

  .order {
    font-weight: bold;
    font-size: 0.95rem;
  }

  .title {
    font-weight: bold;
    font-size: 1rem;
  }

  .meta {
    color: #555;
    font-size: 0.85rem;
  }

  .description {
    margin: 0.1rem 0 0;
    font-size: 0.9rem;
  }

  .rules-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rule h2 {
    margin: 0 0 0.15rem;
    font-size: 1rem;
  }

  .rule p {
    margin: 0;
    font-size: 0.9rem;
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

    .print-page {
      padding: 0.25in;
      font-size: 9pt;
      line-height: 1.2;
    }

    .rules-section {
      page-break-before: always;
    }

    .task-list li {
      break-inside: avoid;
    }
  }
</style>
