<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  onMount(() => {
    goto(`/play/${code}/lobby`);
  });
</script>
