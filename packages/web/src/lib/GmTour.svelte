<script lang="ts">
  import { onMount } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';

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
      body: 'Use PLAYERS to see everyone who joined. TEAMS lets you rename teams and assign or move players. Every team needs one online Team Captain.',
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
      title: 'Email (optional)',
      body: 'To send emails (game links, alerts), set <code>GMAIL_CLIENT_ID</code> and <code>GMAIL_CLIENT_SECRET</code> in your container environment, or use SMTP_* variables. Create the OAuth client at <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">console.cloud.google.com → APIs &amp; Services → Credentials</a>: enable the Gmail API, create an OAuth client ID of type "Web application", and add redirect URI <code>{{origin}}/api/gm/settings/email/callback</code>. Then open the Admin page and accept the "Gmail OAuth detected" prompt.',
    },
    {
      title: 'You are ready',
      body: 'Create a game, add some tasks and rules, invite players, and press START. Good luck!',
    },
  ];

  let origin = '';
  onMount(() => {
    origin = window.location.origin;
  });

  onMount(() => {
    // Set by the new-game wizard when this device opted in to the tutorial.
    if (localStorage.getItem('gmTourNext') === '1') {
      localStorage.removeItem('gmTourNext');
      visible = true;
    }
  });

  function next() {
    if (step < steps.length - 1) step++;
  }

  function back() {
    if (step > 0) step--;
  }

  function close() {
    // Once the tour is finished on the last step, don't offer it again on this device.
    if (step >= steps.length - 1) {
      localStorage.setItem('gmTourPref', 'no');
    }
    visible = false;
    dispatch('close');
  }
</script>

{#if visible}
  <div class="modal-backdrop" on:click={close} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <h2>{steps[step].title}</h2>
      <p>{@html steps[step].body.replaceAll('{{origin}}', origin)}</p>

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

  .modal p :global(code) {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.25rem;
    padding: 0.05rem 0.3rem;
    font-size: 0.85em;
    word-break: break-all;
  }

  .modal p :global(a) {
    color: var(--brand);
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
