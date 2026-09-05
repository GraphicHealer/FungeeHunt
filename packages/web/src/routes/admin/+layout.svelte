<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Toast from '$lib/Toast.svelte';
  import { isAdminToken } from '$lib/gmToken';

  let ready = false;

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
