import { APP_NAME } from "@/lib/constants";
import { SiVisa, SiMastercard } from "react-icons/si";
import { Shield, Lock } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.png";

export function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="border-t bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="ResellersHub Pro" className="h-8 w-auto" />
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
              <div className="rounded bg-white dark:bg-black p-2">
                <SiVisa className="h-6 w-10 text-[#1A1F71]" />
              </div>
              <div className="rounded bg-white dark:bg-black p-2">
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
          <p className="mt-2">
            Developed by{' '}
            <a
              href="https://bm-portfolio-up2x.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 font-medium"
            >
              BlusMotif
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
