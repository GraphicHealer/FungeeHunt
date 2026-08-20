<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';

  const code = $page.params.code;

  let data: any = null;
  let error = '';
  let currentSlide = 0;
  let slideTimer: ReturnType<typeof setInterval>;
  let socket: any;

  async function load() {
    const res = await fetch(`/api/view/${code}`);
    if (res.ok) {
      const next = await res.json();
      if (data && next.recent?.[0]?.id !== data.recent?.[0]?.id) {
        currentSlide = 0;
      }
      data = next;
    } else {
      error = 'Could not load viewer';
    }
  }

  onMount(() => {
    load();

    socket = io({
      transports: ['websocket', 'polling'],
    });
    socket.on(`game:${code.toUpperCase()}`, load);

    slideTimer = setInterval(() => {
      if (data?.recent?.length) {
        currentSlide = (currentSlide + 1) % data.recent.length;
      }
    }, 6000);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    clearInterval(slideTimer);
  });
</script>

<main class="viewer">
  {#if data}
    <header>
      <h1>{data.game.name}</h1>
      <div class="status">
        <span class="badge">{data.game.status}</span>
        {#if data.remaining}
          <span class="remaining">{data.remaining} REMAINING</span>
        {/if}
      </div>
    </header>

    <section class="main">
      <aside class="leaderboard">
        <h2>LEADERBOARD</h2>
        <ol>
          {#each data.leaderboard as team, i (team.id)}
            <li>
              <span class="rank">{i + 1}</span>
              <span class="name">{team.name ?? 'Unnamed team'}</span>
              <span class="score">{team.score}</span>
            </li>
          {/each}
        </ol>
      </aside>

      <div class="stage">
        {#if data.recent?.length}
          <figure class="slide">
            <img
              src={data.recent[currentSlide].proofUrl}
              alt={data.recent[currentSlide].task?.title ?? 'Submitted photo'}
            />
            <figcaption>
              <span class="team">{data.recent[currentSlide].team?.name ?? 'Unknown team'}</span>
              <span class="task">{data.recent[currentSlide].task?.title ?? ''}</span>
              <span class="points">+{data.recent[currentSlide].task?.points ?? 0}</span>
            </figcaption>
          </figure>
        {:else}
          <div class="empty">Waiting for the first submission...</div>
        {/if}
      </div>
    </section>

    <footer class="feed">
      <h2>LATEST UPDATES</h2>
      <div class="ticker">
        {#each data.recent.slice(0, 8) as item (item.id)}
          <div class="item">
            <strong>{item.team?.name ?? 'Unknown team'}</strong>
            completed <em>{item.task?.title ?? ''}</em>
            <span class="pts">+{item.task?.points ?? 0}</span>
          </div>
        {/each}
      </div>
    </footer>
  {:else if error}
    <p class="error">{error}</p>
  {:else}
    <p class="loading">Loading...</p>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #111;
    color: #fff;
    font-family: system-ui, sans-serif;
  }

  .viewer {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1rem;
    box-sizing: border-box;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid #333;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .status {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 1.25rem;
  }

  .remaining {
    font-weight: bold;
  }

  .main {
    flex: 1;
    display: flex;
    gap: 1rem;
    min-height: 0;
  }

  .leaderboard {
    width: 20rem;
    background: #1a1a1a;
    padding: 1rem;
    overflow-y: auto;
  }

  .leaderboard ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .leaderboard li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.25rem;
  }

  .rank {
    width: 1.5rem;
    font-weight: bold;
  }

  .name {
    flex: 1;
  }

  .score {
    font-weight: bold;
  }

  .stage {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000;
    position: relative;
  }

  .slide {
    margin: 0;
    text-align: center;
    max-height: 100%;
  }

  .slide img {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
  }

  figcaption {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 1.5rem;
  }

  .points {
    font-weight: bold;
    color: #4ade80;
  }

  .empty,
  .loading {
    font-size: 2rem;
  }

  .feed {
    margin-top: 1rem;
    background: #1a1a1a;
    padding: 0.5rem 1rem;
  }

  .ticker {
    display: flex;
    gap: 2rem;
    overflow-x: auto;
  }

  .item {
    white-space: nowrap;
    font-size: 1.1rem;
  }

  .pts {
    color: #4ade80;
    margin-left: 0.5rem;
  }

  .error {
    color: red;
  }
</style>
