<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let code = '';
  let error = '';
  let polling: ReturnType<typeof setInterval> | null = null;

  onMount(async () => {
    try {
      const res = await fetch('/api/spectator', { method: 'POST' });
      if (!res.ok) throw new Error('Could not create session');
      const data = await res.json();
      code = data.code;
      polling = setInterval(async () => {
        const check = await fetch(`/api/spectator/${code}`);
        if (check.ok) {
          const state = await check.json();
          if (state.gameCode) {
            if (polling) clearInterval(polling);
            goto(`/view/${state.gameCode}`);
          }
        }
      }, 2500);
    } catch (err: any) {
      error = err.message || 'Could not start spectator mode';
    }
    return () => {
      if (polling) clearInterval(polling);
    };
  });
</script>

<header class="topbar">
  <div class="logo-placeholder">
    <span class="mdi mdi-trophy"></span>
    <span class="logo-text">FUNGEE-HUNT</span>
  </div>
</header>

<main class="fungee-page" style="padding-top: 5rem; text-align: center;">
  <div class="fungee-card">
    <h1 class="fungee-title">SPECTATOR</h1>
    <p class="fungee-subtitle">Give this code to your Game Master to connect this screen.</p>
    {#if error}
      <p class="error">{error}</p>
    {:else if code}
      <div class="code-box">
        <span>{code.slice(0, 3)}</span>
        <span>{code.slice(3)}</span>
      </div>
      <p class="waiting">Waiting to be paired...</p>
    {:else}
      <p class="waiting">Creating code...</p>
    {/if}
  </div>
</main>

<style>
  .topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4rem;
    background: var(--card);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1.5rem;
    z-index: 1000;
    box-shadow: var(--shadow);
  }

  .logo-placeholder {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: var(--brand);
    font-weight: 800;
    font-size: 1.25rem;
    text-decoration: none;
  }

  .logo-placeholder .mdi {
    font-size: 1.75rem;
  }

  .code-box {
    font-size: 4rem;
    letter-spacing: 0.5rem;
    font-weight: 800;
    color: var(--brand);
    margin: 1.5rem 0;
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    user-select: none;
  }

  .code-box span {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    min-width: 4rem;
    display: inline-block;
  }

  .waiting {
    color: var(--muted);
    font-size: 1.1rem;
  }

  .error {
    color: var(--danger);
    font-weight: 600;
  }
</style>
