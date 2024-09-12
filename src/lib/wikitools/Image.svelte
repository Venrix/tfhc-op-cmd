<script lang="ts">
  import { themeId } from '$lib/pickers/stores';
  import { getTheme, clientPrefLight } from '$lib/utils/getTheme';

  export let lightsrc: string;
  export let darksrc: string = '';
  export let alt: string;
  export let caption: string | undefined = undefined;

  // if no `darksrc` is specified, use `lightsrc`
  darksrc = darksrc ? darksrc : lightsrc;
  // basically `darksrc ??= lightsrc;` but `darksrc` can't be `undefined`, else TS is angry

  let preferredTheme: 'dark' | 'light';
  preferredTheme = getTheme();
  let imgSrc = preferredTheme === 'light' ? lightsrc : darksrc;

  $: {
    $themeId; // react on changing picker option (themeId)
    $clientPrefLight; // or the client preference (in case auto is selected)
    preferredTheme = getTheme();
    imgSrc = preferredTheme === 'light' ? lightsrc : darksrc;
  }
</script>

<img src={imgSrc} {alt} />
{#if caption}
  <span class="caption">{caption}</span>
{/if}

<style>
  .caption {
    max-width: 100%;
    display: block;
    font-style: italic;
    margin-top: 1rem;
    margin-bottom: 2rem;
  }
</style>
