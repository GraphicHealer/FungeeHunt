<script lang="ts">
  import { goto } from '$app/navigation';

  let code = '';

  function join() {
    if (code.trim()) {
      goto(`/play/${code.trim()}/name`);
    }
  }
</script>

<header class="topbar">
  <div class="logo-placeholder">
    <span class="mdi mdi-trophy"></span>
    <span class="logo-text">FUNGEE-HUNT</span>
  </div>
  <div class="topbar-actions">
    <button class="spectator" on:click={() => goto('/spectator')}>SPECTATOR</button>
    <button class="login" data-tour="login" on:click={() => goto('/login')}>LOG IN</button>
  </div>
</header>

<main class="fungee-page" style="padding-top: 5rem;">
  <div class="fungee-card" style="text-align: center;">
    <h1 class="fungee-title">ENTER GAME CODE</h1>
    <p class="fungee-subtitle">Join the hunt and start completing challenges.</p>

    <input
      class="fungee-input code-input"
      type="text"
      bind:value={code}
      placeholder="74KJP2"
      autocomplete="off"
      maxlength="8"
    />

    <button class="fungee-btn" on:click={join} disabled={!code.trim()}>JOIN GAME</button>
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

  .topbar-actions {
    display: flex;
    gap: 0.5rem;
  }

  .login,
  .spectator {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    background: var(--bg);
    color: var(--text);
    cursor: pointer;
    font-weight: 600;
  }

  .spectator:hover,
  .login:hover {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }

  .code-input {
    font-size: 2rem;
    letter-spacing: 0.4rem;
    text-align: center;
    text-transform: uppercase;
    padding: 0.75rem 1rem;
    margin-bottom: 1.5rem;
  }
</style>
