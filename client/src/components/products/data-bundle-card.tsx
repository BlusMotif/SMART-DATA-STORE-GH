import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NetworkBadge } from "./network-badge";
import { formatCurrency } from "@/lib/constants";
import { Wifi, Clock, ShoppingCart } from "lucide-react";
import type { DataBundle } from "@shared/schema";
import mtnImage from "@assets/mtn_1765780772203.jpg";
import telecelImage from "@assets/telecel_1765780772206.jpg";
import airteltigoImage from "@assets/at_1765780772206.jpg";

const networkImages: Record<string, string> = {
  mtn: mtnImage,
  telecel: telecelImage,
  airteltigo: airteltigoImage,
};

interface DataBundleCardProps {
  bundle: DataBundle;
  customPrice?: number;
  onPurchase: (bundle: DataBundle) => void;
  isPurchasing?: boolean;
}

export function DataBundleCard({
  bundle,
  customPrice,
  onPurchase,
  isPurchasing,
}: DataBundleCardProps) {
  const displayPrice = customPrice ?? parseFloat(bundle.basePrice);

  const networkImage = networkImages[bundle.network.toLowerCase()];

  return (
    <Card className="group overflow-visible transition-all duration-200 hover-elevate" data-testid={`card-bundle-${bundle.id}`}>
      {networkImage && (
        <div className="w-full h-20 overflow-hidden rounded-t-xl">
          <img 
            src={networkImage} 
            alt={bundle.network} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2 pt-2 px-3">
        <div className="flex items-center justify-between gap-1">
          <NetworkBadge network={bundle.network} size="sm" />
          {!bundle.isActive && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              N/A
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight mb-0.5" data-testid={`text-bundle-name-${bundle.id}`}>
            {bundle.name}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-0.5">
              <Wifi className="h-3 w-3" />
              <span>{bundle.dataAmount}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />
              <span>{bundle.validity}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-primary tabular-nums" data-testid={`text-bundle-price-${bundle.id}`}>
            {formatCurrency(displayPrice)}
          </p>
          <Button
            size="sm"
            onClick={() => onPurchase(bundle)}
            disabled={!bundle.isActive || isPurchasing}
            className="gap-1 text-xs"
            data-testid={`button-buy-bundle-${bundle.id}`}
          >
            <ShoppingCart className="h-3 w-3" />
            Buy
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function DataBundleCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded w-20" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
        <div className="flex items-end justify-between">
          <div className="h-8 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
