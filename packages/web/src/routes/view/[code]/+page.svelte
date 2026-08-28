<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;

  let data: any = null;
  let error = '';
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let socket: any;
  let recapPlayed = false;

  let now = Date.now();

  const MIN_PHOTO_MS = 6000;
  const MAX_THUMBNAILS = 18;

  let queue: any[] = [];
  let seen = new Set<string>();
  let activeItem: any = null;
  let displayed: any[] = [];
  let isProcessing = false;
  let photoTimer: ReturnType<typeof setTimeout> | null = null;
  let activeVideo: HTMLVideoElement | null = null;

  function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function isVideo(sub: any) {
    if (!sub.proofUrl) return false;
    if (sub.task?.proofType === 'VIDEO') return true;
    return sub.proofUrl.endsWith('.mp4') || sub.proofUrl.endsWith('.mov') || sub.proofUrl.endsWith('.webm');
  }

  function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  function thumbStyle() {
    return {
      left: `${random(8, 58)}%`,
      top: `${random(8, 45)}%`,
      scale: random(0.85, 1.0),
      rotate: random(-8, 8),
      zIndex: displayed.length,
    };
  }

  function addToQueue(newData: any[]) {
    if (!newData?.length) return;
    const items: any[] = [];
    for (const sub of newData) {
      if (!seen.has(sub.id)) {
        seen.add(sub.id);
        items.push({ ...sub, _isVideo: isVideo(sub) });
      }
    }
    if (items.length) {
      queue = [...queue, ...items.slice().reverse()];
      startQueue();
    }
  }

  async function load() {
    const res = await fetch(`/api/view/${code}`);
    if (res.ok) {
      const next = await res.json();
      const previous = data?.recent ?? [];
      data = next;
      setupTimers();
      addToQueue(next.recent ?? []);
    } else {
      error = 'Could not load viewer';
    }
  }

  function setupTimers() {
    if (countdownTimer) clearInterval(countdownTimer);

    if (data?.game?.status === 'NOT_STARTED') {
      countdownTimer = setInterval(() => {
        now = Date.now();
      }, 1000);
    }
  }

  function startQueue() {
    if (isProcessing || !queue.length || activeItem || data?.game?.status !== 'LIVE') return;

    isProcessing = true;
    const next = queue.shift();
    activeItem = next ? { ...next, startedAt: Date.now() } : null;
    queue = queue;

    if (!activeItem) {
      isProcessing = false;
      return;
    }

    if (activeItem._isVideo) {
      // wait for on:ended in the active video element
    } else {
      photoTimer = setTimeout(finishActive, MIN_PHOTO_MS);
    }
  }

  function finishActive() {
    if (!activeItem) return;

    const style = thumbStyle();
    const thumb = { ...activeItem, thumbStyle: style, thumbnail: true };
    displayed = [...displayed, thumb];

    if (displayed.length > MAX_THUMBNAILS) {
      displayed = displayed.slice(displayed.length - MAX_THUMBNAILS);
    }

    if (photoTimer) {
      clearTimeout(photoTimer);
      photoTimer = null;
    }

    activeItem = null;
    isProcessing = false;

    setTimeout(startQueue, 250);
  }

  function handleVideoEnded() {
    finishActive();
  }

  function handleVideoLoaded() {
    if (activeVideo && data?.game?.status === 'LIVE') {
      activeVideo.play().catch(() => {});
    }
  }

  onMount(() => {
    load();

    socket = io({
      transports: ['websocket', 'polling'],
    });
    socket.on(`game:${code.toUpperCase()}`, load);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (countdownTimer) clearInterval(countdownTimer);
    if (photoTimer) clearTimeout(photoTimer);
  });

  $: startsIn = data?.game?.startAt
    ? new Date(data.game.startAt).getTime() - now
    : null;
</script>

<main class="viewer">
  {#if data}
    {#if data.game.status === 'NOT_STARTED'}
      <div class="viewer-join">
        <h1 class="viewer-title">{data.game.name}</h1>
        <p class="viewer-hint">Scan the QR code or visit the URL below to join</p>

        {#if data.game.qrUrl}
          <img class="qr" src={data.game.qrUrl} alt="Join game QR code" />
        {/if}

        <p class="viewer-code">{data.game.code}</p>
        <a class="viewer-url" href={data.game.joinUrl} target="_blank" rel="noreferrer">{data.game.joinUrl}</a>

        {#if startsIn !== null}
          <p class="viewer-countdown">{formatDuration(startsIn)}</p>
          <p class="viewer-hint">until the game starts</p>
        {:else}
          <p class="viewer-countdown">Waiting for the Game Master to start…</p>
        {/if}
      </div>
    {:else}
      <header class="viewer-header">
        <h1>{data.game.name}</h1>
        <div class="viewer-status">
          <span class="viewer-badge">{data.game.status}</span>
          {#if data.remaining}
            <span class="viewer-remaining">{data.remaining} REMAINING</span>
          {/if}
        </div>
      </header>

      {#if data.game.status === 'COMPLETED' && (!data.game.recapVideoUrl || recapPlayed)}
        <section class="viewer-join viewer-archive">
          <h1 class="viewer-title">Download Submissions</h1>
          <p class="viewer-hint">Scan the QR code or visit the URL below to download every team&apos;s photos and videos</p>

          {#if data.game.archiveQrUrl}
            <img class="qr" src={data.game.archiveQrUrl} alt="Download submissions QR code" />
          {/if}

          <p class="viewer-code">{data.game.code}</p>
          <a class="viewer-url" href={data.game.archiveUrl} target="_blank" rel="noreferrer">{data.game.archiveUrl}</a>
        </section>
      {/if}

      <section class="viewer-main">
        <aside class="viewer-panel viewer-leaderboard">
          <h2>LEADERBOARD</h2>
          <ol>
            {#each data.leaderboard as team, i (team.id)}
              <li>
                <span class="rank">{i + 1}</span>
                <span class="name">{team.name ?? 'Unnamed team'}</span>
                <span class="score">{formatPoints(team.score)}</span>
              </li>
            {/each}
          </ol>
        </aside>

        <div class="viewer-stage">
          {#if displayed.length}
            {#each displayed as item (item.id)}
              <div
                class="collage-item"
                style="left: {item.thumbStyle.left}; top: {item.thumbStyle.top}; transform: scale({item.thumbStyle.scale}) rotate({item.thumbStyle.rotate}deg); z-index: {item.thumbStyle.zIndex};"
              >
                {#if item._isVideo}
                  <video class="collage-thumb" src={item.proofUrl} muted preload="metadata" playsinline></video>
                {:else}
                  <img class="collage-thumb" src={item.proofUrl} alt={item.task?.title ?? 'Submission'} />
                {/if}
                <span class="collage-label">{item.team?.name ?? 'Unknown team'}</span>
              </div>
            {/each}
          {/if}

          {#if activeItem}
            <div class="collage-active" style="z-index: {displayed.length + 10}">
              {#if activeItem._isVideo}
                <video
                  bind:this={activeVideo}
                  class="collage-active-media"
                  src={activeItem.proofUrl}
                  playsinline
                  autoplay
                  on:loadedmetadata={handleVideoLoaded}
                  on:ended={handleVideoEnded}
                ></video>
              {:else}
                <img
                  class="collage-active-media"
                  src={activeItem.proofUrl}
                  alt={activeItem.task?.title ?? 'Submitted photo'}
                />
              {/if}
              <div class="collage-caption">
                <span class="team">{activeItem.team?.name ?? 'Unknown team'}</span>
                <span class="task">{activeItem.task?.title ?? ''}</span>
                <span class="points">+{formatPoints(activeItem.task?.points ?? 0)}</span>
              </div>
            </div>
          {:else if !displayed.length}
            <div class="viewer-empty">Waiting for the first submission…</div>
          {/if}
        </div>
      </section>

      {#if data.game.status === 'COMPLETED' && data.game.recapVideoUrl}
        <section class="viewer-panel viewer-recap">
          <h2>EVENT RECAP</h2>
          <video
            src={data.game.recapVideoUrl}
            controls
            autoplay
            on:ended={() => (recapPlayed = true)}
            style="width: 100%; max-height: 60vh;"
          ></video>
          <p class="recap-attribution">Music by Kevin MacLeod - incompetech.com</p>
        </section>
      {/if}

      <footer class="viewer-panel viewer-feed">
        <h2>LATEST UPDATES</h2>
        <div class="viewer-ticker">
          {#each data.recent.slice(0, 8) as item (item.id)}
            <div class="viewer-item">
              <strong>{item.team?.name ?? 'Unknown team'}</strong>
              completed <em>{item.task?.title ?? ''}</em>
              <span class="viewer-pts">+{formatPoints(item.task?.points ?? 0)}</span>
            </div>
          {/each}
        </div>
      </footer>
    {/if}
  {:else if error}
    <p class="viewer-error">{error}</p>
  {:else}
    <p class="viewer-loading">Loading…</p>
  {/if}
</main>

<style>
  .viewer {
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding: 1.5rem;
    box-sizing: border-box;
    background: var(--bg);
    color: var(--text);
  }

  .viewer-join {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    gap: 1rem;
  }

  .viewer-title {
    margin: 0;
    font-size: 3rem;
    color: var(--brand);
  }

  .viewer-hint {
    margin: 0;
    color: var(--muted);
    font-size: 1.25rem;
  }

  .qr {
    width: 16rem;
    height: 16rem;
    max-width: 40vw;
    max-height: 40vh;
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    background: #fff;
    padding: 0.5rem;
  }

  .viewer-code {
    margin: 0;
    font-family: monospace;
    font-size: 3.5rem;
    font-weight: bold;
    letter-spacing: 0.4rem;
    color: var(--brand);
  }

  .viewer-url {
    color: var(--brand);
    font-size: 1.5rem;
    text-decoration: none;
    word-break: break-all;
  }

  .viewer-url:hover {
    text-decoration: underline;
  }

  .viewer-countdown {
    margin: 0;
    font-size: 3rem;
    font-weight: bold;
    font-family: monospace;
  }

  .viewer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.75rem;
    margin-bottom: 1rem;
  }

  .viewer-header h1 {
    margin: 0;
    font-size: 2rem;
    color: var(--text);
  }

  .viewer-status {
    display: flex;
    gap: 1rem;
    align-items: center;
    font-size: 1.25rem;
  }

  .viewer-badge {
    background: var(--success);
    color: #fff;
    padding: 0.35rem 0.75rem;
    border-radius: 999px;
    font-weight: 700;
    font-size: 0.95rem;
  }

  .viewer-remaining {
    font-weight: bold;
  }

  .viewer-main {
    flex: 1;
    display: flex;
    gap: 1rem;
    min-height: 0;
  }

  .viewer-panel {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    box-shadow: var(--shadow);
  }

  .viewer-panel h2 {
    margin: 0 0 0.75rem;
    font-size: 1.1rem;
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .viewer-leaderboard {
    width: 22rem;
    overflow-y: auto;
  }

  .archive-hint {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .viewer-archive {
    position: absolute;
    inset: 0;
    z-index: 100;
  }

  .viewer-leaderboard ol {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .viewer-leaderboard li {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.15rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    background: var(--bg);
    border: 1px solid var(--border);
  }

  .rank {
    width: 1.75rem;
    font-weight: bold;
    color: var(--brand);
  }

  .name {
    flex: 1;
  }

  .score {
    font-weight: bold;
  }

  .viewer-stage {
    flex: 1;
    position: relative;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    overflow: hidden;
  }

  .viewer-empty,
  .viewer-loading {
    font-size: 2rem;
    color: var(--muted);
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .collage-item {
    position: absolute;
    width: 28%;
    min-width: 10rem;
    max-width: 22rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    box-shadow: var(--shadow);
  }

  .collage-thumb {
    width: 100%;
    height: auto;
    max-height: 38%;
    object-fit: contain;
    border-radius: 0.35rem;
    background: var(--bg);
  }

  .collage-label {
    font-size: 0.85rem;
    color: var(--text);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .collage-active {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.25);
    backdrop-filter: blur(3px);
  }

  .collage-active-media {
    max-width: 80%;
    max-height: 70%;
    object-fit: contain;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: #000;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.4);
  }

  .collage-caption {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    font-size: 1.5rem;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
  }

  .collage-caption .team {
    font-weight: bold;
  }

  .collage-caption .points {
    color: var(--success);
    font-weight: bold;
  }

  .viewer-recap {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .viewer-recap video {
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: #000;
  }

  .recap-attribution {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
    text-align: center;
  }

  .viewer-feed {
    margin-top: 1rem;
  }

  .viewer-ticker {
    display: flex;
    gap: 2rem;
    overflow-x: auto;
  }

  .viewer-item {
    white-space: nowrap;
    font-size: 1.1rem;
    color: var(--text);
  }

  .viewer-pts {
    color: var(--success);
    margin-left: 0.5rem;
    font-weight: bold;
  }

  .viewer-error {
    color: var(--danger);
  }
</style>
