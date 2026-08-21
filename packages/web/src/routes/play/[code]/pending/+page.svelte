<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let gameName = '';
  let teamName = '';

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      const state = await res.json();
      gameName = state.game?.name ?? 'the game';
      teamName = state.team?.name ?? 'Unnamed team';
    }
  }

  onMount(() => {
    load();
    const interval = setInterval(async () => {
      const res = await fetch(`/api/play/${code}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const state = await res.json();
        if (state.game?.status === 'LIVE') {
          clearInterval(interval);
          window.location.href = `/play/${code}/tasks`;
        }
      }
    }, 2000);
  });
</script>

<main class="fungee-page">
  <div class="fungee-card fungee-pending">
    <h1 class="fungee-title">GAME PENDING</h1>
    <p class="fungee-subtitle">Your team is <strong>{teamName}</strong>.</p>
    <p>Waiting for the Game Master to start <strong>{gameName}</strong>…</p>
  </div>
</main>
