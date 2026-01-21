import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { useTheme } from "@/components/theme-provider";
import logoLight from "@assets/logo_1765774201026.png";
import logoDark from "@assets/darkmode-icon.png";

export default function AgentUpgradePage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={theme === 'dark' ? logoDark : logoLight} alt="ResellersHub Pro" className="h-12 w-auto" />
            </div>
            <CardTitle className="text-2xl font-bold">Upgrade to Agent</CardTitle>
            <CardDescription>Become an agent and start earning commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 justify-center">
              <Link href="/user/dashboard?upgrade=true">
                <Button variant="outline">Use Same Account</Button>
              </Link>
              <Link href="/agent/register">
                <Button variant="default">Create New Agent Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
