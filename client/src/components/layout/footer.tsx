import { APP_NAME } from "@/lib/constants";
import { SiVisa, SiMastercard } from "react-icons/si";
import { Shield, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
                CT
              </div>
              <span className="font-semibold text-lg">{APP_NAME}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted platform for data bundles and result checker purchases in Ghana.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Products</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>MTN Data Bundles</li>
              <li>Telecel Data Bundles</li>
              <li>AirtelTigo Data Bundles</li>
              <li>BECE Result Checkers</li>
              <li>WASSCE Result Checkers</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">For Agents</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Become an Agent</li>
              <li>Agent Dashboard</li>
              <li>Custom Storefronts</li>
              <li>Profit Withdrawals</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Security & Payments</h4>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span className="text-xs">Secure</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span className="text-xs">Encrypted</span>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <div className="rounded bg-white dark:bg-gray-800 p-2">
                <SiVisa className="h-6 w-10 text-[#1A1F71]" />
              </div>
              <div className="rounded bg-white dark:bg-gray-800 p-2">
                <SiMastercard className="h-6 w-10 text-[#EB001B]" />
              </div>
              <div className="rounded bg-[#00C3F7] px-2 py-1">
                <span className="text-white font-bold text-xs">Paystack</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
