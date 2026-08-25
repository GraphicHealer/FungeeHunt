<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

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
