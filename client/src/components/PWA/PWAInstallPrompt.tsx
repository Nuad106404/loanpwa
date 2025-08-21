import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

// Interface for the BeforeInstallPromptEvent which is not included in the standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
      return;
    }

    // Save the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect when the app is installed
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;

    // Reset the prompt variable, as it can only be used once
    setInstallPrompt(null);

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Hide the prompt
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (isAppInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-50 flex flex-col sm:flex-row items-center justify-between">
      <div className="flex items-center">
        <img src="/icons/icon-72x72.png" alt="App Icon" className="w-12 h-12 mr-3" />
        <div>
          <h3 className="font-medium">Install Lease It App</h3>
          <p className="text-sm text-gray-600">Install this app on your device for quick and easy access.</p>
        </div>
      </div>
      <div className="flex items-center mt-3 sm:mt-0">
        <button 
          onClick={handleInstallClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg mr-2"
        >
          Install
        </button>
        <button 
          onClick={dismissPrompt}
          className="text-gray-400 hover:text-gray-500"
          aria-label="Dismiss"
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;
