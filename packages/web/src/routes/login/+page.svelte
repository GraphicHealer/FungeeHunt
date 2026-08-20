<script lang="ts">
  import { goto } from '$app/navigation';

  let passphrase = '';
  let error = '';

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
      goto('/gm/new');
    } else {
      error = data.error ?? 'Login failed';
    }
  }
</script>

<main class="container">
  <h1>GAME MASTER LOG IN</h1>

  <label for="passphrase">Passphrase</label>
  <input id="passphrase" type="password" bind:value={passphrase} />

  {#if error}<p class="error">{error}</p>{/if}

  <button on:click={login} disabled={!passphrase}>LOG IN</button>
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

  input {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    width: 16rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }

  .error {
    color: red;
  }
</style>
