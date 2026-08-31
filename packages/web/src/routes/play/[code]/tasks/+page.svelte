<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  import { io } from 'socket.io-client';
  import { formatPoints } from '$lib/format';

  const code = $page.params.code;

  let state: any = null;
  let error = '';
  let selected: Record<string, (File | null)[] | null> = {};
  let uploading: Record<string, boolean> = {};
  let uploadProgress: Record<string, number> = {};
  let expanded = '';
  let showManagerInfo = false;
  let socket: any;
  let foodDriveCount = 0;
  let now = Date.now();
  let nowTimer: ReturnType<typeof setInterval> | null = null;

  function token() {
    return localStorage.getItem(`token:${code}`) ?? '';
  }

  function isManager() {
    return state && state.team && state.player.id === state.team.managerId;
  }

  function maybeShowManagerInfo() {
    if (state && isManager() && state.game?.status === 'LIVE') {
      const key = `managerInfo:${code}`;
      if (!localStorage.getItem(key)) {
        showManagerInfo = true;
        localStorage.setItem(key, 'true');
      }
    }
  }

  function accept(task: any) {
    if (task.proofType === 'PHOTO' || task.proofType === 'PHOTOS') return 'image/*';
    if (task.proofType === 'VIDEO') return 'video/*';
    return 'image/*,video/*';
  }

  function capture(task: any) {
    if (task.proofType === 'PHOTO' || task.proofType === 'PHOTOS' || task.proofType === 'VIDEO') return 'environment';
    return undefined;
  }

  function proofLabel(task: any) {
    if (task.proofType === 'PHOTO') return 'Take Photo...';
    if (task.proofType === 'VIDEO') return 'Take Video...';
    if (task.proofType === 'PHOTOS') return 'Take Photos...';
    return 'Take Photo/Video...';
  }

  function delayMs(task: any) {
    if (!task.delayMinutes || !state?.game?.startAt) return 0;
    const start = new Date(state.game.startAt).getTime();
    return Math.max(0, start + task.delayMinutes * 60 * 1000 - now);
  }

  function formatDelay(ms: number) {
    const totalSeconds = Math.ceil(ms / 1000);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function photoHint(task: any) {
    if (task.proofType !== 'PHOTOS') return '';
    if (task.photoCount) return `Upload ${task.photoCount} photos`;
    return 'Upload all required photos';
  }

  function statusLabel(status: string) {
    if (status === 'INCOMPLETE') return 'REJECTED';
    if (status === 'SUBMITTED') return 'PENDING';
    if (status === 'UNDER_REVIEW') return 'UNDER REVIEW';
    return status;
  }

  function initialSlots(task: any) {
    if (task.proofType === 'PHOTOS' && task.photoCount) {
      return new Array(task.photoCount).fill(null);
    }
    return [null];
  }

  function handleFile(taskId: string, index: number, e: Event) {
    const files = (e.currentTarget as HTMLInputElement).files;
    const file = files?.[0] ?? null;
    const slots = selected[taskId] ?? new Array(index + 1).fill(null);
    slots[index] = file;
    selected = { ...selected, [taskId]: [...slots] };
  }

  function addPhotoSlot(task: any) {
    const slots = selected[task.id] ?? initialSlots(task);
    selected = { ...selected, [task.id]: [...slots, null] };
  }

  async function load() {
    const res = await fetch(`/api/play/${code}`, {
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      state = await res.json();
      if (state.game?.status === 'COMPLETED') {
        goto(`/play/${code}`);
        return;
      }
      foodDriveCount = state.team?.foodDriveItems ?? 0;
      maybeShowManagerInfo();
    } else {
      error = 'Could not load game state';
    }
  }

  async function saveFoodDrive() {
    const res = await fetch(`/api/play/${code}/food-drive`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token()}`,
      },
      body: JSON.stringify({ items: foodDriveCount }),
    });
    if (res.ok) {
      const team = await res.json();
      state = { ...state, team: { ...state.team, foodDriveItems: team.foodDriveItems } };
      foodDriveCount = team.foodDriveItems;
    } else {
      error = 'Could not save food drive count';
    }
  }

  function submitTask(taskId: string) {
    const slots = selected[taskId];
    const files = (slots ?? []).filter((f): f is File => f !== null);
    if (files.length === 0) return;

    uploading = { ...uploading, [taskId]: true };
    uploadProgress = { ...uploadProgress, [taskId]: 0 };

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/play/${code}/tasks/${taskId}/submit`, true);
    xhr.setRequestHeader('Authorization', `Bearer ${token()}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        uploadProgress = { ...uploadProgress, [taskId]: percent };
      }
    };

    xhr.onload = async () => {
      uploading = { ...uploading, [taskId]: false };
      if (xhr.status === 201) {
        selected = { ...selected, [taskId]: null };
        await load();
      } else {
        try {
          const data = JSON.parse(xhr.responseText);
          error = data.error ?? 'Submit failed';
        } catch {
          error = 'Submit failed';
        }
      }
    };

    xhr.onerror = () => {
      uploading = { ...uploading, [taskId]: false };
      error = 'Submit failed';
    };

    xhr.ontimeout = () => {
      uploading = { ...uploading, [taskId]: false };
      error = 'Submit timed out';
    };

    const form = new FormData();
    for (const file of files) {
      form.append('proof', file);
    }
    xhr.send(form);
  }

  onMount(() => {
    load();
    socket = io({ transports: ['websocket', 'polling'] });
    socket.on(`game:${code.toUpperCase()}`, load);
    nowTimer = setInterval(() => {
      now = Date.now();
    }, 1000);
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
    if (nowTimer) clearInterval(nowTimer);
  });
</script>

<main class="fungee-page" style="padding-top: 3rem; padding-bottom: 8rem;">
  <div class="fungee-card wide">
    {#if state}
      {#if state.game.status === 'NOT_STARTED'}
        <div class="fungee-pending" style="text-align: center;">
          <h1 class="fungee-title">GAME PENDING</h1>
          <p class="fungee-subtitle">
            {#if state.team}Your team is <strong>{state.team.name ?? 'Unnamed team'}</strong>{:else}No team yet{/if}
          </p>
          <p>Waiting for the Game Master to start the game…</p>
        </div>
      {:else}
        <header style="margin-bottom: 1.25rem;">
          <h1 class="fungee-title">{state.game.name}</h1>
          <p class="fungee-subtitle" style="margin: 0;">
            {#if state.team}
              {state.team.name ?? 'Unnamed team'}
            {:else}No team yet{/if}
            &nbsp;• {state.player.displayName}
          </p>
          {#if state.game.status === 'COMPLETED'}
            <p class="fungee-status" style="margin-top: 0.5rem;">Game finished — submissions are closed</p>
          {/if}
        </header>

        <ul class="fungee-list">
          {#each state.tasks as task (task.id)}
            <li class="fungee-accordion" class:incomplete={task.submission?.status === 'INCOMPLETE'} class:bonus={task.isBonus}>
              <button class="fungee-accordion-header" on:click={() => (expanded = expanded === task.id ? '' : task.id)}>
                <span class="fungee-section-title" style="margin: 0;">{#if task.isBonus}<span class="mdi mdi-star" style="color: #ffd700;"></span> {/if}{task.order}. {task.title}</span>
                <span style="display: flex; align-items: center; gap: 0.75rem;">
                  <span>+{formatPoints(task.points)}</span>
                  {#if task.submission}
                    <span class="fungee-status {task.submission.status.toLowerCase()}">{statusLabel(task.submission.status)}</span>
                  {:else}
                    <span class="fungee-status">Available</span>
                  {/if}
                </span>
              </button>

              {#if expanded === task.id}
                <div class="fungee-accordion-body">
                  {#if task.isBonus}
                    <p class="bonus-notice" style="margin: 0 0 0.5rem; padding: 0.5rem; background: #332200; color: #ffd700; border-radius: 0.35rem; font-weight: 700;">
                      <span class="mdi mdi-star"></span> Limited-time bonus task! Submit before the window ends for extra points.
                    </p>
                  {/if}
                  <p style="margin: 0 0 0.5rem; white-space: pre-line;">{task.description || 'No description'}</p>
                  <p style="margin: 0 0 0.75rem; color: var(--muted); font-size: 0.95rem;">Proof: {task.proofType}{#if photoHint(task)} — {photoHint(task)}{/if}</p>

                  {#if task.submission?.reason}
                    <p class="fungee-error" style="margin: 0 0 0.75rem;">Reason: {task.submission.reason}</p>
                  {/if}

                  {#if isManager() && state.game.status === 'LIVE' && (!task.submission || task.submission.status === 'INCOMPLETE')}
                    {#if delayMs(task) > 0}
                      <div class="delay-notice" style="margin: 0.75rem 0; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 0.5rem; text-align: center; font-weight: 600; color: var(--brand);">
                        You must wait {formatDelay(delayMs(task))} before you can do this task.
                      </div>
                    {:else}
                      <div class="submit-row">
                        {#if !uploading[task.id]}
                          {#each (selected[task.id] ?? initialSlots(task)) as file, i (i)}
                            <div class="slot">
                              <input
                                id="proof-{task.id}-{i}"
                                class="file-input"
                                type="file"
                                accept={accept(task)}
                                capture={capture(task)}
                                on:change={(e) => handleFile(task.id, i, e)}
                                disabled={uploading[task.id]}
                              />
                              <label for="proof-{task.id}-{i}" class="fungee-btn take-btn" class:ready={file}>
                                {#if file}
                                  {task.proofType === 'VIDEO' ? 'Video loaded' : (task.proofType === 'PHOTOS' ? `Photo ${i + 1} loaded` : 'Photo loaded')}
                                {:else}
                                  {task.proofType === 'PHOTOS' ? `Photo ${i + 1}` : proofLabel(task)}
                                {/if}
                              </label>
                            </div>
                          {/each}

                          {#if task.proofType === 'PHOTOS' && !task.photoCount}
                            <button class="fungee-btn secondary" style="margin: 0; width: auto;" on:click={() => addPhotoSlot(task)}>+ Add Photo</button>
                          {/if}

                          <button
                            class="fungee-btn"
                            style="margin: 0; width: auto;"
                            on:click={() => submitTask(task.id)}
                            disabled={!((selected[task.id] ?? initialSlots(task)).some(Boolean))}
                          >Submit</button>
                        {:else}
                          <div class="fungee-btn take-btn uploading" style="--progress: {uploadProgress[task.id] ?? 0}%">
                            <span class="uploading-text">Uploading... {Math.round(uploadProgress[task.id] ?? 0)}%</span>
                          </div>
                        {/if}
                      </div>
                    {/if}
                  {/if}
                </div>
              {/if}
            </li>
          {/each}
        </ul>

        {#if state.game.foodDriveEnabled}
          <div class="fungee-list-item" style="margin-top: 1.5rem;">
            <h2 class="fungee-section-title">FOOD DRIVE</h2>
            <p style="margin: 0.25rem 0;">{formatPoints(state.game.foodDrivePointsPerItem)} points per eligible item</p>
            {#if state.game.foodDrivePermissible}
              <p style="margin: 0.25rem 0; color: var(--muted);"><strong>Permissible:</strong> {state.game.foodDrivePermissible}</p>
            {/if}
            {#if state.game.foodDriveSuggested}
              <p style="margin: 0.25rem 0; color: var(--muted);"><strong>Suggested:</strong> {state.game.foodDriveSuggested}</p>
            {/if}
            {#if state.game.captainCanUpdateFoodDrive && isManager()}
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem;">
                <input class="fungee-input" type="number" bind:value={foodDriveCount} min="0" style="width: 4rem; margin: 0;" />
                <button class="fungee-btn" style="width: auto; margin: 0;" on:click={saveFoodDrive}>SAVE</button>
              </div>
            {/if}
          </div>
        {/if}
      {/if}
    {:else if error}
      <p class="fungee-error">{error}</p>
    {:else}
      <p>Loading…</p>
    {/if}
  </div>
</main>

{#if showManagerInfo}
  <div class="modal-backdrop" on:click={() => (showManagerInfo = false)} transition:fade={{ duration: 180 }}>
    <div class="modal" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <h3>You are the Team Captain</h3>
      <p>
        As Team Captain, your device is the one the team uses to submit photos/videos for tasks.
      </p>
      <p>
        Make sure your phone is charged and ready once the game starts. Good luck!
      </p>
      <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin: 1rem 0; font-size: 2.5rem; color: var(--brand);">
        <span class="mdi mdi-camera"></span>
        <span class="mdi mdi-arrow-right"></span>
        <span class="mdi mdi-send"></span>
      </div>
      <p style="font-size: 1.25rem; font-weight: 700; color: var(--brand); text-align: center; margin: 0 0 1rem;">
        After taking a photo, tap <strong>Submit</strong>!
      </p>
      <button class="fungee-btn" style="width: 100%;" on:click={() => (showManagerInfo = false)}>GOT IT</button>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1001;
    padding: 1rem;
  }

  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    padding: 1.5rem;
    max-width: 22rem;
    width: 100%;
    box-shadow: var(--shadow);
  }

  .modal h3 {
    margin-top: 0;
  }
  .fungee-accordion.incomplete {
    border-color: var(--danger);
    box-shadow: 0 0 0 1px var(--danger);
  }

  .fungee-accordion.bonus {
    border-color: #ffd700;
    box-shadow: 0 0 0 1px #ffd700;
  }

  .submit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .slot {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .file-input {
    display: none;
  }

  .take-btn {
    margin: 0;
    width: auto;
    flex: 1;
    min-width: 10rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .take-btn.ready {
    background: var(--success);
  }

  .take-btn.uploading {
    background: linear-gradient(90deg, var(--success) var(--progress), var(--brand) var(--progress));
    color: #fff;
    text-align: center;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
  }

  .uploading-text {
    position: relative;
    z-index: 1;
  }
</style>
