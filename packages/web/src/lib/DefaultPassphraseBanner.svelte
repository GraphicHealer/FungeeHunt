<script lang="ts">
  import { onMount } from 'svelte';

  let defaultPassphrase = false;
  let dismissed = false;

  onMount(async () => {
    dismissed = sessionStorage.getItem('defaultPassphraseBanner') === 'dismissed';
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        defaultPassphrase = data.defaultPassphrase ?? false;
      }
    } catch {
      // ignore
    }
  });

  function close() {
    dismissed = true;
    sessionStorage.setItem('defaultPassphraseBanner', 'dismissed');
  }
</script>

{#if defaultPassphrase && !dismissed}
  <div class="banner" role="alert">
    <span>WARNING: The default Game Master password is in use. Change it in your environment configuration before hosting publicly.</span>
    <button class="close" on:click={close} aria-label="Dismiss warning">×</button>
  </div>
{/if}

<style>
  .banner {
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 10000;
    background: #b91c1c;
    color: #fff;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    font-weight: 600;
    text-align: center;
  }

  .banner span {
    flex: 1;
  }

  .close {
    background: none;
    border: none;
    color: #fff;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1;
  }
</style>
