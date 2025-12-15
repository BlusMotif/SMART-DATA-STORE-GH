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
        <div className="w-full h-32 overflow-hidden rounded-t-xl">
          <img 
            src={networkImage} 
            alt={bundle.network} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <NetworkBadge network={bundle.network} size="md" />
          {!bundle.isActive && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Unavailable
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg leading-tight mb-1" data-testid={`text-bundle-name-${bundle.id}`}>
            {bundle.name}
          </h3>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Wifi className="h-4 w-4" />
              <span>{bundle.dataAmount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{bundle.validity}</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-primary tabular-nums" data-testid={`text-bundle-price-${bundle.id}`}>
              {formatCurrency(displayPrice)}
            </p>
          </div>
          <Button
            onClick={() => onPurchase(bundle)}
            disabled={!bundle.isActive || isPurchasing}
            className="gap-2"
            data-testid={`button-buy-bundle-${bundle.id}`}
          >
            <ShoppingCart className="h-4 w-4" />
            Buy Now
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
