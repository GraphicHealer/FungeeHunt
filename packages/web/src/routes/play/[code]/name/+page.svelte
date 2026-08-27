<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';

  const code = $page.params.code;
  let displayName = '';
  let carValue = '';
  let error = '';

  async function join() {
    error = '';
    if (!carValue) {
      error = 'Please select whether you have a car';
      return;
    }

    const hasCar = carValue === 'true';
    const res = await fetch('/api/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, displayName, hasCar }),
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

<main class="fungee-page">
  <form class="fungee-card" on:submit|preventDefault={join}>
    <h1 class="fungee-title">JOIN FUNGEE-HUNT</h1>
    <p class="fungee-subtitle">Enter your name to get started.</p>
    <p class="fungee-code">{code}</p>

    <label class="fungee-label" for="name">What's your name?</label>
    <input class="fungee-input" id="name" type="text" bind:value={displayName} />

    <label class="fungee-label" for="car">Will you have a car available to drive?</label>
    <select class="fungee-input" id="car" bind:value={carValue} required>
      <option value="">Select one…</option>
      <option value="true">Yes</option>
      <option value="false">No</option>
    </select>

    {#if error}<p class="fungee-error">{error}</p>{/if}

    <button class="fungee-btn" type="submit" disabled={!displayName}>CONTINUE</button>
  </form>
</main>
