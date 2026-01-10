import { useState, useMemo, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { validatePhoneNetwork, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { NetworkBadge } from "@/components/products/network-badge";
import { 
  Phone, Mail, Loader2, Wifi, Clock, CreditCard, AlertCircle, 
  ArrowLeft, Package, Layers, Upload, FileText, AlertTriangle, ShoppingCart, Smartphone 
} from "lucide-react";
import type { DataBundle, Agent } from "@shared/schema";
import * as XLSX from "xlsx";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";

const networkInfo: Record<string, { name: string; logo: string }> = {
  mtn: { name: "MTN", logo: mtnLogo },
  telecel: { name: "Telecel", logo: telecelLogo },
  airteltigo: { name: "AirtelTigo", logo: airteltigoLogo },
  at_bigtime: { name: "AT BIG TIME", logo: airteltigoLogo },
  at_ishare: { name: "AT iShare", logo: airteltigoLogo },
};

const singleOrderSchema = z.object({
  customerPhone: z.string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^0[0-9]{9}$/, "Phone number must start with 0 and be 10 digits (e.g., 0241234567)"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

const bulkOrderSchema = z.object({
  phoneNumbers: z.string()
    .min(10, "Enter at least one phone number with GB amount")
    .refine((val) => {
      const lines = val.split(/\n/).map(n => n.trim()).filter(n => n);
      return lines.every(line => {
        const parts = line.split(/\s+/);
        if (parts.length !== 2) return false;
        
        // Check if phone number is valid (10 digits or 233 format)
        let phoneStr = parts[0].replace(/^\+/, '');
        if (phoneStr.startsWith('233')) {
          phoneStr = '0' + phoneStr.substring(3);
        }
        const phoneValid = /^0[0-9]{9}$/.test(phoneStr);
        
        // Check if GB amount is a valid number
        const gbAmount = parseFloat(parts[1]);
        const gbValid = !isNaN(gbAmount) && gbAmount > 0;
        
        return phoneValid && gbValid;
      });
    }, "Each line must have format: phone_number GB_amount (e.g., '0241234567 2' or '233241234567 2')"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type SingleOrderFormData = z.infer<typeof singleOrderSchema>;
type BulkOrderFormData = z.infer<typeof bulkOrderSchema>;

interface ValidationResult {
  valid: string[];
  invalid: { phone: string; reason: string }[];
}

export default function AgentNetworkPurchasePage() {
  const { slug, network } = useParams<{ slug: string; network: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderType, setOrderType] = useState<"single" | "bulk">("single");
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Disable bulk orders for AT Ishare network
  useEffect(() => {
    if (network === "at_ishare" && orderType === "bulk") {
      setOrderType("single");
      setValidationResult(null);
    }
  }, [network, orderType]);

  const info = networkInfo[network || ""] || { name: "Unknown", logo: "" };

  // Fetch agent data
  const { data: agent, isLoading: agentLoading } = useQuery<{ agent: Agent & { user: { name: string } } }>({
    queryKey: [`/api/store/${slug}`],
    enabled: !!slug,
  });
  // Agent-scoped products are provided via `/api/store/:slug` as `dataBundles` with `price`.
  const dataBundles = agent?.dataBundles || [];

  const filteredBundles = dataBundles?.filter(
    (bundle) => bundle.network === network && bundle.isActive
  );

  const sortedBundles = filteredBundles?.sort(
    (a, b) => parseFloat(a.price) - parseFloat(b.price)
  );

  const selectedBundle = sortedBundles?.find(bundle => bundle.id === selectedBundleId);
  const price = selectedBundle ? parseFloat(selectedBundle.price) : 0;

  const singleForm = useForm<SingleOrderFormData>({
    resolver: zodResolver(singleOrderSchema),
    defaultValues: {
      customerPhone: "",
      customerEmail: "",
    },
  });

  const bulkForm = useForm<BulkOrderFormData>({
    resolver: zodResolver(bulkOrderSchema),
    defaultValues: {
      phoneNumbers: "",
      customerEmail: "",
    },
  });

  // Calculate bulk purchase total with agent markup
  const bulkTotal = useMemo(() => {
    const phoneNumbers = bulkForm.watch("phoneNumbers");
    if (!phoneNumbers?.trim() || !sortedBundles || !agent?.agent) return null;
    
    const lines = phoneNumbers.split('\n').filter(line => line.trim());
    const markup = agent.agent.customPricingMarkup ? parseFloat(agent.agent.customPricingMarkup) : 0;
    let total = 0;
    let count = 0;
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length === 2) {
        const gbAmount = parseFloat(parts[1]);
        if (!isNaN(gbAmount) && gbAmount > 0) {
          const matchingBundle = sortedBundles.find(b => {
            const bundleName = b.name.toLowerCase();
            const gbMatch = bundleName.match(/(\d+(?:\.\d+)?)\s*gb/i);
            if (gbMatch) {
              const bundleGB = parseFloat(gbMatch[1]);
              return bundleGB === gbAmount;
            }
            return false;
          });
          
          if (matchingBundle) {
            const agentPrice = parseFloat(matchingBundle.price);
            total += agentPrice;
            count++;
          }
        }
      }
    }
    
    return count > 0 ? { total, count } : null;
  }, [bulkForm.watch("phoneNumbers"), sortedBundles, agent?.agent]);

  const initializePaymentMutation = useMutation({
    mutationFn: async (data: SingleOrderFormData | BulkOrderFormData | {
      orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }>;
      totalAmount: number;
      customerEmail?: string;
    }) => {
      console.log("[Agent Frontend] Payment mutation called with:", data);
      
      const isBulk = 'phoneNumbers' in data;
      
      // Handle new orderItems format (GB-based bulk orders)
      if ('orderItems' in data && data.orderItems) {
        const phoneNumbers = data.orderItems.map(item => item.phone);
        const totalAmount = data.totalAmount;

        console.log("[Agent Frontend] ========== NEW BULK FORMAT PAYMENT ==========");
        console.log("[Agent Frontend] Order items:", data.orderItems);
        console.log("[Agent Frontend] Total amount:", totalAmount);
        console.log("[Agent Frontend] ================================================");
        
        const payload = {
          productType: "data_bundle",
          network: network,
          customerPhone: phoneNumbers[0],
          isBulkOrder: true,
          orderItems: data.orderItems,
          totalAmount: totalAmount,
          customerEmail: data.customerEmail || undefined,
          agentSlug: slug || undefined,
        };
        
        console.log("[Agent Frontend] Paystack payload:", JSON.stringify(payload, null, 2));
        
        const response = await apiRequest("POST", "/api/checkout/initialize", payload);
        const result = await response.json();
        
        console.log("[Agent Frontend] ===== SERVER RESPONSE =====");
        console.log("[Agent Frontend] Result:", result);
        console.log("[Agent Frontend] ================================");
        
        return result;
      }
      
      // Handle single purchase or legacy bulk format
      if (!selectedBundle) throw new Error("No bundle selected");

      console.log("[Agent Frontend] Is bulk:", isBulk);
      console.log("[Agent Frontend] Data:", data);

      const phoneNumbers = isBulk 
        ? (data as BulkOrderFormData).phoneNumbers.split(/[\n,]/).map(n => n.trim()).filter(n => n)
        : [(data as SingleOrderFormData).customerPhone];

      console.log("[Agent Frontend] Phone numbers array:", phoneNumbers);
      console.log("[Agent Frontend] First phone:", phoneNumbers[0]);

      const totalAmount = price * phoneNumbers.length;

      const payload = {
        productType: "data_bundle",
        productId: selectedBundle.id,
        customerPhone: phoneNumbers[0],
        phoneNumbers: isBulk ? phoneNumbers : undefined,
        isBulkOrder: isBulk,
        customerEmail: data.customerEmail || undefined,
        agentSlug: slug || undefined,
      };

      console.log("[Agent Frontend] Single/Legacy payload:", JSON.stringify(payload, null, 2));

      const response = await apiRequest("POST", "/api/checkout/initialize", payload);
      return response.json();
    },
    onSuccess: (data) => {
      window.location.href = data.paymentUrl;
    },
    onError: (error: any) => {
      toast({
        title: "❌ Payment Failed",
        description: error.message || "Unable to process payment",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<{ [key: string]: any }>(firstSheet, { header: 1 });

        const phoneNumbers = jsonData
          .flat()
          .map((cell) => String(cell).trim())
          .filter((cell) => cell && /^0[0-9]{9}$/.test(cell));

        if (phoneNumbers.length === 0) {
          toast({
            title: "No Valid Numbers",
            description: "Could not find any valid phone numbers in the file",
            variant: "destructive",
          });
          return;
        }

        bulkForm.setValue("phoneNumbers", phoneNumbers.join("\n"));
        validateBulkNumbers(phoneNumbers);

        toast({
          title: "✅ File Uploaded",
          description: `Found ${phoneNumbers.length} valid phone numbers`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Could not read the Excel file",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateBulkNumbers = (numbers: string[]) => {
    if (!selectedBundle) return;

    const valid: string[] = [];
    const invalid: { phone: string; reason: string }[] = [];

    numbers.forEach((phone) => {
      const normalized = normalizePhoneNumber(phone);
      const validation = validatePhoneNetwork(normalized, selectedBundle.network);
      
      if (validation.isValid) {
        valid.push(normalized);
      } else {
        invalid.push({
          phone: normalized,
          reason: validation.error || "Invalid network",
        });
      }
    });

    setValidationResult({ valid, invalid });
  };

  const handleValidateNumbers = () => {
    const phoneNumbers = bulkForm.getValues("phoneNumbers")
      .split(/[\n,]/)
      .map(n => n.trim())
      .filter(n => n);

    if (phoneNumbers.length === 0) {
      toast({
        title: "No Numbers Entered",
        description: "Please enter phone numbers to validate",
        variant: "destructive",
      });
      return;
    }

    validateBulkNumbers(phoneNumbers);
  };

  const onSubmit = (data: SingleOrderFormData | BulkOrderFormData) => {
    const isBulk = 'phoneNumbers' in data;
    
    // Handle single purchase
    if (!isBulk) {
      if (!selectedBundle) {
        toast({
          title: "No Bundle Selected",
          description: "Please select a data bundle to continue",
          variant: "destructive",
        });
        return;
      }

      // Handle country code 233 (remove + if present)
      let phoneStr = (data as SingleOrderFormData).customerPhone.trim();
      phoneStr = phoneStr.replace(/^\+/, '');
      
      // If starts with 233, remove it and add 0
      if (phoneStr.startsWith('233')) {
        phoneStr = '0' + phoneStr.substring(3);
      }

      const normalizedPhone = normalizePhoneNumber(phoneStr);
      const validation = validatePhoneNetwork(normalizedPhone, selectedBundle.network);
      
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(selectedBundle.network);
        toast({
          title: "❌ Phone Number Mismatch",
          description: validation.error || `Valid prefixes: ${prefixes.join(", ")}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      setIsProcessing(true);
      initializePaymentMutation.mutate({
        customerPhone: normalizedPhone,
        customerEmail: (data as SingleOrderFormData).customerEmail,
      } as SingleOrderFormData);
      return;
    }

    // Handle bulk purchase with GB-based format
    const bulkData = data as BulkOrderFormData;
    if (!bulkData.phoneNumbers.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter phone numbers with GB amounts",
        variant: "destructive",
      });
      return;
    }

    // Parse phone numbers with GB amounts (Format: "0546591622 1" or "233546591622 2")
    const lines = bulkData.phoneNumbers.split('\n').filter(line => line.trim());
    const parsedData: Array<{ phone: string; gb: number }> = [];
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 2) {
        toast({
          title: "❌ Invalid Format",
          description: `Line "${line}" must have format: phone_number GB_amount (e.g., "0241234567 2")`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      let phoneStr = parts[0];
      const gbAmount = parseFloat(parts[1]);

      if (isNaN(gbAmount) || gbAmount <= 0) {
        toast({
          title: "❌ Invalid GB Amount",
          description: `GB amount "${parts[1]}" must be a positive number`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      // Handle country code 233 (remove + if present)
      phoneStr = phoneStr.replace(/^\+/, '');
      
      // If starts with 233, remove it and add 0
      if (phoneStr.startsWith('233')) {
        phoneStr = '0' + phoneStr.substring(3);
      }

      // Normalize the phone number
      const normalizedPhone = normalizePhoneNumber(phoneStr);

      // Validate phone number for the selected network
      const validation = validatePhoneNetwork(normalizedPhone, network || "");
      if (!validation.isValid) {
        const prefixes = getNetworkPrefixes(network || "");
        toast({
          title: "❌ Phone Number Mismatch",
          description: `${phoneStr}: ${validation.error || `Valid prefixes: ${prefixes.join(", ")}`}`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      parsedData.push({ phone: normalizedPhone, gb: gbAmount });
    }

    if (parsedData.length === 0) {
      toast({
        title: "No Data",
        description: "Please enter at least one phone number with GB amount",
        variant: "destructive",
      });
      return;
    }

    // Find matching bundles for each GB amount
    const orderItems: Array<{ phone: string; bundleId: string; bundleName: string; price: number }> = [];
    let totalAmount = 0;
    const markup = agent?.agent?.customPricingMarkup ? parseFloat(agent.agent.customPricingMarkup) : 0;

    for (const item of parsedData) {
      // Find a bundle that matches the GB amount
      const matchingBundle = sortedBundles?.find(b => {
        const bundleName = b.name.toLowerCase();
        const gbMatch = bundleName.match(/(\d+(?:\.\d+)?)\s*gb/i);
        if (gbMatch) {
          const bundleGB = parseFloat(gbMatch[1]);
          return bundleGB === item.gb;
        }
        return false;
      });

      if (!matchingBundle) {
        toast({
          title: "❌ Bundle Not Found",
          description: `No ${item.gb}GB bundle available for ${info.name}. Please check available bundles.`,
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      const agentPrice = parseFloat(matchingBundle.price);

      orderItems.push({
        phone: item.phone,
        bundleId: matchingBundle.id,
        bundleName: matchingBundle.name,
        price: agentPrice,
      });

      totalAmount += agentPrice;
    }

    console.log("[Agent Frontend] Agent markup:", markup + "%");
    console.log("[Agent Frontend] Prepared order items:", orderItems);
    console.log("[Agent Frontend] Total amount:", totalAmount);

    setIsProcessing(true);
    initializePaymentMutation.mutate({
      orderItems,
      totalAmount,
      customerEmail: bulkData.customerEmail,
    });
  };

  if (agentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <p className="text-center text-muted-foreground">Agent store not found</p>
        </Card>
      </div>
    );
  }

  const totalAmount = orderType === "bulk" && bulkForm.watch("phoneNumbers")
    ? price * bulkForm.watch("phoneNumbers").split(/[\n,]/).map(n => n.trim()).filter(n => n).length
    : price;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href={`/store/${slug}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-xl font-bold">{agent?.agent.businessName}</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Network Header */}
          <div className="flex items-center gap-4 mb-8">
            {info.logo && (
              <img
                src={info.logo}
                alt={info.name}
                className="w-16 h-16 object-contain rounded-lg"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{info.name} Data Bundles</h2>
              <p className="text-muted-foreground">Complete your purchase below</p>
            </div>
          </div>

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Complete Your Purchase
              </CardTitle>
              <CardDescription>Enter order details and checkout</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Order Type Selection */}
              <Tabs value={orderType} onValueChange={(v) => {
                  setOrderType(v as "single" | "bulk");
                  setValidationResult(null);
                }} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="single">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Single Purchase
                    </TabsTrigger>
                    <TabsTrigger value="bulk" disabled={network === "at_ishare"}>
                      <Package className="h-4 w-4 mr-2" />
                      Bulk Purchase
                      {network === "at_ishare" && (
                        <span className="text-xs text-muted-foreground ml-1">(Disabled)</span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  {network === "at_ishare" && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Bulk purchases are not available for AT iShare network.
                    </p>
                  )}

                  {/* Single Order Form */}
                  <TabsContent value="single" className="space-y-4 mt-4">
                    <Form {...singleForm}>
                      <form onSubmit={singleForm.handleSubmit(onSubmit)} className="space-y-4">
                      {/* Bundle Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="single-bundle-select">Select Data Bundle</Label>
                        <Select value={selectedBundleId} onValueChange={(value) => {
                          setSelectedBundleId(value);
                          setValidationResult(null);
                        }}>
                          <SelectTrigger id="single-bundle-select" className="w-full">
                            <SelectValue placeholder="Choose a data bundle..." />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedBundles?.map((bundle) => (
                              <SelectItem key={bundle.id} value={bundle.id}>
                                  {bundle.name} - {bundle.validity} - {formatCurrency(parseFloat(bundle.price))}
                                </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <FormField
                        control={singleForm.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Beneficiary Number *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="0241234567" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Network prefixes: {getNetworkPrefixes(network || "").join(", ")}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={singleForm.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email (Optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>For receipt and order updates</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="pt-4">
                        <div className="flex items-center justify-between mb-4 p-4 bg-muted rounded-lg">
                          <span className="text-lg font-semibold">Total Amount:</span>
                          <span className="text-2xl font-bold text-primary">
                            {formatCurrency(price)}
                          </span>
                        </div>

                        <Button
                          type="submit"
                          className="w-full gap-2"
                          size="lg"
                          disabled={isProcessing || !selectedBundleId}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-5 w-5" />
                              Proceed to Payment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                  </TabsContent>

                  {/* Bulk Order Form */}
                  <TabsContent value="bulk" className="space-y-4 mt-4">
                    <Form {...bulkForm}>
                      <form onSubmit={bulkForm.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Label htmlFor="bulk-phones">Beneficiary Numbers and GB Amounts</Label>
                            {bulkForm.watch("phoneNumbers") && bulkForm.watch("phoneNumbers").trim() && (
                              <Badge variant="outline" className="text-xs">
                                {bulkForm.watch("phoneNumbers").split('\n').filter(line => line.trim()).length} entries
                              </Badge>
                            )}
                          </div>
                          <FormField
                            control={bulkForm.control}
                            name="phoneNumbers"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Textarea
                                    id="bulk-phones"
                                    placeholder="0546591622 1&#10;0247064874 3&#10;0245696072 2&#10;233547897522 10&#10;...add as many as you need (no limit)"
                                    rows={20}
                                    className="font-mono text-sm"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Enter one number per line with GB amount (e.g., "0241234567 2" for 2GB). 
                                  Supports formats: 0241234567 or 233241234567 (no + sign). 
                                  <strong className="text-green-600">✓ No limit - add 100+ numbers!</strong>
                                  <br />
                                  All numbers must be for <strong>{info.name}</strong> network. 
                                  Valid prefixes: <strong>{getNetworkPrefixes(network || "").join(", ")}</strong>
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={bulkForm.control}
                          name="customerEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                  <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>For receipt and order updates</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          size="lg"
                          disabled={isProcessing || !bulkForm.watch("phoneNumbers")?.trim()}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Smartphone className="mr-2 h-4 w-4" />
                              {bulkTotal ? (
                                <>
                                  Purchase {bulkTotal.count} {bulkTotal.count === 1 ? 'Bundle' : 'Bundles'} - {formatCurrency(bulkTotal.total)}
                                </>
                              ) : (
                                'Purchase Data Bundles'
                              )}
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
            </CardContent>
          </Card>

          {/* Important Notices */}
          <div className="mt-8 space-y-4">
            <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Data Delivery Time</h3>
                    <p className="text-muted-foreground">
                      Data takes between 10 to 30 minutes — maximum 60 minutes (1 hour) — to be credited.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 dark:border-orange-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-orange-900 dark:text-orange-100">
                      Our DATA REQUEST DOES NOT support:
                    </h3>
                    <ul className="text-muted-foreground space-y-1 ml-4">
                      <li>• Turbonet SIM</li>
                      <li>• Merchant SIM</li>
                      <li>• EVD SIM</li>
                      <li>• Broadband SIM</li>
                      <li>• Blacklisted SIM</li>
                      <li>• Roaming SIM</li>
                      <li>• Different Network</li>
                      <li>• Wrong Number</li>
                      <li>• Inactive Number</li>
                    </ul>
                    <p className="text-orange-800 dark:text-orange-200 font-medium mt-3">
                      Important Notice: Any data transferred to the above SIM types is burnt and irreversible.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
        </div>
      </main>
    </div>
  );
}
