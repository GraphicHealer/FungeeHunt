<script lang="ts">
  import { onMount } from 'svelte';
  import { tourRefresh } from './tourStore';

  let visible = false;

  onMount(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (!data.welcomeShown && !data.tourDone) visible = true;
      }
    } catch {
      visible = false;
    }
  });

  async function update(body: any) {
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      // ignore
    }
    tourRefresh.set(Date.now());
    visible = false;
  }

  function begin() {
    update({ welcomeShown: true });
  }

  function cancel() {
    update({ welcomeShown: true, tourDone: true });
  }
</script>

{#if visible}
  <div class="modal-backdrop" on:click={cancel}>
    <div class="modal" on:click|stopPropagation>
      <h1>Welcome to Fungee-Hunt</h1>
      <p>
        Fungee-Hunt is a self-hosted scavenger-hunt game for groups. Players join with a code, complete photo or video challenges, and earn points.
        Game Masters create and run games from this device.
      </p>
      <p class="question">Would you like a quick walkthrough?</p>
      <div class="actions">
        <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={cancel}>NO THANKS</button>
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={begin}>BEGIN TOUR</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1200;
    padding: 1rem;
  }

  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 2rem;
    max-width: 32rem;
    width: 100%;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .modal h1 {
    margin: 0 0 1rem;
  }

  .modal p {
    color: var(--text);
    line-height: 1.5;
    margin: 0 0 1rem;
  }

  .question {
    font-weight: 600;
    margin-bottom: 1.5rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
