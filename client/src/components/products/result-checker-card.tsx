import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/constants";
import { FileCheck, GraduationCap, ShoppingCart } from "lucide-react";
import resultImage from "@assets/result_1765780772205.jpg";

interface ResultCheckerTypeInfo {
  type: "bece" | "wassce";
  year: number;
  price: number;
  stock: number;
  onPurchase: () => void;
  isPurchasing?: boolean;
}

export function ResultCheckerCard({
  type,
  year,
  price,
  stock,
  onPurchase,
  isPurchasing,
}: ResultCheckerTypeInfo) {
  const typeInfo = {
    bece: {
      name: "BECE",
      fullName: "Basic Education Certificate Examination",
      icon: GraduationCap,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    },
    wassce: {
      name: "WASSCE",
      fullName: "West African Senior School Certificate Examination",
      icon: FileCheck,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    },
  };

  const info = typeInfo[type];
  const Icon = info.icon;
  const isOutOfStock = stock === 0;

  return (
    <Card className="group overflow-visible transition-all duration-200 hover-elevate h-full flex flex-col" data-testid={`card-checker-${type}-${year}`}>
      <div className="w-full h-20 overflow-hidden rounded-t-xl">
        <img 
          src={resultImage} 
          alt="Result Checker" 
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-2 pt-2 px-3">
        <div className="flex items-center justify-between gap-1">
          <Badge variant="outline" className={`${info.color} text-xs`}>
            <Icon className="h-3 w-3 mr-0.5" />
            {info.name}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs">
            {year}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-3 pb-3">
        <div>
          <h3 className="font-semibold text-sm leading-tight mb-0.5" data-testid={`text-checker-name-${type}-${year}`}>
            {info.name} Checker
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {info.fullName}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${isOutOfStock ? "text-red-600" : "text-green-600"}`}>
            {isOutOfStock ? "Out of Stock" : `${stock} available`}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-bold text-primary tabular-nums" data-testid={`text-checker-price-${type}-${year}`}>
            {formatCurrency(price)}
          </p>
          <Button
            size="sm"
            onClick={onPurchase}
            disabled={isOutOfStock || isPurchasing}
            className="gap-1 text-xs"
            data-testid={`button-buy-checker-${type}-${year}`}
          >
            <ShoppingCart className="h-3 w-3" />
            {isOutOfStock ? "N/A" : "Buy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultCheckerCardSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-muted rounded w-20" />
          <div className="h-6 bg-muted rounded w-12" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="h-5 bg-muted rounded w-3/4 mb-2" />
          <div className="h-4 bg-muted rounded w-full" />
        </div>
        <div className="h-4 bg-muted rounded w-20" />
        <div className="flex items-end justify-between">
          <div className="h-8 bg-muted rounded w-24" />
          <div className="h-9 bg-muted rounded w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
