import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Package, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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
}

export function OrderTracker() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
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
    try {
      const response = await fetch(`/api/track-order?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (response.ok) {
        setOrder(data);
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

  const getStatusIcon = (status: string, deliveryStatus: string) => {
    if (status === 'completed' && deliveryStatus === 'delivered') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status === 'failed' || deliveryStatus === 'failed') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (status === 'completed' && deliveryStatus === 'processing') {
      return <Clock className="h-5 w-5 text-yellow-500" />;
    } else {
      return <Package className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string, deliveryStatus: string) => {
    if (status === 'completed' && deliveryStatus === 'delivered') {
      return <Badge variant="default" className="bg-green-500 text-white">Delivered</Badge>;
    } else if (status === 'failed' || deliveryStatus === 'failed') {
      return <Badge variant="destructive" className="bg-red-500 text-white">Failed</Badge>;
    } else if (status === 'completed' && deliveryStatus === 'processing') {
      return <Badge variant="secondary" className="bg-yellow-500 text-white">Processing</Badge>;
    } else if (status === 'completed' && deliveryStatus === 'pending') {
      return <Badge variant="secondary" className="bg-blue-500 text-white">Pending Delivery</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-500 text-white">{status}</Badge>;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-black dark:text-white">
          <Package className="h-5 w-5" />
          Track Your Order
        </CardTitle>
        <CardDescription className="text-black dark:text-white">
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

        {order && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status, order.deliveryStatus)}
                  <CardTitle className="text-lg">{order.productName}</CardTitle>
                </div>
                {getStatusBadge(order.status, order.deliveryStatus)}
              </div>
              <CardDescription>
                Order #{order.reference}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Amount:</span>
                  <p className="font-semibold">GHS {order.amount}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Date:</span>
                  <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Customer Phone:</span>
                  <p>{order.customerPhone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Type:</span>
                  <p>{order.isBulkOrder ? 'Bulk Order' : 'Single Order'}</p>
                </div>
              </div>

              {order.isBulkOrder && order.phoneNumbers && (
                <div>
                  <span className="font-medium text-gray-600">Beneficiary Numbers:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {order.phoneNumbers.map((item: any, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {item.phone}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {order.completedAt && (
                <div className="pt-2 border-t">
                  <span className="font-medium text-gray-600">Completed:</span>
                  <p className="text-sm text-gray-500">
                    {new Date(order.completedAt).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-600">
                    Need help? Contact our support team with your order reference.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}