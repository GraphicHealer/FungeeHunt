<script lang="ts">
  import { goto } from '$app/navigation';
  import ThemeToggle from '$lib/ThemeToggle.svelte';

  let passphrase = '';
  let error = '';

  function focus(node: HTMLInputElement) {
    node.focus();
  }

  async function login() {
    error = '';
    const res = await fetch('/api/auth/gm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('gmToken', data.token);
      goto('/gm');
    } else {
      error = data.error ?? 'Login failed';
    }
  }
</script>

<main class="fungee-page">
  <ThemeToggle />
  <form class="fungee-card" on:submit|preventDefault={login}>
    <h1 class="fungee-title">Game Master Log In</h1>
    <p class="fungee-subtitle">Enter the passphrase to access the Game Master board.</p>

    <label class="fungee-label" for="passphrase">Passphrase</label>
    <input class="fungee-input" id="passphrase" type="password" bind:value={passphrase} use:focus />

    {#if error}<p class="fungee-error">{error}</p>{/if}

    <button class="fungee-btn" data-tour="login-button" type="submit" disabled={!passphrase}>LOG IN</button>
  </form>
</main>
