<script lang="ts">
  import { page } from '$app/stores';
  import { goto, afterNavigate } from '$app/navigation';
  import { onMount, onDestroy, tick } from 'svelte';
  import { tourRefresh } from './tourStore';

  let tourStep = 0;
  let tourDone = true;
  let welcomeShown = true;
  let defaultPassphrase = false;
  let loading = false;
  let bubble: HTMLDivElement | null = null;
  let placement: 'top' | 'bottom' | 'left' | 'right' = 'top';
  let position = { top: -1000, left: -1000 };
  let arrowOffset = 0;
  let poll: ReturnType<typeof setInterval> | null = null;

  const steps = [
    {
      title: 'Create a Game',
      body: 'Click the CREATE GAME button at the top right to start the setup wizard. No password needed.',
      route: /^\/$/,
      nextPath: null,
      target: '[data-tour="create-game"]',
      placement: 'bottom',
      hideNext: true,
    },
    {
      title: 'Enter the password',
      body: 'Type the Game Master password you set in your environment configuration. Then click LOG IN.',
      route: /^\/login$/,
      nextPath: null,
      target: '[data-tour="login-button"]',
      placement: 'top',
      hideNext: true,
    },
    {
      title: 'Game Master Board',
      body: 'This is your hub. Click CREATE GAME to start the wizard and create your first scavenger hunt.',
      route: /^\/gm$/,
      nextPath: null,
      target: '[data-tour="no-games-create"]',
      fallbackTarget: '[data-tour="new-game"]',
      placement: 'bottom',
      hideNext: true,
    },
    {
      title: 'New Game: Basics',
      body: 'Step 1: enter a game name, date, and start/end times. Then click NEXT.',
      route: /^\/gm\/new$/,
      nextPath: null,
      target: '[data-tour="wizard-form"]',
      click: 'step1-next',
      placement: 'right',
      hideNext: true,
    },
    {
      title: 'New Game: Return Bonus',
      body: 'Step 2: enable the return bonus and click RANDOMIZE for a fuzzy time window. Then click NEXT.',
      route: /^\/gm\/new$/,
      nextPath: null,
      target: '[data-tour="wizard-form"]',
      click: 'step2-next',
      placement: 'right',
      hideNext: true,
    },
    {
      title: 'New Game: Tasks',
      body: 'Step 3: choose how many tasks to use. The app will pull a random, category-balanced set, and always place a Team Photo task at #1.',
      route: /^\/gm\/new$/,
      nextPath: null,
      target: '[data-tour="wizard-form"]',
      click: 'step3-next',
      placement: 'right',
      hideNext: true,
    },
    {
      title: 'New Game: Food Drive',
      body: 'Step 4: set food drive defaults if you like. When you are ready, click CREATE GAME.',
      route: /^\/gm\/new$/,
      nextPath: null,
      target: '[data-tour="wizard-form"]',
      click: 'create-game',
      placement: 'right',
      hideNext: true,
    },
    {
      title: 'Game Menus',
      body: 'Use the left sidebar to explore Dashboard, Players, Teams, Tasks, Submissions, Bonuses, Rules, and Settings.',
      route: /^\/gm\/[^/]+\/dashboard$/,
      nextPath: null,
      target: '[data-tour="game-nav"]',
      click: 'nav-ignore',
      placement: 'right',
      hideNext: false,
    },
    {
      title: 'Share the Game',
      body: 'Players join with the game code or this link. Click COPY to copy the join link.',
      route: /^\/gm\/[^/]+\/dashboard$/,
      nextPath: '/gm/{{gameId}}/players',
      target: '[data-tour="game-controls"]',
      click: 'copy-link',
      placement: 'left',
      hideNext: false,
    },
    {
      title: 'Players',
      body: 'Players show up here as they join the game. You can remove or manage them.',
      route: /^\/gm\/[^/]+\/players$/,
      nextPath: null,
      target: '[data-tour="players-page"]',
      placement: 'bottom',
      hideNext: false,
    },
    {
      title: 'Offline Players',
      body: 'If someone wants to play without a device, click ADD OFFLINE PLAYER to create a placeholder entry.',
      route: /^\/gm\/[^/]+\/players$/,
      nextPath: '/gm/{{gameId}}/teams',
      target: '[data-tour="players-page"]',
      placement: 'bottom',
      hideNext: false,
    },
    {
      title: 'Teams',
      body: 'Create teams here once enough players have joined. Each team needs at least one Team Captain.',
      route: /^\/gm\/[^/]+\/teams$/,
      nextPath: '/gm/{{gameId}}/dashboard',
      target: '[data-tour="teams-title"]',
      placement: 'bottom',
      hideNext: false,
    },
    {
      title: 'Spectator Screen',
      body: 'Click SPECTATOR to open the big-screen scoreboard on a TV or projector. It updates live as the game runs.',
      route: /^\/gm\/[^/]+\/dashboard$/,
      nextPath: null,
      target: '[data-tour="view-link"]',
      click: 'view-link',
      placement: 'left',
      hideNext: false,
    },
    {
      title: 'Print Tasks & Rules',
      body: 'You can print a handout with all tasks and rules for players without phones.',
      route: /^\/gm\/[^/]+\/dashboard$/,
      nextPath: null,
      target: '[data-tour="print-link"]',
      placement: 'bottom',
      hideNext: false,
    },
    {
      title: 'Start the Game',
      body: 'When everyone is ready, click START to make the game live. Good luck!',
      route: /^\/gm\/[^/]+\/dashboard$/,
      nextPath: null,
      target: '[data-tour="game-controls"]',
      click: 'start-game',
      placement: 'left',
      hideNext: true,
    },
  ];

  $: currentStep = steps[tourStep] ?? null;
  $: currentPath = $page.url.pathname;
  $: visible = !tourDone && welcomeShown && currentStep && currentStep.route.test(currentPath);
  $: stepNote = tourStep === 1 && defaultPassphrase ? ' The default is "changeme" — change it for real games.' : '';

  async function load() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        welcomeShown = data.welcomeShown ?? true;
        tourStep = data.tourStep ?? 0;
        tourDone = data.tourDone ?? false;
        defaultPassphrase = data.defaultPassphrase ?? false;
      }
    } catch {
      // ignore
    }
    await maybeAutoAdvance();
    await positionBubble();
  }

  async function maybeAutoAdvance() {
    if (tourDone || !currentStep || !currentStep.nextPath) return;
    if (currentStep.nextPath === currentPath && tourStep < steps.length - 1) {
      await updateTour(tourStep + 1, false);
    }
  }

  async function updateTour(step: number, done: boolean) {
    loading = true;
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tourStep: step, tourDone: done }),
      });
      if (res.ok) {
        const data = await res.json();
        tourStep = data.tourStep;
        tourDone = data.tourDone;
      }
    } catch {
      // ignore
    }
    loading = false;
  }

  function getTarget() {
    if (!currentStep || !currentStep.target) return null;
    let el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (!el && currentStep.fallbackTarget) {
      el = document.querySelector(currentStep.fallbackTarget) as HTMLElement | null;
    }
    return el;
  }

  function fits(w: number, h: number, top: number, left: number) {
    const margin = 8;
    return (
      top >= margin &&
      left >= margin &&
      top + h <= window.innerHeight - margin &&
      left + w <= window.innerWidth - margin
    );
  }

  async function positionBubble() {
    await tick();
    const el = getTarget();
    const node = bubble;
    if (!el || !node || !visible) return;

    const rect = el.getBoundingClientRect();
    const box = node.getBoundingClientRect();
    const padH = 12;
    const padV = 36;
    const arrowSize = 10;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const horizLeft = Math.max(8, Math.min(centerX - box.width / 2, window.innerWidth - box.width - 8));
    const vertTop = Math.max(8, Math.min(centerY - box.height / 2, window.innerHeight - box.height - 8));

    const all = [
      { placement: 'top' as const, top: rect.top - box.height - padV, left: horizLeft },
      { placement: 'bottom' as const, top: rect.bottom + padV, left: horizLeft },
      { placement: 'left' as const, top: vertTop, left: rect.left - box.width - padH },
      { placement: 'right' as const, top: vertTop, left: rect.right + padH },
    ];

    const order = currentStep?.placement
      ? [currentStep.placement, ...all.filter((o) => o.placement !== currentStep.placement)]
      : all;

    const fitting = order.find((o) => fits(box.width, box.height, o.top, o.left));
    const chosen = fitting ?? order[0];

    placement = chosen.placement;
    position = { top: chosen.top, left: chosen.left };

    if (placement === 'top' || placement === 'bottom') {
      arrowOffset = centerX - chosen.left - arrowSize;
    } else {
      arrowOffset = centerY - chosen.top - arrowSize;
    }
    arrowOffset = Math.max(arrowSize, Math.min(arrowOffset, (placement === 'top' || placement === 'bottom' ? box.width : box.height) - arrowSize * 2));
  }

  window.addEventListener('resize', positionBubble);

  function resolvePath(path?: string | null) {
    if (!path) return null;
    const gameId = $page.params.gameId ?? '';
    return path.replace(/{{gameId}}/g, gameId);
  }

  async function next() {
    if (tourStep >= steps.length - 1) {
      await updateTour(tourStep, true);
      return;
    }
    const nextIndex = tourStep + 1;
    const nextPath = currentStep ? resolvePath(currentStep.nextPath) : null;
    await updateTour(nextIndex, false);
    if (nextPath) {
      goto(nextPath);
    } else {
      await positionBubble();
    }
  }

  async function onGlobalClick(e: MouseEvent) {
    if (tourDone || loading || !currentStep) return;
    const el = e.target as HTMLElement;
    if (currentStep.click) {
      const clicked = el.closest('[data-tour]') as HTMLElement | null;
      if (clicked?.dataset.tour === currentStep.click) {
        await next();
      }
      return;
    }
    const target = getTarget();
    if (!target) return;
    if (el === target || target.contains(el)) {
      await next();
    }
  }

  async function close() {
    await updateTour(tourStep, true);
  }

  const unsubscribe = tourRefresh.subscribe(() => {
    load();
  });

  onMount(() => {
    window.addEventListener('click', onGlobalClick, true);
    load();
    poll = setInterval(() => {
      if (visible) positionBubble();
    }, 300);
  });

  onDestroy(() => {
    window.removeEventListener('click', onGlobalClick, true);
    if (poll) clearInterval(poll);
  });

  afterNavigate(load);
  onDestroy(() => {
    window.removeEventListener('resize', positionBubble);
    window.removeEventListener('click', onGlobalClick, true);
    unsubscribe();
  });
</script>

{#if visible}
  <div
    bind:this={bubble}
    class="tour-bubble {placement}"
    style="top: {position.top}px; left: {position.left}px; --arrow-offset: {arrowOffset}px;"
  >
    <button class="tour-close" on:click={close} aria-label="Close tour">×</button>
    <h3>{currentStep.title}</h3>
    <p>{currentStep.body}{stepNote}</p>
    <div class="tour-actions">
      <span class="step">{tourStep + 1} / {steps.length}</span>
      {#if tourStep >= steps.length - 1}
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={close} disabled={loading}>FINISH</button>
      {:else if !currentStep.hideNext}
        <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={next} disabled={loading}>NEXT</button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .tour-bubble {
    position: fixed;
    z-index: 1001;
    max-width: 14rem;
    width: max-content;
    min-width: 10rem;
    background: var(--card);
    border: 2px solid var(--brand);
    border-radius: 0.75rem;
    padding: 1.25rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  }

  .tour-bubble h3 {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }

  .tour-bubble p {
    margin: 0 0 1rem;
    color: var(--text);
    line-height: 1.4;
  }

  .tour-bubble::after {
    content: '';
    position: absolute;
    width: 0;
    height: 0;
  }

  .tour-bubble.top::after {
    bottom: -10px;
    left: var(--arrow-offset);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-top: 10px solid var(--brand);
  }

  .tour-bubble.bottom::after {
    top: -10px;
    left: var(--arrow-offset);
    border-left: 10px solid transparent;
    border-right: 10px solid transparent;
    border-bottom: 10px solid var(--brand);
  }

  .tour-bubble.left::after {
    right: -10px;
    top: var(--arrow-offset);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-left: 10px solid var(--brand);
  }

  .tour-bubble.right::after {
    left: -10px;
    top: var(--arrow-offset);
    border-top: 10px solid transparent;
    border-bottom: 10px solid transparent;
    border-right: 10px solid var(--brand);
  }

  .tour-close {
    position: absolute;
    top: 0.4rem;
    right: 0.5rem;
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted);
    cursor: pointer;
    padding: 0;
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1;
  }

  .tour-close:hover {
    color: var(--danger);
  }

  .tour-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
  }

  .step {
    color: var(--muted);
    font-size: 0.85rem;
  }
</style>
