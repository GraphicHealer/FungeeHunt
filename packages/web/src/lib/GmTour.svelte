<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let step = 0;
  let visible = false;

  const steps = [
    {
      title: 'Game Master Board',
      body: 'This is your home base. Every game you create appears here. Click a game card to open its dashboard.',
    },
    {
      title: 'NEW GAME',
      body: 'Click the NEW GAME button to start the wizard. You will set the game name, start/end times, return bonus, and food drive defaults.',
    },
    {
      title: 'SYSTEM SETTINGS',
      body: 'Click SYSTEM SETTINGS to set defaults that every new game inherits: bonus points, default rules, default tasks, and the randomize switch.',
    },
    {
      title: 'Game Dashboard',
      body: 'Inside a game, the DASHBOARD shows the live leaderboard, the submission feed, and start/end controls. Press START to make the game live.',
    },
    {
      title: 'Players & Teams',
      body: 'Use PLAYERS to see everyone who joined. TEAMS lets you rename teams and assign or move players. Every team needs one online manager.',
    },
    {
      title: 'Tasks & Submissions',
      body: 'TASKS are the challenges teams complete. SUBMISSIONS shows photos and videos as they come in. Click one to approve or reject it.',
    },
    {
      title: 'Bonuses & Rules',
      body: 'BONUSES controls the return-time and food-drive points. RULES edits the rulebook players see on their phones.',
    },
    {
      title: 'Game Settings',
      body: 'SETTINGS in the left sidebar lets you change start/end times and submission review mode after the game is created.',
    },
    {
      title: 'You are ready',
      body: 'Create a game, add some tasks and rules, invite players, and press START. Good luck!',
    },
  ];

  onMount(async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        if (!data.gmTourShown) visible = true;
      }
    } catch {
      visible = true;
    }
  });

  async function markSeen() {
    try {
      await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmTourShown: true }),
      });
    } catch {
      // ignore
    }
  }

  function next() {
    if (step < steps.length - 1) step++;
  }

  function back() {
    if (step > 0) step--;
  }

  async function close() {
    await markSeen();
    dispatch('close');
  }
</script>

{#if visible}
  <div class="modal-backdrop" on:click={close}>
    <div class="modal" on:click|stopPropagation>
      <h2>{steps[step].title}</h2>
      <p>{steps[step].body}</p>

      <div class="dots">
        {#each steps as _, i (i)}
          <span class="dot" class:active={i === step}></span>
        {/each}
      </div>

      <div class="actions">
        <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={close}>CLOSE</button>
        {#if step > 0}
          <button class="fungee-btn secondary" style="width: auto; margin: 0;" type="button" on:click={back}>BACK</button>
        {/if}
        {#if step < steps.length - 1}
          <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={next}>NEXT</button>
        {:else}
          <button class="fungee-btn" style="width: auto; margin: 0;" type="button" on:click={close}>DONE</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1100;
    padding: 1rem;
  }

  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 2rem;
    max-width: 32rem;
    width: 100%;
    text-align: center;
  }

  .modal h2 {
    margin: 0 0 1rem;
  }

  .modal p {
    color: var(--text);
    margin: 0 0 1.5rem;
    line-height: 1.5;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--border);
  }

  .dot.active {
    background: var(--brand);
  }

  .actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
  }
</style>
