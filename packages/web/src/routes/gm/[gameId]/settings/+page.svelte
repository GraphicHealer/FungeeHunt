<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { toast } from '$lib/toast';
  import { goto } from '$app/navigation';
  import { gmToken } from '$lib/gmToken';

  const gameId = $page.params.gameId;

  let game: any = null;
  let loading = true;
  let saving = false;

  let startAt = '';
  let endAt = '';
  let submissionMode = 'AUTOMATIC';
  let returnStart = '';
  let returnEnd = '';
  let returnOffsetStart = 0;
  let returnOffsetEnd = 0;

  function token() {
    return gmToken(gameId);
  }

  function toInputValue(d: Date) {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function fromInputValue(v: string) {
    return new Date(v);
  }

  async function load() {
    const res = await fetch(`/api/gm/games/${gameId}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      game = await res.json();
      startAt = toInputValue(new Date(game.startAt));
      endAt = toInputValue(new Date(game.endAt));
      submissionMode = game.submissionMode;
      returnOffsetStart = game.returnStart ? new Date(game.endAt).getTime() - new Date(game.returnStart).getTime() : 0;
      returnOffsetEnd = game.returnEnd ? new Date(game.endAt).getTime() - new Date(game.returnEnd).getTime() : 0;
    } else {
      toast.add('Could not load game settings', 'error');
      goto('/gm');
    }
    loading = false;
  }

  $: if (endAt && (returnOffsetStart || returnOffsetEnd)) {
    const end = fromInputValue(endAt);
    returnStart = toInputValue(new Date(end.getTime() - returnOffsetStart));
    returnEnd = toInputValue(new Date(end.getTime() - returnOffsetEnd));
  }

  async function save() {
    saving = true;
    const body: any = {
      startAt,
      endAt,
      submissionMode,
    };
    if (game?.returnBonusEnabled) {
      body.returnStart = returnStart;
      body.returnEnd = returnEnd;
    }
    const res = await fetch(`/api/gm/games/${gameId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify(body),
    });
    saving = false;
    if (res.ok) {
      await load();
      toast.add('Game settings saved', 'success');
    } else {
      const data = await res.json();
      toast.add(data.error ?? 'Could not save game settings', 'error');
    }
  }

  onMount(load);
</script>

<div class="page">
  <header class="page-header">
    <h1 class="fungee-title">Game Settings</h1>
  </header>

  {#if loading}
    <p>Loading…</p>
  {:else}
    <form class="fungee-card wide" on:submit|preventDefault={save}>
      <h2 class="fungee-section-title">Schedule</h2>
      <label class="fungee-label" for="startAt">Start Time</label>
      <input class="fungee-input" id="startAt" type="datetime-local" bind:value={startAt} />

      <label class="fungee-label" for="endAt">End Time</label>
      <input class="fungee-input" id="endAt" type="datetime-local" bind:value={endAt} />

      <h2 class="fungee-section-title" style="margin-top: 1.5rem;">Review</h2>
      <label class="fungee-label" for="mode">Submission Review</label>
      <select class="fungee-select" id="mode" bind:value={submissionMode}>
        <option value="AUTOMATIC">Automatic Approval</option>
        <option value="MANUAL">Game Master Approval</option>
      </select>

      {#if game?.returnBonusEnabled}
        <h2 class="fungee-section-title" style="margin-top: 1.5rem;">Return Bonus</h2>
        <p class="window">
          Changing the end time automatically keeps the bonus window the same distance from the end.<br />
          Start: {returnStart ? new Date(returnStart).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}<br />
          End: {returnEnd ? new Date(returnEnd).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}
        </p>
      {/if}

      <div class="fungee-btn-row" style="margin-top: 1.5rem;">
        <button class="fungee-btn" type="submit" disabled={saving}>SAVE SETTINGS</button>
      </div>
    </form>
  {/if}
</div>

<style>
  .page {
    padding: 1.5rem;
    font-family: system-ui, sans-serif;
  }

  .page-header {
    margin-bottom: 1.5rem;
  }

  .page-header h1 {
    margin: 0;
  }

  .window {
    color: var(--muted);
    font-size: 0.9rem;
    margin: 0.5rem 0 1rem;
  }
</style>
