<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let status = 'Loading…';

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const state = await res.json();
      if (state.team) {
        goto(`/play/${code}/tasks`);
      } else {
        status = 'Waiting for the Game Master to assign you to a team…';
      }
    } else {
      status = 'Could not load game state.';
    }
  }

  onMount(load);
</script>

<main class="container">
  <h1>YOU'RE IN!</h1>
  <p class="code">{code}</p>
  <p>{status}</p>
</main>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 2rem;
    font-family: system-ui, sans-serif;
  }

  .code {
    font-size: 1.5rem;
    letter-spacing: 0.25rem;
    font-weight: bold;
  }
</style>
