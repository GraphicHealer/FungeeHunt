<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { gmToken } from '$lib/gmToken';

  let ready = false;

  onMount(() => {
    const gameId = $page.params.gameId;
    if (!gmToken(gameId)) {
      goto('/login');
    } else {
      ready = true;
    }
  });
</script>

{#if ready}
  <slot />
{/if}
