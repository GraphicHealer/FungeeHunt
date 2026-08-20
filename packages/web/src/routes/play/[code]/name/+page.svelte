<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const code = $page.params.code;
  let displayName = '';
  let error = '';

  async function join() {
    error = '';
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, displayName }),
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem(`token:${code}`, data.token);
      goto(`/play/${code}/lobby`);
    } else {
      error = data.error ?? 'Could not join';
    }
  }
</script>

<main class="container">
  <h1>JOIN FUNGEE-HUNT</h1>
  <p class="code">{code}</p>

  <label for="name">What's your name?</label>
  <input id="name" type="text" bind:value={displayName} />

  {#if error}<p class="error">{error}</p>{/if}

  <button on:click={join} disabled={!displayName}>CONTINUE</button>
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

  input {
    padding: 0.5rem 1rem;
    font-size: 1rem;
    width: 12rem;
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
