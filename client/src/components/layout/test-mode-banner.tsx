import { AlertTriangle } from "lucide-react";

export function TestModeBanner() {
  return (
    <div className="bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 py-2 px-4" data-testid="banner-test-mode">
      <div className="container mx-auto max-w-7xl flex items-center justify-center gap-2 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        <span>Test Mode: Payments are simulated. No real transactions are being processed.</span>
      </div>
    </div>
  );
}
