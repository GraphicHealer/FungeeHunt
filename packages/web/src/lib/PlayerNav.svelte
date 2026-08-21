<script lang="ts">
  import { page } from '$app/stores';

  const code = $page.params.code;
  $: segment = $page.url.pathname.split('/').pop() ?? '';
</script>

<nav class="player-nav">
  <a class="nav-item" class:active={segment === 'rules'} href="/play/{code}/rules">
    <span class="mdi mdi-file-document-outline"></span>
    <span class="label">Rules</span>
  </a>

  <a class="nav-item tasks" class:active={segment === 'tasks'} href="/play/{code}/tasks">
    <span class="mdi mdi-format-list-checks"></span>
    <span class="label">Tasks</span>
  </a>

  <a class="nav-item" class:active={segment === 'team'} href="/play/{code}/team">
    <span class="mdi mdi-account-group"></span>
    <span class="label">Team</span>
  </a>
</nav>

<style>
  .player-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 4rem;
    background: var(--card);
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: space-around;
    align-items: center;
    z-index: 1000;
    box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.05);
  }

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.75rem;
    gap: 0.25rem;
    flex: 1;
    height: 100%;
  }

  .nav-item .mdi {
    font-size: 1.4rem;
  }

  .nav-item.active,
  .nav-item:hover {
    color: var(--brand);
  }

  .nav-item.tasks {
    position: relative;
    top: -1.25rem;
    width: 5rem;
    height: 5rem;
    border-radius: 50%;
    background: var(--brand);
    color: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    flex: 0 0 auto;
    border: 4px solid var(--bg);
  }

  .nav-item.tasks .mdi {
    font-size: 1.75rem;
  }

  .nav-item.tasks.active,
  .nav-item.tasks:hover {
    color: #fff;
    background: var(--brand-dark);
  }

  .nav-item.tasks .label {
    color: #fff;
  }
</style>
