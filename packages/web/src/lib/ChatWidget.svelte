<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy, tick } from 'svelte';
  import { io } from 'socket.io-client';
  import { fade, scale } from 'svelte/transition';

  $: code = $page.params.code;
  $: gameId = $page.params.gameId;
  $: isPlayer = !!code;
  $: isGm = !!gameId && !code;

  export let style = '';

  let token = '';
  let playerState: any = null;
  let teams: any[] = [];
  let messages: any[] = [];
  let unread = 0;
  let teamUnread: Record<string, number> = {};
  let panelOpen = false;
  let pickerOpen = false;
  let input = '';
  let socket: any;
  let loading = false;
  let selectedTeamId = '';
  let selectedTeamName = '';
  let scrollEl: HTMLDivElement;
  let chatInput: HTMLInputElement;
  let chatRoom = '';

  const commonEmojis = ['😀','😂','😍','🤔','👍','👎','🎉','🔥','❤️','👏','🙌','😎','🤯','😭','😡','👌','🎊','⭐','💯','🍕','🚀','⚠️','✅','❌'];

  $: isCaptain = isPlayer && playerState?.team && playerState?.player?.id === playerState?.team?.managerId;
  $: playerTeamId = playerState?.team?.id ?? '';
  $: visible = (isPlayer && isCaptain) || isGm;

  function authHeader(json = false) {
    const h: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async function loadPlayerState() {
    if (!code) return;
    const res = await fetch(`/api/play/${code}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) playerState = await res.json();
  }

  async function loadTeams() {
    if (!gameId) return;
    const [teamsRes, unreadRes] = await Promise.all([
      fetch(`/api/gm/games/${gameId}/teams`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/gm/games/${gameId}/chat/unread`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (teamsRes.ok) teams = await teamsRes.json();
    if (unreadRes.ok) teamUnread = await unreadRes.json();
    unread = Object.values(teamUnread).reduce((a: number, b: number) => a + b, 0);
  }

  async function loadMessages(teamId: string) {
    if (!teamId) return;
    loading = true;
    let res;
    if (isGm && gameId) {
      res = await fetch(`/api/gm/games/${gameId}/chat/${teamId}`, { headers: { Authorization: `Bearer ${token}` } });
    } else if (code) {
      res = await fetch(`/api/play/${code}/chat`, { headers: { Authorization: `Bearer ${token}` } });
    }
    if (res?.ok) messages = await res.json();
    loading = false;
    await tick();
    scrollToBottom();
  }

  async function send() {
    const text = input.trim();
    if (!text) return;
    let res;
    if (isGm && selectedTeamId) {
      res = await fetch(`/api/gm/games/${gameId}/chat/${selectedTeamId}`, {
        method: 'POST',
        headers: authHeader(true),
        body: JSON.stringify({ content: text }),
      });
    } else if (code && playerTeamId) {
      res = await fetch(`/api/play/${code}/chat`, {
        method: 'POST',
        headers: authHeader(true),
        body: JSON.stringify({ content: text }),
      });
    }
    if (res?.ok) {
      input = '';
      pickerOpen = false;
      if (chatInput) chatInput.value = '';
    } else {
      input = text;
    }
  }

  async function markRead(teamId: string) {
    let res;
    if (isGm && gameId) {
      res = await fetch(`/api/gm/games/${gameId}/chat/${teamId}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } else if (code) {
      res = await fetch(`/api/play/${code}/chat/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    }
    if (res?.ok) {
      const now = new Date().toISOString();
      const localRole = isGm ? 'GM' : 'CAPTAIN';
      const otherRole = isGm ? 'CAPTAIN' : 'GM';
      messages = messages.map((m) => (m.sender === otherRole && !m.readAt && (!teamId || m.teamId === teamId) ? { ...m, readAt: now } : m));
      updateUnreadFromMessages(teamId);
    }
  }

  function updateUnreadFromMessages(teamId?: string) {
    if (isGm) {
      const forTeam = teamId || selectedTeamId;
      const count = messages.filter((m) => m.sender === 'CAPTAIN' && !m.readAt && (forTeam ? m.teamId === forTeam : true)).length;
      if (forTeam) {
        teamUnread[forTeam] = count;
        teamUnread = { ...teamUnread };
      }
      unread = Object.values(teamUnread).reduce((a: number, b: number) => a + b, 0);
    } else {
      unread = messages.filter((m) => m.sender === 'GM' && !m.readAt).length;
    }
  }

  function closePanel() {
    panelOpen = false;
    if (isGm) {
      selectedTeamId = '';
      selectedTeamName = '';
      messages = [];
    }
  }

  async function openPanel() {
    panelOpen = true;
    if (isGm) {
      await loadTeams();
      if (selectedTeamId) {
        await loadMessages(selectedTeamId);
        await markRead(selectedTeamId);
      }
    } else if (playerTeamId) {
      selectedTeamId = playerTeamId;
      selectedTeamName = playerState?.team?.name ?? 'Your team';
      await loadMessages(playerTeamId);
      await markRead(playerTeamId);
    }
  }

  async function selectTeam(team: any) {
    selectedTeamId = team.id;
    selectedTeamName = team.name ?? 'Unnamed team';
    await loadMessages(team.id);
    await markRead(team.id);
  }

  function backToTeams() {
    selectedTeamId = '';
    selectedTeamName = '';
    messages = [];
  }

  function scrollToBottom() {
    if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
  }

  function appendEmoji(e: string) {
    input += e;
    pickerOpen = false;
  }

  function handleIncoming(payload: any) {
    if (!payload) return;
    if (payload.type === 'message' && payload.message) {
      const msg = payload.message;
      if (isGm) {
        if (selectedTeamId && msg.teamId === selectedTeamId) {
          messages = [...messages, msg];
        } else if (msg.teamId) {
          teamUnread[msg.teamId] = (teamUnread[msg.teamId] ?? 0) + 1;
          teamUnread = { ...teamUnread };
        }
        if (panelOpen && !selectedTeamId) loadTeams();
        updateUnreadFromMessages();
      } else if (msg.teamId === playerTeamId) {
        messages = [...messages, msg];
        updateUnreadFromMessages();
      }
      tick().then(scrollToBottom);
    } else if (payload.type === 'read') {
      const localRole = isGm ? 'GM' : 'CAPTAIN';
      const teamId = payload.teamId;
      messages = messages.map((m) => (m.sender === localRole && !m.readAt && (!teamId || m.teamId === teamId) ? { ...m, readAt: new Date().toISOString() } : m));
      if (!isGm) updateUnreadFromMessages();
      else if (!teamId || teamId === selectedTeamId) updateUnreadFromMessages(teamId);
      if (isGm && teamId && panelOpen && selectedTeamId === teamId) loadMessages(selectedTeamId);
    } else if (payload.type === 'chat') {
      if (panelOpen) {
        if (isGm && selectedTeamId) loadMessages(selectedTeamId);
        if (isPlayer && playerTeamId) loadMessages(playerTeamId);
      } else if (isGm) {
        loadTeams();
      }
    }
  }

  function joinChatRoom(tid: string) {
    if (!socket || chatRoom === tid) return;
    if (chatRoom) socket.off(`game:${code.toUpperCase()}:chat:${chatRoom}`, handleIncoming);
    chatRoom = tid;
    socket.on(`game:${code.toUpperCase()}:chat:${tid}`, handleIncoming);
    loadMessages(tid).then(() => updateUnreadFromMessages(tid));
  }

  async function refreshPlayerState() {
    if (!isPlayer || !code) return;
    await loadPlayerState();
    const tid = playerState?.team?.id;
    if (tid) joinChatRoom(tid);
  }

  onMount(() => {
    if (isPlayer) token = localStorage.getItem(`token:${code}`) ?? '';
    else token = localStorage.getItem('gmToken') ?? '';

    socket = io({ transports: ['websocket', 'polling'] });

    if (isPlayer && code) {
      socket.on(`game:${code.toUpperCase()}`, refreshPlayerState);
      refreshPlayerState();
    } else if (isGm && gameId) {
      socket.on(`gm:${gameId}:chat`, handleIncoming);
      loadTeams();
    }
  });

  onDestroy(() => {
    if (socket) socket.disconnect();
  });

</script>

{#if visible}
  <div class="chat-bubble" on:click={openPanel} class:dot={unread > 0} transition:fade={{ duration: 180 }} style={style}>
    <span class="mdi mdi-message-text"></span>
  </div>
{/if}

{#if panelOpen}
  <div class="chat-backdrop" on:click={closePanel} transition:fade={{ duration: 180 }}>
    <div class="chat-panel" on:click|stopPropagation in:scale={{ duration: 220, start: 0.95 }}>
      <div class="chat-header">
        {#if isGm && selectedTeamId}
          <button class="chat-back" on:click={backToTeams}><span class="mdi mdi-arrow-left"></span></button>
        {/if}
        <span class="chat-title">{isGm ? (selectedTeamName || 'Select a team') : selectedTeamName}</span>
        <button class="chat-close" on:click={closePanel}><span class="mdi mdi-close"></span></button>
      </div>

      <div class="chat-body" bind:this={scrollEl}>
        {#if isGm && !selectedTeamId}
          {#if loading}<p class="chat-loading">Loading…</p>{/if}
          {#each teams as team (team.id)}
            <button class="chat-team" on:click={() => selectTeam(team)}>
              <span>{team.name ?? 'Unnamed team'}</span>
              {#if teamUnread[team.id]}
                <span class="chat-dot">{teamUnread[team.id]}</span>
              {:else}
                <span class="mdi mdi-chevron-right"></span>
              {/if}
            </button>
          {/each}
        {:else}
          {#if loading}<p class="chat-loading">Loading…</p>{/if}
          {#each messages as msg (msg.id)}
            <div class="chat-msg" class:self={msg.sender === (isGm ? 'GM' : 'CAPTAIN')}>
              <div class="chat-bubble-msg">{msg.content}</div>
              <div class="chat-meta">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                {#if msg.sender === (isGm ? 'GM' : 'CAPTAIN')}
                  <span class="mdi {msg.readAt ? 'mdi-check-all' : 'mdi-check'}" style="margin-left: 0.25rem;"></span>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>

      {#if !isGm || selectedTeamId}
        <form class="chat-footer" on:submit|preventDefault={send}>
          {#if pickerOpen}
            <div class="emoji-picker">
              {#each commonEmojis as e}<button type="button" on:click={() => appendEmoji(e)}>{e}</button>{/each}
            </div>
          {/if}
          <button type="button" class="emoji-toggle" on:click={() => (pickerOpen = !pickerOpen)}><span class="mdi mdi-emoticon-happy-outline"></span></button>
          <input class="chat-input" type="text" bind:value={input} bind:this={chatInput} placeholder="Type a message…" />
          <button class="chat-send" type="submit"><span class="mdi mdi-send"></span></button>
        </form>
      {/if}
    </div>
  </div>
{/if}

<style>
  .chat-bubble {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 3.25rem;
    height: 3.25rem;
    border-radius: 50%;
    background: var(--brand);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    cursor: pointer;
    z-index: 1001;
    box-shadow: var(--shadow);
  }
  .chat-bubble.dot::after {
    content: '';
    position: absolute;
    top: 0.25rem;
    right: 0.25rem;
    width: 0.75rem;
    height: 0.75rem;
    background: #ff4444;
    border-radius: 50%;
    border: 2px solid var(--brand);
    animation: chat-pulse 1.2s infinite;
  }
  .chat-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    z-index: 1002;
    padding: 1rem;
  }
  .chat-panel {
    width: 22rem;
    max-width: calc(100vw - 2rem);
    height: 32rem;
    max-height: calc(100vh - 4rem);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 0.75rem;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .chat-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
    font-weight: 700;
  }
  .chat-title { flex: 1; }
  .chat-back, .chat-close {
    background: none;
    border: none;
    font: inherit;
    color: var(--text);
    cursor: pointer;
    font-size: 1.25rem;
  }
  .chat-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .chat-team {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    cursor: pointer;
    font: inherit;
    color: var(--text);
  }
  .chat-dot {
    background: #ff4444;
    color: #fff;
    border-radius: 999px;
    padding: 0.1rem 0.4rem;
    font-size: 0.75rem;
    font-weight: 700;
    animation: chat-pulse 1.2s infinite;
  }

  @keyframes chat-pulse {
    0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 0.5rem rgba(255, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
  }
  .chat-msg {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    max-width: 80%;
  }
  .chat-msg.self {
    align-self: flex-end;
    align-items: flex-end;
  }
  .chat-bubble-msg {
    padding: 0.6rem 0.75rem;
    border-radius: 0.75rem;
    background: var(--bg);
    border: 1px solid var(--border);
    color: var(--text);
    word-break: break-word;
  }
  .chat-msg.self .chat-bubble-msg {
    background: var(--brand);
    color: #fff;
    border-color: var(--brand);
  }
  .chat-meta {
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 0.15rem;
  }
  .chat-footer {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-top: 1px solid var(--border);
    position: relative;
  }
  .chat-input {
    flex: 1;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.5rem 0.75rem;
    background: var(--bg);
    color: var(--text);
    font: inherit;
  }
  .chat-send, .emoji-toggle {
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: none;
    background: var(--brand);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1rem;
  }
  .emoji-toggle { background: var(--bg); color: var(--text); border: 1px solid var(--border); }
  .emoji-picker {
    position: absolute;
    bottom: 100%;
    left: 0;
    right: 0;
    background: var(--card);
    border-top: 1px solid var(--border);
    padding: 0.5rem;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.25rem;
    max-height: 8rem;
    overflow-y: auto;
  }
  .emoji-picker button { background: none; border: none; font-size: 1.25rem; cursor: pointer; }
  .chat-loading { text-align: center; color: var(--muted); }
</style>
