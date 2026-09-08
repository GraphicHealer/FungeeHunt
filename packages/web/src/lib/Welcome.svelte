<script lang="ts">
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';

  let visible = false;
  let adminUrl = '/admin';

  onMount(async () => {
    adminUrl = `${window.location.origin}/admin`;
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (!data.welcomeShown) visible = true;
      }
    } catch {
      visible = false;
    }
  });

  async function close() {
    visible = false;
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ welcomeShown: true }),
      });
    } catch {
      // ignore
    }
  }
</script>

{#if visible}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <h1>Welcome to Fungee-Hunt</h1>
      <p>
        Thanks for installing Fungee-Hunt! It's a self-hosted scavenger-hunt game for groups — players join
        with a code, complete photo or video challenges, and earn points.
      </p>
      <p>
        The system admin dashboard is at:
        <br />
        <a class="admin-link" href="/admin">{adminUrl}</a>
      </p>
      <p class="hint">Bookmark it — that's where you'll manage games and system settings.</p>
      <div class="actions">
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={close}>GET STARTED</button>
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

  .admin-link {
    font-family: monospace;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--brand);
    word-break: break-all;
  }

  .hint {
    font-size: 0.85rem;
    color: var(--muted) !important;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
