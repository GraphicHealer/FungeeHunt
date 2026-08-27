<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;
  const token = $page.url.searchParams.get('token');

  let archive: any = null;
  let selectedTeamId: string | null = null;
  let loading = true;

  function filenameFromUrl(url: string) {
    return url.split('/').pop() ?? url;
  }

  function urlsFor(sub: any) {
    if (sub.proofUrls && sub.proofUrls.length) return sub.proofUrls;
    return sub.proofUrl ? [sub.proofUrl] : [];
  }

  onMount(async () => {
    const res = await fetch(`/api/archive/${code}`);
    if (res.ok) {
      const data = await res.json();
      if (data.game?.status === 'COMPLETED') {
        archive = data;
        loading = false;
        return;
      }
    }

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
      if (state.game?.status === 'LIVE') {
        goto(`/play/${code}/tasks`);
      } else if (state.game?.status === 'COMPLETED') {
        goto(`/play/${code}`);
      } else {
        goto(`/play/${code}/lobby`);
      }
    } else {
      goto(`/play/${code}/name`);
    }
  }
</script>

{#if archive}
  <main class="fungee-page" style="padding-top: 3rem; padding-bottom: 4rem;">
    <div class="fungee-card wide">
      <h1 class="fungee-title">{archive.game.name}</h1>
      <p class="fungee-subtitle">Game over. Pick a team to download their submissions.</p>

      <div class="team-list" in:fade={{ duration: 300 }}>
        {#each archive.teams as team (team.id)}
          <div class="team-card">
            <button
              type="button"
              class="team-header"
              on:click={() => (selectedTeamId = selectedTeamId === team.id ? null : team.id)}
            >
              <span class="team-name">{team.name ?? 'Unnamed team'}</span>
              <span class="count">{team.submissions.length} submissions</span>
              <span class="mdi mdi-chevron-{selectedTeamId === team.id ? 'up' : 'down'}"></span>
            </button>
            {#if selectedTeamId === team.id}
              <div class="submissions" transition:scale={{ duration: 180, start: 0.98 }}>
                {#each team.submissions as sub (sub.id)}
                  <div class="submission">
                    <div class="sub-header">
                      <span class="sub-title">{sub.taskTitle}</span>
                      <span class="sub-points">+{formatPoints(sub.taskPoints)}</span>
                    </div>
                    <div class="thumbs">
                      {#each urlsFor(sub) as url (url)}
                        <div class="thumb">
                          {#if sub.proofType === 'VIDEO'}
                            <video src={url} controls></video>
                          {:else}
                            <img src={url} alt="" />
                          {/if}
                          <a href={url} download={filenameFromUrl(url)} class="download">Download</a>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/each}
                {#if team.submissions.length === 0}
                  <p class="empty">No submissions for this team.</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </main>
{:else}
  <p>{loading ? 'Loading…' : ''}</p>
{/if}

<style>
  .team-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .team-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    overflow: hidden;
  }

  .team-header {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.85rem 1rem;
    background: none;
    border: none;
    font: inherit;
    color: var(--text);
    cursor: pointer;
    text-align: left;
  }

  .team-header .team-name {
    flex: 1;
    font-weight: bold;
  }

  .team-header .count {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .submissions {
    padding: 0 1rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .submission {
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
  }

  .submission:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .sub-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
  }

  .sub-title {
    font-weight: 600;
  }

  .sub-points {
    color: var(--success);
    font-weight: 700;
  }

  .thumbs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(8rem, 1fr));
    gap: 0.75rem;
  }

  .thumb {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .thumb img,
  .thumb video {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: 0.35rem;
    background: var(--card);
  }

  .download {
    display: inline-block;
    text-align: center;
    padding: 0.35rem;
    background: var(--brand);
    color: #fff;
    text-decoration: none;
    border-radius: 0.25rem;
    font-size: 0.85rem;
  }

  .empty {
    color: var(--muted);
    margin: 0;
  }
</style>
