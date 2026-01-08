import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import siteLogo from "@assets/logo_1765774201026.png";
import { APP_NAME } from "@/lib/constants";

export default function AgentUpgradePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background px-4 py-6">
      <div className="flex-1 flex items-center justify-center">
        <Card className="w-full max-w-2xl shadow-xl border-2">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={siteLogo} alt="Logo" className="h-16 w-auto object-contain" />
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
