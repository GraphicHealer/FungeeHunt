<script lang="ts">
  import { page } from '$app/stores';
  import PlayerNav from '$lib/PlayerNav.svelte';
  import PlayerTopbar from '$lib/PlayerTopbar.svelte';
  import ChatWidget from '$lib/ChatWidget.svelte';

  $: segments = $page.url.pathname.split('/').filter(Boolean);
  $: showNav = segments[0] === 'play' && segments.length > 2 && ['tasks', 'team', 'rules'].includes(segments[segments.length - 1]);
</script>

{#if showNav}
  <PlayerTopbar />
{/if}
<slot />
<ChatWidget />
{#if showNav}
  <PlayerNav />
{/if}
