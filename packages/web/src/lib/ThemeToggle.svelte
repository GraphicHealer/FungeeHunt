<script lang="ts">
  import { theme, toggleTheme } from './theme';

  export let style = '';

  let current: 'light' | 'dark' = 'light';
  theme.subscribe((t) => (current = t));
</script>

<button class="theme-toggle" on:click={toggleTheme} style={style} title="Toggle {current === 'light' ? 'dark' : 'light'} mode">
  <span class="mdi {current === 'light' ? 'mdi-weather-night' : 'mdi-white-balance-sunny'}"></span>
</button>

<style>
  .theme-toggle {
    position: fixed;
    bottom: 0.75rem;
    right: 0.75rem;
    left: auto;
    top: auto;
    z-index: 1000;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow);
  }
</style>
