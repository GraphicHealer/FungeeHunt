<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code ?? '';

  let data: any = null;
  let error = '';
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let socket: any;
  let myTeamId: string | null = null;

  let now = Date.now();

  const MIN_PHOTO_MS = 6000;
  const MULTI_PHOTO_MS = 2500;

  let queue: any[] = [];
  let seen = new Set<string>();
  let activeItem: any = null;
  let displayed: any[] = [];
  let isProcessing = false;
  let photoTimer: ReturnType<typeof setTimeout> | null = null;
  let activeVideo: HTMLVideoElement | null = null;
  let activePhoto: HTMLImageElement | null = null;
  let stage: HTMLDivElement | null = null;

  let viewSubmissions = false;
  let mediaIndex = 0;
  let mediaItems: any[] = [];
  let galleryWrap: HTMLDivElement | null = null;

  $: if (data?.game?.status !== 'RESULTS') viewSubmissions = false;

  const placementKey = `viewPlacement:${code.toUpperCase()}`;
  let placementMap: Record<string, any> = {};

  function loadPlacements() {
    try {
      placementMap = JSON.parse(localStorage.getItem(placementKey) || '{}');
    } catch {
      placementMap = {};
    }
  }

  function savePlacements() {
    localStorage.setItem(placementKey, JSON.stringify(placementMap));
  }

  function formatDuration(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function buildMediaItems() {
    if (!data?.submissions) {
      mediaItems = [];
      return;
    }
    const items: any[] = [];
    for (const sub of data.submissions) {
      if (sub.task?.proofType === 'VIDEO') {
        if (sub.videoStatus === 'READY' && sub.proofUrl) {
          items.push({ type: 'video', url: sub.proofUrl, team: sub.team, task: sub.task });
        }
      } else if (sub.task?.proofType === 'PHOTOS' && sub.proofUrls?.length) {
        for (const url of sub.proofUrls) {
          items.push({ type: 'photo', url, team: sub.team, task: sub.task });
        }
      } else if (sub.proofUrl) {
        items.push({ type: 'photo', url: sub.proofUrl, team: sub.team, task: sub.task });
      }
    }
    mediaItems = items;
    if (mediaIndex >= mediaItems.length) mediaIndex = 0;
    if (mediaIndex < 0) mediaIndex = 0;
  }

  function prevMedia() {
    if (!mediaItems.length) return;
    mediaIndex = mediaIndex > 0 ? mediaIndex - 1 : mediaItems.length - 1;
  }

  function nextMedia() {
    if (!mediaItems.length) return;
    mediaIndex = mediaIndex < mediaItems.length - 1 ? mediaIndex + 1 : 0;
  }

  function onGalleryKey(e: KeyboardEvent) {
    if (!viewSubmissions) return;
    if (e.key === 'ArrowLeft' || e.key === 'Left') {
      e.preventDefault();
      prevMedia();
    } else if (e.key === 'ArrowRight' || e.key === 'Right') {
      e.preventDefault();
      nextMedia();
    }
  }

  function isVideo(sub: any) {
    if (!sub.proofUrl) return false;
    if (sub.task?.proofType === 'VIDEO') return true;
    return sub.proofUrl.endsWith('.mp4') || sub.proofUrl.endsWith('.mov') || sub.proofUrl.endsWith('.webm');
  }

  function viewerReady(sub: any) {
    return !isVideo(sub) || sub.videoStatus === 'READY';
  }

  function random(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  function computeItemDimensions(intrinsicW: number, intrinsicH: number) {
    const fallback = { width: 24, h: 30, itemW: 0, itemH: 0 };
    if (!stage) return fallback;
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const pad = 0.5 * fontSize;
    const gap = 0.35 * fontSize;
    const labelH = 2 * fontSize;
    const maxItemH = stageH * 0.6;

    let itemW = Math.min(Math.max(stageW * 0.24, 10 * fontSize), 18 * fontSize);
    const contentW = Math.max(itemW - 2 * pad, 1);
    let thumbH = contentW * (intrinsicH / intrinsicW);
    let itemH = thumbH + labelH + gap + 2 * pad;

    if (itemH > maxItemH) {
      const maxThumbH = Math.max(1, maxItemH - labelH - gap - 2 * pad);
      const newContentW = maxThumbH * (intrinsicW / intrinsicH);
      itemW = newContentW + 2 * pad;
      if (itemW < 10 * fontSize) itemW = 10 * fontSize;
      thumbH = (itemW - 2 * pad) * (intrinsicH / intrinsicW);
      itemH = thumbH + labelH + gap + 2 * pad;
    }

    return {
      width: (itemW / stageW) * 100,
      h: (itemH / stageH) * 100,
      itemW,
      itemH,
    };
  }

  function nextPosition(intrinsicW: number, intrinsicH: number, items: any[]) {
    const dims = computeItemDimensions(intrinsicW, intrinsicH);
    const wPct = dims.width;
    const hPct = dims.h;
    const margin = 1;

    const existing = items
      .filter((it) => it?.thumbStyle?.w && it?.thumbStyle?.h)
      .map((it) => ({
        x: parseFloat(it.thumbStyle.left),
        y: parseFloat(it.thumbStyle.top),
        w: it.thumbStyle.w,
        h: it.thumbStyle.h,
      }));

    let best: { x: number; y: number; overlap: number; minDist: number } | null = null;
    const attempts = 120;
    const xRange = Math.max(0, 100 - wPct - 2 * margin);
    const yRange = Math.max(0, 100 - hPct - 2 * margin);
    for (let i = 0; i < attempts; i++) {
      const x = margin + Math.random() * xRange;
      const y = margin + Math.random() * yRange;
      let overlap = 0;
      let minDist = Infinity;
      for (const e of existing) {
        if (
          x + wPct < e.x ||
          x > e.x + e.w ||
          y + hPct < e.y ||
          y > e.y + e.h
        ) {
          const dx = x + wPct / 2 - (e.x + e.w / 2);
          const dy = y + hPct / 2 - (e.y + e.h / 2);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < minDist) minDist = dist;
        } else {
          const ox = Math.max(0, Math.min(x + wPct, e.x + e.w) - Math.max(x, e.x));
          const oy = Math.max(0, Math.min(y + hPct, e.y + e.h) - Math.max(y, e.y));
          overlap += ox * oy;
          minDist = 0;
        }
      }
      if (minDist === Infinity) minDist = 100;
      if (!best || overlap < best.overlap || (overlap === best.overlap && minDist > best.minDist)) {
        best = { x, y, overlap, minDist };
      }
    }

    if (!best) best = { x: 50 - wPct / 2, y: 50 - hPct / 2, overlap: 0, minDist: 0 };

    return {
      left: `${best.x}%`,
      top: `${best.y}%`,
      width: wPct,
      w: wPct,
      h: hPct,
      scale: random(0.9, 1.0),
      rotate: random(-6, 6),
      zIndex: items.length,
    };
  }

  function addToQueue(newData: any[]) {
    if (!newData?.length) return;
    const items: any[] = [];
    for (const sub of newData) {
      if (!viewerReady(sub)) continue;
      if (sub.task?.proofType === 'PHOTOS' && sub.proofUrls?.length) {
        for (let i = 0; i < sub.proofUrls.length; i++) {
          const url = sub.proofUrls[i];
          if (!seen.has(url)) {
            seen.add(url);
            items.push({ ...sub, id: `${sub.id}-${i}`, proofUrl: url, _isVideo: false, _isMulti: true });
          }
        }
      } else if (!seen.has(sub.id)) {
        seen.add(sub.id);
        items.push({ ...sub, _isVideo: isVideo(sub), _isMulti: false });
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
      const isFirst = !data;
      data = next;
      setupTimers();
      buildMediaItems();
      if (isFirst) {
        initRecent(next.recent ?? []);
      } else {
        addToQueue(next.recent ?? []);
      }
    } else if (res.status === 404) {
      goto('/?notfound=1');
    } else {
      error = 'Could not load viewer';
    }
  }

  function initRecent(recentData: any[]) {
    loadPlacements();
    const seed: any[] = [];
    for (const sub of recentData) {
      if (!viewerReady(sub)) continue;
      if (sub.task?.proofType === 'PHOTOS' && sub.proofUrls?.length) {
        for (let i = 0; i < sub.proofUrls.length; i++) {
          const url = sub.proofUrls[i];
          if (!seen.has(url)) {
            seen.add(url);
            const id = `${sub.id}-${i}`;
            const item = { ...sub, id, proofUrl: url, _isVideo: false, _isMulti: true };
            const style = placementMap[id] ?? nextPosition(1280, 720, seed);
            placementMap[id] = style;
            seed.push({ ...item, thumbStyle: style, thumbnail: true });
          }
        }
      } else if (!seen.has(sub.id)) {
        seen.add(sub.id);
        const id = sub.id;
        const item = { ...sub, _isVideo: isVideo(sub), _isMulti: false };
        const style = placementMap[id] ?? nextPosition(1280, 720, seed);
        placementMap[id] = style;
        seed.push({ ...item, thumbStyle: style, thumbnail: true });
      }
    }
    displayed = seed;
    savePlacements();
  }

  async function loadMyTeam() {
    const token = localStorage.getItem(`token:${code}`);
    if (!token) return;
    try {
      const res = await fetch(`/api/play/${code}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const state = await res.json();
        myTeamId = state.team?.id ?? null;
      }
    } catch (err) {
      // ignore; viewer is still public
    }
  }

  function setupTimers() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      now = Date.now();
    }, 1000);
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
      const hold = activeItem._isMulti ? MULTI_PHOTO_MS : MIN_PHOTO_MS;
      photoTimer = setTimeout(finishActive, hold);
    }
  }

  function finishActive() {
    if (!activeItem) return;

    let intrinsicW = 1280;
    let intrinsicH = 720;
    let thumbData = null as { dataUrl: string; w: number; h: number } | null;

    if (activeItem._isVideo && activeVideo) {
      thumbData = createVideoThumb(activeVideo);
      if (thumbData) {
        intrinsicW = thumbData.w;
        intrinsicH = thumbData.h;
      }
    } else if (activePhoto) {
      intrinsicW = activePhoto.naturalWidth || 1280;
      intrinsicH = activePhoto.naturalHeight || 720;
    }

    const style = placementMap[activeItem.id] ?? nextPosition(intrinsicW, intrinsicH, displayed);
    placementMap[activeItem.id] = style;
    const thumb: any = { ...activeItem, thumbStyle: style, thumbnail: true };
    if (thumbData) {
      thumb.thumbUrl = thumbData.dataUrl;
    }
    displayed = [...displayed, thumb];
    savePlacements();

    if (photoTimer) {
      clearTimeout(photoTimer);
      photoTimer = null;
    }

    activeItem = null;
    isProcessing = false;

    setTimeout(startQueue, 250);
  }

  function createVideoThumb(video: HTMLVideoElement) {
    const canvas = document.createElement('canvas');
    const max = 640;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    let w = vw;
    let h = vh;
    if (vw > max || vh > max) {
      if (vw > vh) {
        w = max;
        h = Math.round((vh * max) / vw);
      } else {
        h = max;
        w = Math.round((vw * max) / vh);
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, w, h);
    return { dataUrl: canvas.toDataURL('image/jpeg', 0.85), w, h };
  }

  function handleVideoEnded() {
    finishActive();
  }

  function handleCanPlayThrough() {
    if (activeVideo && activeVideo.paused && data?.game?.status === 'LIVE') {
      activeVideo.play().catch(() => {});
    }
  }

  onMount(async () => {
    await load();
    await loadMyTeam();

    socket = io({
      transports: ['websocket', 'polling'],
    });
    socket.on(`game:${code.toUpperCase()}`, (payload: any) => {
      if (payload?.type === 'deleted') {
        goto('/spectator');
        return;
      }
      load();
    });

    window.addEventListener('keydown', onGalleryKey);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    window.removeEventListener('keydown', onGalleryKey);
    if (countdownTimer) clearInterval(countdownTimer);
    if (photoTimer) clearTimeout(photoTimer);
  });

  $: startsIn = data?.game?.startAt
    ? new Date(data.game.startAt).getTime() - now
    : null;
  $: endsIn = data?.game?.status === 'LIVE' && data?.game?.endAt
    ? Math.max(0, new Date(data.game.endAt).getTime() - now)
    : null;
  $: myTeam = data?.leaderboard && myTeamId
    ? data.leaderboard.find((t: any) => t.id === myTeamId)
    : null;
  let missedTitles = '';
  $: missedTitles = myTeam
    ? (data.tasks as any[])
        .filter((t) => !(myTeam.completedTaskIds ?? []).includes(t.id))
        .map((t) => t.title)
        .join(', ')
    : '';
</script>

<main class="viewer">
  {#if data}
    {#if viewSubmissions}
      <div class="submissions-gallery" bind:this={galleryWrap}>
        <aside class="submissions-sidebar">
          <div class="sidebar-rankings">
            <h3>FINAL STANDINGS</h3>
            <ol class="sidebar-standings">
              {#each data.leaderboard as team, i (team.id)}
                <li class="sidebar-team" class:winner={i === 0}>
                  <span class="sidebar-rank">{i + 1}</span>
                  <span class="sidebar-name">{team.name ?? 'Unnamed team'}</span>
                  <span class="sidebar-score">{formatPoints(team.score)}</span>
                </li>
              {/each}
            </ol>
          </div>
          <div class="sidebar-archive">
            <h3>Download Submissions</h3>
            {#if data.game.archiveQrUrl}
              <img class="qr" src={data.game.archiveQrUrl} alt="Download submissions QR code" />
            {/if}
            <a class="viewer-url" href={data.game.archiveUrl} target="_blank" rel="noreferrer">{data.game.archiveUrl}</a>
          </div>
        </aside>

        <section class="gallery-stage">
          {#if mediaItems[mediaIndex]}
            {@const item = mediaItems[mediaIndex]}
            <div class="gallery-media">
              {#if item.type === 'video'}
                <video src={item.url} controls autoplay muted style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              {:else}
                <img src={item.url} alt="{item.task?.title ?? ''} by {item.team?.name ?? ''}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
              {/if}
            </div>
            <div class="gallery-meta">
              <span class="gallery-task">{item.task?.title ?? ''}</span>
              <span class="gallery-team">{item.team?.name ?? ''}</span>
              <span class="gallery-count">{mediaIndex + 1} / {mediaItems.length}</span>
            </div>
          {:else}
            <p class="gallery-empty">No submissions yet.</p>
          {/if}

          <button class="gallery-arrow gallery-arrow-left" on:click={prevMedia} aria-label="Previous" disabled={mediaItems.length <= 1}>
            <span class="mdi mdi-chevron-left"></span>
          </button>
          <button class="gallery-arrow gallery-arrow-right" on:click={nextMedia} aria-label="Next" disabled={mediaItems.length <= 1}>
            <span class="mdi mdi-chevron-right"></span>
          </button>
        </section>
      </div>
    {:else if data.game.status === 'NOT_STARTED'}
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
    {:else if data.game.status === 'RESULTS'}
      <div class="results-stage">
        <h1 class="viewer-title">{data.game.name}</h1>
        <h2 class="results-subtitle">FINAL STANDINGS</h2>

        {#if data.leaderboard[0]}
          <div class="winner-card">
            <span class="mdi mdi-trophy winner-icon" aria-hidden="true"></span>
            <span class="winner-rank">1st</span>
            <span class="winner-name">{data.leaderboard[0].name ?? 'Unnamed team'}</span>
            <span class="winner-score">{formatPoints(data.leaderboard[0].score)} POINTS</span>
          </div>
        {/if}

        {#if data.leaderboard.length > 1}
          <div class="runner-up-grid">
            {#each data.leaderboard.slice(1, 3) as team, i (team.id)}
              <div class="runner-up-card">
                <span class="runner-up-rank">{i + 2}</span>
                <span class="runner-up-name">{team.name ?? 'Unnamed team'}</span>
                <span class="runner-up-score">{formatPoints(team.score)} POINTS</span>
              </div>
            {/each}
          </div>
        {/if}

        {#if data.leaderboard.length > 3}
          <ol class="results-rest">
            {#each data.leaderboard.slice(3) as team, i (team.id)}
              <li class="results-rest-item">
                <span class="rank">{i + 4}</span>
                <span class="name">{team.name ?? 'Unnamed team'}</span>
                <span class="score">{formatPoints(team.score)} POINTS</span>
              </li>
            {/each}
          </ol>
        {/if}

        <button class="fungee-btn" style="margin-top: 1.5rem;" on:click={() => (viewSubmissions = true)}>VIEW SUBMISSIONS</button>
      </div>
    {:else}
      <header class="viewer-header">
        <h1>{data.game.name}</h1>
        <div class="viewer-status">
          <span class="viewer-badge">{data.game.status}</span>
          {#if endsIn !== null}
            <span class="viewer-remaining">{formatDuration(endsIn)} REMAINING</span>
          {/if}
        </div>
      </header>

      {#if data.game.status === 'COMPLETED' && myTeam}
          <section class="viewer-join viewer-archive">
            <h1 class="viewer-title">Your Team&apos;s Challenges</h1>
            <ul class="viewer-challenge-list">
              <li class="viewer-challenge-item">
                <span class="team-name">{myTeam.name ?? 'Unnamed team'}</span>
                <span class="completion">{myTeam.completed} / {data.tasks.length} completed</span>
                {#if myTeam.completed < data.tasks.length}
                  <span class="missed">
                    Missed: {missedTitles}
                  </span>
                {:else}
                  <span class="missed all-done">Completed every challenge!</span>
                {/if}
              </li>
            </ul>
          </section>
        {/if}

      {#if data.game.status === 'COMPLETED'}
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

        <div class="viewer-stage" bind:this={stage}>
          {#if displayed.length}
            {#each displayed as item, i (item.id)}
              <div
                class="collage-item"
                style="left: {item.thumbStyle.left}; top: {item.thumbStyle.top}; width: {item.thumbStyle.width}%; transform: scale({item.thumbStyle.scale}) rotate({item.thumbStyle.rotate}deg); z-index: {item.thumbStyle.zIndex};"
              >
                {#if item._isVideo && !item.thumbUrl}
                  <video class="collage-thumb" src={item.proofUrl} muted preload={i === displayed.length - 1 ? 'metadata' : 'none'} playsinline></video>
                {:else}
                  <img class="collage-thumb" src={item.thumbUrl ?? item.proofUrl} alt={item.task?.title ?? 'Submission'} loading="lazy" decoding="async" />
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
                  preload="auto"
                  on:canplaythrough={handleCanPlayThrough}
                  on:ended={handleVideoEnded}
                ></video>
              {:else}
                <img
                  bind:this={activePhoto}
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
    background: var(--bg);
  }

  .viewer-challenge-list {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    text-align: left;
    max-width: 32rem;
    width: 100%;
  }

  .viewer-challenge-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .viewer-challenge-item .team-name {
    font-weight: bold;
    font-size: 1.1rem;
  }

  .viewer-challenge-item .completion {
    color: var(--success);
    font-weight: 600;
  }

  .viewer-challenge-item .missed {
    color: var(--muted);
    font-size: 0.9rem;
    line-height: 1.3;
  }

  .viewer-challenge-item .missed.all-done {
    color: var(--success);
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
    width: auto;
    box-sizing: border-box;
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
    display: block;
    width: auto;
    height: auto;
    max-width: 80%;
    max-height: 70%;
    object-fit: contain;
    border-radius: 0.5rem;
    border: 1px solid var(--border);
    background: #000;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.4);
    margin: auto;
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

  .results-stage {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1.5rem;
    gap: 1.5rem;
    min-height: 100vh;
  }

  .results-subtitle {
    margin: 0;
    color: var(--success);
    font-size: 1.5rem;
    letter-spacing: 0.1rem;
  }

  .winner-card {
    background: var(--card);
    border: 2px solid var(--brand);
    border-radius: 1rem;
    padding: 2rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    box-shadow: var(--shadow);
    min-width: 22rem;
  }

  .winner-icon {
    font-size: 3rem;
    color: var(--brand);
  }

  .winner-rank {
    font-size: 1.25rem;
    color: var(--brand);
    font-weight: bold;
  }

  .winner-name {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text);
  }

  .winner-score {
    font-size: 1.5rem;
    color: var(--success);
    font-weight: bold;
  }

  .runner-up-grid {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }

  .runner-up-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.25rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 14rem;
  }

  .runner-up-rank {
    font-size: 1rem;
    color: var(--brand);
    font-weight: bold;
  }

  .runner-up-name {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }

  .runner-up-score {
    font-size: 1rem;
    color: var(--success);
    font-weight: bold;
  }

  .results-rest {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
    max-width: 40rem;
  }

  .results-rest-item {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 1.1rem;
  }

  .results-rest-item .rank {
    width: 2.5rem;
    text-align: center;
    font-weight: bold;
    color: var(--brand);
  }

  .results-rest-item .name {
    flex: 1;
    text-align: left;
    color: var(--text);
  }

  .results-rest-item .score {
    color: var(--success);
    font-weight: bold;
  }
  .submissions-gallery {
    display: grid;
    grid-template-columns: 20rem 1fr;
    gap: 1rem;
    padding: 1rem;
    min-height: 100vh;
    align-items: start;
  }

  .submissions-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: calc(100vh - 2rem);
    position: sticky;
    top: 1rem;
  }

  .sidebar-rankings {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
  }

  .sidebar-rankings h3 {
    margin: 0 0 0.75rem;
    color: var(--brand);
    font-size: 1.1rem;
  }

  .sidebar-standings {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .sidebar-team {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: var(--bg);
    font-size: 0.95rem;
  }

  .sidebar-team.winner {
    border: 1px solid var(--brand);
    background: rgba(255, 255, 255, 0.05);
  }

  .sidebar-rank {
    width: 1.75rem;
    font-weight: bold;
    color: var(--brand);
  }

  .sidebar-name {
    flex: 1;
    text-align: left;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sidebar-score {
    font-weight: bold;
    color: var(--success);
  }

  .sidebar-archive {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    text-align: center;
  }

  .sidebar-archive h3 {
    margin: 0 0 0.75rem;
    color: var(--brand);
    font-size: 1.1rem;
  }

  .sidebar-archive .qr {
    max-width: 12rem;
    margin: 0 auto 0.5rem;
  }

  .gallery-stage {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: calc(100vh - 2rem);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1rem;
    overflow: hidden;
  }

  .gallery-media {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 0;
  }

  .gallery-media img,
  .gallery-media video {
    max-width: 100%;
    max-height: 70vh;
    object-fit: contain;
  }

  .gallery-meta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--bg);
    border-radius: 0.5rem;
    font-size: 1.1rem;
  }

  .gallery-task {
    font-weight: bold;
    color: var(--brand);
  }

  .gallery-team {
    color: var(--text);
  }

  .gallery-count {
    color: var(--muted);
    font-size: 0.95rem;
  }

  .gallery-empty {
    color: var(--muted);
    font-size: 1.25rem;
  }

  .gallery-arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid var(--border);
    border-radius: 50%;
    width: 3.5rem;
    height: 3.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 2.5rem;
    cursor: pointer;
  }

  .gallery-arrow:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .gallery-arrow-left {
    left: 1rem;
  }

  .gallery-arrow-right {
    right: 1rem;
  }
</style>
