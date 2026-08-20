<script lang="ts">
  import { page } from '$app/stores';

  const code = $page.params.code;
</script>

<main class="container">
  <h1>YOU'RE IN!</h1>
  <p class="code">{code}</p>
  <p>Waiting for the Game Master to assign you to a team...</p>
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
