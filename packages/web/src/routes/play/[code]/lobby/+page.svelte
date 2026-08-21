<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let status = 'Checking game state…';

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
        if (state.game?.status === 'LIVE') {
          goto(`/play/${code}/tasks`);
        } else {
          goto(`/play/${code}/pending`);
        }
      } else {
        status = 'Waiting for the Game Master to assign you to a team…';
      }
    } else {
      status = 'Could not load game state.';
    }
  }

  onMount(load);
</script>

<main class="fungee-page">
  <div class="fungee-card fungee-pending">
    <h1 class="fungee-title">YOU'RE IN!</h1>
    <p class="fungee-code">{code}</p>
    <p>{status}</p>
  </div>
</main>
