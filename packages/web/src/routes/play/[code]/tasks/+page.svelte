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
  let selected: Record<string, FileList | null> = {};
  let uploading: Record<string, boolean> = {};
  let uploadProgress: Record<string, number> = {};
  let expanded = '';
  let showManagerInfo = false;
  let socket: any;

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
    if (task.proofType === 'PHOTO' || task.proofType === 'VIDEO') return 'environment';
    return undefined;
  }

  function proofLabel(task: any) {
    if (task.proofType === 'PHOTO') return 'Take Photo...';
    if (task.proofType === 'VIDEO') return 'Take Video...';
    if (task.proofType === 'PHOTOS') return 'Take Photos...';
    return 'Take Photo/Video...';
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

  function handleFile(taskId: string, e: Event) {
    const files = (e.currentTarget as HTMLInputElement).files;
    selected = { ...selected, [taskId]: files };
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
      maybeShowManagerInfo();
    } else {
      error = 'Could not load game state';
    }
  }

  function submitTask(taskId: string) {
    const files = selected[taskId];
    if (!files || files.length === 0) return;

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
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
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
            <li class="fungee-accordion" class:incomplete={task.submission?.status === 'INCOMPLETE'}>
              <button class="fungee-accordion-header" on:click={() => (expanded = expanded === task.id ? '' : task.id)}>
                <span class="fungee-section-title" style="margin: 0;">{task.order}. {task.title}</span>
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
                  <p style="margin: 0 0 0.5rem; white-space: pre-line;">{task.description || 'No description'}</p>
                  <p style="margin: 0 0 0.75rem; color: var(--muted); font-size: 0.95rem;">Proof: {task.proofType}{#if photoHint(task)} — {photoHint(task)}{/if}</p>

                  {#if task.submission?.reason}
                    <p class="fungee-error" style="margin: 0 0 0.75rem;">Reason: {task.submission.reason}</p>
                  {/if}

                  {#if isManager() && state.game.status === 'LIVE' && (!task.submission || task.submission.status === 'INCOMPLETE')}
                    <div class="submit-row">
                      <input
                        id="proof-{task.id}"
                        class="file-input"
                        type="file"
                        accept={accept(task)}
                        capture={capture(task)}
                        multiple={task.proofType === 'PHOTOS'}
                        on:change={(e) => handleFile(task.id, e)}
                        disabled={uploading[task.id]}
                      />
                      {#if !uploading[task.id]}
                        <label for="proof-{task.id}" class="fungee-btn take-btn" class:ready={selected[task.id]}>
                          {#if selected[task.id]?.length}
                            {selected[task.id].length} photo{selected[task.id].length === 1 ? '' : 's'}
                          {:else}
                            {proofLabel(task)}
                          {/if}
                        </label>
                        <button class="fungee-btn" style="margin: 0; width: auto;" on:click={() => submitTask(task.id)} disabled={!selected[task.id] || selected[task.id].length === 0}>Submit</button>
                      {:else}
                        <div class="fungee-btn take-btn uploading" style="--progress: {uploadProgress[task.id] ?? 0}%">
                          <span class="uploading-text">Uploading... {Math.round(uploadProgress[task.id] ?? 0)}%</span>
                        </div>
                      {/if}
                    </div>
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
      <button class="fungee-btn" style="width: 100%; margin-top: 1rem;" on:click={() => (showManagerInfo = false)}>GOT IT</button>
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

  .submit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
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
