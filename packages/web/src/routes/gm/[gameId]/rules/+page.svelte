<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let sections: any[] = [];
  let game: any = null;

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

  function add() {
    sections = [...sections, { title: '', body: '' }];
  }

  function remove(index: number) {
    if (confirm('Remove this rules section?')) {
      sections = sections.filter((_, i) => i !== index);
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

    if (game.returnBonusEnabled) {
      generated.push({
        title: 'RETURN TIME BONUS',
        body: `Teams that return to the finish between ${fmtTime(game.returnStart)} and ${fmtTime(game.returnEnd)} on ${fmtDate(game.returnEnd)} will receive an additional ${game.returnPoints} points.\n\nThe Game Master must confirm your team's return to receive the bonus.`,
      });
    }

    if (game.foodDriveEnabled) {
      generated.push({
        title: 'FOOD DRIVE BONUS',
        body: `Each eligible food drive item turned in is worth ${game.foodDrivePointsPerItem} points.\n\nPermissible items: ${game.foodDrivePermissible || 'as announced by the Game Master'}.\nSuggested items: ${game.foodDriveSuggested || 'none specified'}.`,
      });
    }

    sections = generated;
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h2>Game Rules</h2>
    <div class="actions">
      <button on:click={add}>+ ADD SECTION</button>
      <button on:click={save}>SAVE RULES</button>
    </div>
  </header>

  {#each sections as section, i (i)}
    <div class="section-card">
      <input type="text" bind:value={section.title} placeholder="Section title" />
      <textarea bind:value={section.body} placeholder="Section body" />
      <button class="remove" on:click={() => remove(i)}>REMOVE SECTION</button>
    </div>
  {/each}
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

  .actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .section-card {
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  input, textarea {
    padding: 0.5rem 0.75rem;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 0.25rem;
    width: 100%;
    box-sizing: border-box;
  }

  textarea {
    min-height: 6rem;
  }

  .remove {
    align-self: flex-start;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: 0.25rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
  }
</style>
