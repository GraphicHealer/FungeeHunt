<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Toast from '$lib/Toast.svelte';

  let ready = false;

  function isAdminToken(t: string) {
    try {
      let payload = t.split('.')[0].replace(/-/g, '+').replace(/_/g, '/');
      const pad = payload.length % 4;
      if (pad) payload += '='.repeat(4 - pad);
      const json = JSON.parse(atob(payload));
      return !json.gameId;
    } catch {
      return false;
    }
  }

  onMount(() => {
    const token = localStorage.getItem('gmToken') ?? '';
    if (!token || !isAdminToken(token)) {
      goto('/login');
    } else {
      ready = true;
    }
  });
</script>

{#if ready}
  <slot />
{/if}
<Toast />
