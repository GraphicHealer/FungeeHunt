<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  const code = $page.params.code;

  let sections: any[] = [];

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  async function load() {
    const res = await fetch(`/api/play/${code}/rules`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) sections = await res.json();
  }

  onMount(load);
</script>

<main class="fungee-page" style="padding-top: 3rem; padding-bottom: 7rem;">
  <div class="fungee-card wide">
    <h1 class="fungee-title">RULES</h1>

    {#each sections as section (section.id)}
      <div class="fungee-list-item" style="margin-top: 1rem;">
        <h2 class="fungee-section-title">{section.title}</h2>
        <p class="fungee-section-body">{section.body}</p>
      </div>
    {/each}
  </div>
</main>
