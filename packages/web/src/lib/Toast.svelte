<script lang="ts">
  import { fly, scale } from 'svelte/transition';
  import { toast, type ToastMessage } from './toast';

  let messages: ToastMessage[] = [];
  toast.subscribe((m) => (messages = m));
</script>

{#if messages.length}
  <div class="toasts">
    {#each messages as m (m.id)}
      <div class="toast {m.type}" role="alert" in:fly={{ x: 50, duration: 250 }} out:scale={{ duration: 200 }} on:click={() => toast.remove(m.id)}>
        {m.message}
      </div>
    {/each}
  </div>
{/if}

<style>
  .toasts {
    position: fixed;
    top: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    z-index: 2000;
  }

  .toast {
    padding: 0.75rem 1.25rem;
    border-radius: 0.5rem;
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    max-width: 24rem;
  }

  .toast.info {
    background: #0366d6;
  }

  .toast.error {
    background: #e74c3c;
  }

  .toast.success {
    background: #28a745;
  }
</style>
