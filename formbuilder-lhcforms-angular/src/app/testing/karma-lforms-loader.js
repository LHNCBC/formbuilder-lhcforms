import {getSupportedLFormsVersions, loadLForms} from '../../../node_modules/lforms-loader/dist/lformsLoader.js';

// Suppress loading karma, until LForms is loaded.
window.__karma__.loaded = () => {}

(async () => {
  const lfVersions = await getSupportedLFormsVersions().catch((error) => {
    const msg = `lformsLoader.getSupportedLFormsVersions() failed.`;
    console.error(`${Date.now()}: ${msg}`);
    throw error;
  });

  console.log(`${Date.now()}: The latest LForms version is ${lfVersions[0]}`);
  const loadedVersion = await loadLForms(lfVersions[0]).catch((errorEvent) => {
    const msg = `lformsLoader.loadLForms(${lfVersions[0]}) failed.`;
    console.error(`${Date.now()}: ${msg}`);
    throw new Error(msg, {cause: errorEvent.error}); // 'error' is an instance of ErrorEvent.
  });

  console.log(`${Date.now()}: Successfully Loaded LForms libraries - ${loadedVersion}`);
  setTimeout(() => window.__karma__.start(), 1000);

})();
