<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Toast from '$lib/Toast.svelte';

  let ready = false;

  onMount(() => {
    if (!localStorage.getItem('gmToken')) {
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
