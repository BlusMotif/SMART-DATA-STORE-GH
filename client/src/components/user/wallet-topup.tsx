import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormLabelWithoutFor, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { Wallet, Plus, Loader2, CreditCard, CheckCircle } from "lucide-react";

const topupSchema = z.object({
  amount: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 1;
  }, "Minimum top-up amount is GHS 1"),
  paymentMethod: z.enum(["paystack"], {
    required_error: "Please select a payment method",
  }),
});

type TopupFormData = z.infer<typeof topupSchema>;

export function WalletTopup() {
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const form = useForm<TopupFormData>({
    resolver: zodResolver(topupSchema),
    defaultValues: {
      amount: "",
      paymentMethod: "paystack",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        amount: "",
        paymentMethod: "paystack",
      });
    }
  }, [open, form]);

  const topupMutation = useMutation({
    mutationFn: async (data: TopupFormData) => {
      return await apiRequest("/api/wallet/topup/initialize", {
        method: "POST",
        body: JSON.stringify({ amount: data.amount, paymentMethod: data.paymentMethod }),
      });
    },
    onSuccess: (data: any) => {
      // Redirect to Paystack payment page
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Unable to initialize payment";
      toast({
        title: "❌ Wallet Top-up Failed",
        description: `${errorMessage}. Please check your connection and try again. If the issue persists, contact support.`,
        variant: "destructive",
        duration: 6000,
      });
      setIsProcessing(false);
    },
  });

  const onSubmit = (data: TopupFormData) => {
    setIsProcessing(true);
    topupMutation.mutate(data);
  };

  const quickAmounts = [10, 20, 50, 100, 200, 500];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Top Up Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground" style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Top Up Wallet
          </DialogTitle>
          <DialogDescription>
            Add money to your wallet to make instant purchases
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (GHS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      step="0.01"
                      min="1"
                      {...field}
                      disabled={isProcessing}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabelWithoutFor>Payment Method</FormLabelWithoutFor>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid gap-3"
                    >
                      <div className="flex items-center space-x-3 p-4 rounded-lg border-2 border-border bg-background hover:border-primary hover:shadow-md cursor-pointer transition-all">
                        <RadioGroupItem value="paystack" id="paystack" />
                        <div className="flex items-center justify-between flex-1">
                          <div className="flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">Pay with MoMo</div>
                              <div className="text-sm text-muted-foreground">
                                Secure payment via Paystack
                              </div>
                            </div>
                          </div>
                          {field.value === "paystack" && (
                            <CheckCircle className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <p className="text-sm text-muted-foreground mb-2">Quick amounts:</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => form.setValue("amount", amount.toString())}
                    disabled={isProcessing}
                  >
                    GHS {amount}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Continue to Payment
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-xs text-muted-foreground space-y-1 mt-4">
          <p>• Secure payment via Paystack</p>
          <p>• Funds reflect instantly after payment</p>
          <p>• Use wallet for faster checkout</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
