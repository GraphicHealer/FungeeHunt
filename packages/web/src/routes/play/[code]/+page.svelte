<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const code = $page.params.code;
  const token = $page.url.searchParams.get('token');

  onMount(() => {
    if (token) {
      localStorage.setItem(`token:${code}`, token);
      goto(`/play/${code}/tasks`);
    } else {
      goto(`/play/${code}/name`);
    }
  });
</script>

<p>Loading...</p>
