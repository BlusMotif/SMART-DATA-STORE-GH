import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle, RotateCw, Layers } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TrackedOrder {
  id: string;
  reference: string;
  productName: string;
  customerPhone: string;
  amount: string;
  status: string;
  deliveryStatus: string;
  createdAt: string;
  completedAt?: string;
  phoneNumbers?: any[];
  isBulkOrder: boolean;
  apiResponse?: string;
  skytechStatus?: string;
  skytechData?: any;
}

export function OrderTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a transaction ID or beneficiary phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setRefreshedAt(null);
    try {
      const response = await fetch(`/api/track-order?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setOrder(data);
        setRefreshedAt(new Date());
      } else {
        setOrder(null);
        toast({
          title: "Order Not Found",
          description: data.error || "No order found with the provided information",
          variant: "destructive",
        });
      }
    } catch (error) {
      setOrder(null);
      toast({
        title: "Search Failed",
        description: "Failed to search for order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrderStatus = async (orderId: string) => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/order-status/${orderId}`);
      const data = await response.json();

      if (response.ok) {
        setOrder(data);
        setRefreshedAt(new Date());
      }
    } catch (error) {
      console.error("Failed to refresh order status:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const extractSkytechStatus = (order: TrackedOrder): string | null => {
    try {
      if (!order.apiResponse) return null;
      const apiResponse = JSON.parse(order.apiResponse as string);
      
      // Check for latest status check
      if (apiResponse.skytechStatus?.status) {
        return apiResponse.skytechStatus.status;
      }
      
      // Check for initial response
      if (apiResponse.results && apiResponse.results[0]?.status) {
        return apiResponse.results[0].status;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  const getStatusIcon = (statusToCheck: string) => {
    const status = statusToCheck.toLowerCase();
    
    if (status === 'completed' || status === 'delivered' || status === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'failed' || status === 'error') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (status === 'processing' || status === 'pending' || status === 'queued') {
      return <Layers className="h-5 w-5 text-blue-500" />;
    } else {
      return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (statusToDisplay: string) => {
    const statusLower = statusToDisplay.toLowerCase();
    
    if (statusLower === 'completed' || statusLower === 'delivered' || statusLower === 'success') {
      return <Badge variant="default" className="bg-green-500 text-white">✅ {statusToDisplay}</Badge>;
    } else if (statusLower === 'failed' || statusLower === 'error') {
      return <Badge variant="destructive" className="bg-red-500 text-white">❌ {statusToDisplay}</Badge>;
    } else if (statusLower === 'processing' || statusLower === 'pending') {
      return <Badge variant="secondary" className="bg-blue-500 text-white animate-pulse">🔄 Processing</Badge>;
    } else if (statusLower === 'queued') {
      return <Badge variant="secondary" className="bg-blue-500 text-white">⏳ {statusToDisplay}</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-500 text-white">⏳ {statusToDisplay}</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card text-card-foreground border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Package className="h-5 w-5" />
          Track Your Order
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Enter your transaction ID or beneficiary phone number to track your order status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Transaction ID or Phone Number (e.g., TXN-123456789-ABCDEF or 0241234567)"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isLoading}>
            {isLoading ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </Button>
        </div>

        {order && (() => {
          // Extract SkyTech status once for consistency
          const skytechStatus = order.skytechStatus || extractSkytechStatus(order);
          const displayStatus = skytechStatus || order.deliveryStatus;
          
          return (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(displayStatus)}
                  <CardTitle className="text-lg text-foreground">{order.productName}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(displayStatus)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshOrderStatus(order.id)}
                    disabled={isRefreshing}
                    className="ml-2"
                  >
                    <RotateCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-muted-foreground">
                Order #{order.reference}
                {refreshedAt && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                    (Updated: {refreshedAt.toLocaleTimeString()})
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Amount:</span>
                  <p className="font-semibold text-gray-900 dark:text-white">GHS {order.amount}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Date:</span>
                  <p className="text-gray-900 dark:text-white">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Customer Phone:</span>
                  <p className="text-gray-900 dark:text-white">{order.customerPhone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Type:</span>
                  <p className="text-gray-900 dark:text-white">{order.isBulkOrder ? 'Bulk Order' : 'Single Order'}</p>
                </div>
              </div>

              {order.isBulkOrder && order.phoneNumbers && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400">Beneficiary Numbers:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {order.phoneNumbers.map((item: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs text-gray-900 dark:text-white">
                        {item.phone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {order.completedAt && (
                <div className="pt-2 border-t dark:border-gray-700">
                  <span className="font-medium text-gray-600 dark:text-gray-400">Completed:</span>
                  <p className="text-sm text-gray-500 dark:text-gray-300">
                    {new Date(order.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Need help? Contact our support team with your order reference.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })()}
      </CardContent>
    </Card>
  );
}