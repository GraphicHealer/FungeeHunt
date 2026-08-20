<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const gameId = $page.params.gameId;

  let tasks: any[] = [];
  let title = '';
  let description = '';
  let points = 0;
  let proofType = 'PHOTO';
  let order = 0;

  function token() {
    return localStorage.getItem('gmToken') ?? '';
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}/tasks`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) tasks = await res.json();
  }

  async function addTask() {
    const res = await fetch(`/api/gm/games/${gameId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ title, description, points, proofType, order }),
    });
    if (res.ok) {
      title = '';
      description = '';
      points = 0;
      proofType = 'PHOTO';
      order = 0;
      await load();
    }
  }

  onMount(load);
</script>

<main class="container">
  <h1>TASKS</h1>

  <section class="form">
    <input type="text" bind:value={title} placeholder="Title" />
    <textarea bind:value={description} placeholder="Description" />
    <input type="number" bind:value={points} placeholder="Points" />
    <select bind:value={proofType}>
      <option value="PHOTO">Photo</option>
      <option value="VIDEO">Video</option>
      <option value="EITHER">Photo or Video</option>
    </select>
    <input type="number" bind:value={order} placeholder="Order" />
    <button on:click={addTask} disabled={!title}>ADD TASK</button>
  </section>

  <ul>
    {#each tasks as task (task.id)}
      <li>{task.order}. {task.title} — +{task.points} ({task.proofType})</li>
    {/each}
  </ul>
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 24rem;
    margin-bottom: 1rem;
  }

  input, textarea, select {
    padding: 0.5rem;
  }
</style>
