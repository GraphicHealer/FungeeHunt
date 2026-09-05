<script lang="ts">
  import '@mdi/font/css/materialdesignicons.min.css';
  import '$lib/theme';
  import DefaultPassphraseBanner from '$lib/DefaultPassphraseBanner.svelte';
  import Welcome from '$lib/Welcome.svelte';
  import Tour from '$lib/Tour.svelte';
</script>

<DefaultPassphraseBanner />
<slot />
<Welcome />
<Tour />
