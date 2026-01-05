// 1) Instrument 'src/app/testing/karma-lforms-loader.js'
if (window.__karma__) {
  window.__karma__.lformsLoaderProbe = 'evaluated';
}

import {getSupportedLFormsVersions, loadLForms} from 'lforms-loader/dist/lformsLoader.js';

// Suppress automatic start until we finish (best effort; Angular test shim may reassign this).
window.__karma__.loaded = () => {}

(async () => {
  try {
    const lfVersions = await getSupportedLFormsVersions();
    console.log('[lforms-loader] latest version:', lfVersions[0]);
    const loadedVersion = await loadLForms(lfVersions[0]);
    console.log('[lforms-loader] loaded:', loadedVersion);
    if (window.__karma__) {
      window.__karma__.lformsLoaderReady = true;
    }
  } catch (e) {
    console.error('[lforms-loader] failed:', e);
    if (window.__karma__) {
      window.__karma__.lformsLoaderReady = false;
      window.__karma__.lformsLoaderError = e;
    }
  } finally {
    setTimeout(() => window.__karma__.start(), 1000);
  }
})();
