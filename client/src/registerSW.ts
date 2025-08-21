import { registerSW } from 'virtual:pwa-register';

// This is the service worker registration code

const updateSW = registerSW({
  onNeedRefresh() {
    // Show a prompt to the user to refresh for new content
    if (confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    // Notify user the app is ready to work offline
    console.log('App is ready for offline use');
  },
});

export default updateSW;
