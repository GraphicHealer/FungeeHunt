<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let sections: any[] = [];

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  async function load() {
    const res = await fetch(`/api/play/${code}/rules`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) sections = await res.json();
  }

  onMount(load);
</script>

<main class="container">
  <h1>RULES</h1>

  {#each sections as section (section.id)}
    <section>
      <h2>{section.title}</h2>
      <p>{section.body}</p>
    </section>
  {/each}

  <a href="/play/{code}/tasks">← Back to tasks</a>
</main>

<style>
  .container {
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  section {
    margin-bottom: 1.5rem;
  }
</style>
