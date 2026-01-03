import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getNetworkPrefixes } from "@/lib/network-validator";
import { AlertCircle } from "lucide-react";

export function NetworkPrefixRules() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Ghana Network Prefixes
        </CardTitle>
        <CardDescription>
          Valid phone number prefixes for each network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">MTN</h4>
            <div className="flex flex-wrap gap-2">
              {getNetworkPrefixes("mtn").map((prefix) => (
                <Badge key={prefix} variant="secondary" className="font-mono">
                  {prefix}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Example: 0241234567
            </p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Telecel</h4>
            <div className="flex flex-wrap gap-2">
              {getNetworkPrefixes("telecel").map((prefix) => (
                <Badge key={prefix} variant="secondary" className="font-mono">
                  {prefix}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Example: 0201234567
            </p>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">AirtelTigo</h4>
            <div className="flex flex-wrap gap-2">
              {getNetworkPrefixes("airteltigo").map((prefix) => (
                <Badge key={prefix} variant="secondary" className="font-mono">
                  {prefix}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Example: 0261234567
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
