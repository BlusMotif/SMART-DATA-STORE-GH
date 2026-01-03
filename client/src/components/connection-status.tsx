import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOffline(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check connection periodically
    const checkConnection = setInterval(() => {
      if (!navigator.onLine && isOnline) {
        setIsOnline(false);
        setShowOffline(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkConnection);
    };
  }, [isOnline]);

  // Auto-hide after coming back online
  useEffect(() => {
    if (isOnline && showOffline) {
      const timeout = setTimeout(() => {
        setShowOffline(false);
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isOnline, showOffline]);

  if (!showOffline && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] max-w-md w-full px-4">
      {!isOnline ? (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="ml-2">
            <strong>No Internet Connection</strong>
            <p className="text-xs mt-1">
              You're offline. Some features may not work properly.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="shadow-lg bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <AlertCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="ml-2 text-green-800 dark:text-green-200">
            <strong>Back Online</strong>
            <p className="text-xs mt-1">Connection restored successfully.</p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
