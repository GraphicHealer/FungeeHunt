<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let sections: any[] = [];

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/rules`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) sections = await res.json();
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
    sections = sections.filter((_, i) => i !== index);
  }

  onMount(load);
</script>

<main class="container">
  <h1>GAME RULES</h1>

  {#each sections as section, i (i)}
    <div class="section">
      <input type="text" bind:value={section.title} placeholder="Section title" />
      <textarea bind:value={section.body} placeholder="Section body" />
      <button on:click={() => remove(i)}>REMOVE</button>
    </div>
  {/each}

  <div class="actions">
    <button on:click={add}>ADD SECTION</button>
    <button on:click={save}>SAVE RULES</button>
  </div>

  <a href="/gm/{gameId}/dashboard">← Dashboard</a>
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
    padding: 1rem;
    border: 1px solid #ddd;
  }

  input, textarea {
    padding: 0.5rem;
  }

  textarea {
    height: 6rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
