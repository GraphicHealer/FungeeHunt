<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let sections: any[] = [];
  let game: any = null;
  let editIndex = -1;
  $: displaySections = sections
    .map((s, i) => ({ ...s, realIndex: i }))
    .filter((s) => !['RETURN TIME BONUS', 'FOOD DRIVE BONUS'].includes(s.title));
  let editTitle = '';
  let editBody = '';

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const [rRes, gRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}/rules`, {
        headers: { Authorization: `Bearer ${token()}` },
      }),
      fetch(`/api/gm/games/${gameId}`, {
        headers: { Authorization: `Bearer ${token()}` },
      }),
    ]);
    if (gRes.ok) game = await gRes.json();
    if (rRes.ok) {
      sections = await rRes.json();
      if (game && sections.length === 0) {
        generate();
      }
    }
  }

  async function save() {
    const res = await fetch(`/api/gm/games/${gameId}/rules`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({
        sections: sections.filter((s) => s.title?.trim() || s.body?.trim()),
      }),
    });
    if (res.ok) await load();
  }

  function openModal(displayIndex: number) {
    editIndex = displaySections[displayIndex].realIndex;
    editTitle = sections[editIndex]?.title ?? '';
    editBody = sections[editIndex]?.body ?? '';
  }

  function closeModal() {
    editIndex = -1;
  }

  function applyEdit() {
    sections = sections.map((s, i) =>
      i === editIndex ? { ...s, title: editTitle, body: editBody } : s
    );
    closeModal();
    save();
  }

  function add() {
    sections = [...sections, { title: '', body: '' }];
    openModal(sections.length - 1);
  }

  function remove() {
    if (confirm('Remove this rules section?')) {
      sections = sections.filter((_, i) => i !== editIndex);
      closeModal();
      save();
    }
  }

  function fmtTime(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function fmtDate(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString();
  }

  function generate() {
    if (!game) return;
    const generated: any[] = [
      {
        title: 'HOW TO PLAY',
        body: 'Work together as a team to complete as many challenges as possible before time expires.\n\nEvery completed challenge must include photo or video proof as required by the task.',
      },
      {
        title: 'SCORING',
        body: `Each task is worth the number of points displayed on the task.\n\nSubmissions are ${game.submissionMode === 'AUTOMATIC' ? 'automatically approved' : 'reviewed by the Game Master before they are approved'}.`,
      },
    ];

    sections = generated;
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Game Rules</h2>
    <button class="fungee-btn" on:click={add}>+ ADD SECTION</button>
  </header>

  {#each displaySections as section, i (section.realIndex)}
    <button class="fungee-accordion section" on:click={() => openModal(i)}>
      <span class="fungee-section-title" style="margin: 0;">{section.title}</span>
      <p class="body fungee-section-body">{section.body}</p>
    </button>
  {/each}
</div>

{#if editIndex >= 0}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal fungee-card" on:click|stopPropagation>
      <form on:submit|preventDefault={applyEdit}>
        <h3>Edit Section</h3>
        <label class="fungee-label" for="title">Title</label>
        <input class="fungee-input" id="title" type="text" bind:value={editTitle} placeholder="Section title" />
        <label class="fungee-label" for="body">Body</label>
        <textarea class="fungee-textarea" id="body" bind:value={editBody} placeholder="Section body" />
        <div class="fungee-btn-row">
          <button class="fungee-btn secondary" type="button" on:click={closeModal}>CANCEL</button>
          <button class="fungee-btn danger" type="button" on:click={remove}>REMOVE</button>
          <button class="fungee-btn" type="submit">SAVE SECTION</button>
        </div>
      </form>
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

  .page-header .fungee-btn {
    width: auto;
    margin: 0;
  }

  .section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
    text-align: left;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1.25rem;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: box-shadow 0.15s;
  }

  .section:hover {
    box-shadow: var(--shadow);
  }

  .section .body {
    margin: 0;
  }

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

  .modal :global(.fungee-textarea) {
    min-height: 12rem;
  }

  .modal h3 {
    margin: 0 0 0.5rem;
  }
</style>
