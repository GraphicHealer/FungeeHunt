<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  const code = $page.params.code;
  const token = $page.url.searchParams.get('token');

  onMount(() => {
    if (token) {
      localStorage.setItem(`token:${code}`, token);
      loadAndGo();
    } else if (localStorage.getItem(`token:${code}`)) {
      loadAndGo();
    } else {
      goto(`/play/${code}/name`);
    }
  });

  async function loadAndGo() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(`token:${code}`) ?? ''}` },
    });
    if (res.ok) {
      const state = await res.json();
      if (state.game?.status === 'LIVE' || state.game?.status === 'COMPLETED') {
        goto(`/play/${code}/tasks`);
      } else {
        goto(`/play/${code}/lobby`);
      }
    } else {
      goto(`/play/${code}/name`);
    }
  }
</script>

<p>Loading...</p>
