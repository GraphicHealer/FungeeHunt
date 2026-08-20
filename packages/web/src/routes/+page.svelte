<script lang="ts">
  import { goto } from '$app/navigation';

  let code = '';

  function join() {
    if (code.trim()) {
      goto(`/play/${code.trim()}/name`);
    }
  }

  function goToLogin() {
    goto('/login');
  }
</script>

<main class="container">
  <h1>FUNGEE-HUNT</h1>

  <label for="code">Enter Game Code</label>
  <input
    id="code"
    type="text"
    bind:value={code}
    placeholder="74KJP2"
    autocomplete="off"
  />

  <button on:click={join} disabled={!code.trim()}>JOIN</button>

  <hr />

  <button on:click={goToLogin}>LOG IN</button>
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
    font-size: 1.5rem;
    letter-spacing: 0.25rem;
    text-align: center;
    text-transform: uppercase;
    padding: 0.5rem 1rem;
    width: 12rem;
  }

  button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    cursor: pointer;
  }
</style>
