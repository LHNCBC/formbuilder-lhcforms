import {getSupportedLFormsVersions, loadLForms} from '../../../node_modules/lforms-loader/dist/lformsLoader.js';

// Suppress loading karma, until LForms is loaded.
window.__karma__.loaded = () => {}

console.log(`${Date.now()}: Loading LForms in karma-lforms-loader...`);

(async () => {
  const latestVersion = await getSupportedLFormsVersions().then((versions) => {
    return versions[0] || '34.3.0';
  }).catch((err) => {
    console.error(`Failed to get LForms version - ${err.stack}`);    
    throw err;
  });

  const loadedVersion = await loadLForms(latestVersion).then(() => {
    return LForms.lformsVersion;
  }).catch((error) => {
    console.error(`Failed to load LForms library - version ${latestVersion}: ${error.stack}`);
    throw error;
  });

  console.log(`${Date.now()}: Loaded LForms in karma-lforms-loader - version: ${loadedVersion}...`);
  window.__karma__.start();
})();