import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/constants";
import { validatePhoneNetwork, detectNetwork, getNetworkDisplayName, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { 
  Store, Shield, Phone, Mail, Upload, FileSpreadsheet, FileText, 
  CheckCircle, XCircle, AlertCircle, Download, ShoppingCart, 
  Loader2, Package, CreditCard, Smartphone, ChevronDown, ChevronUp 
} from "lucide-react";
import * as XLSX from "xlsx";
import type { Agent, DataBundle } from "@shared/schema";
import banner1 from "@assets/banner1_1765774201032.jpeg";
import banner2 from "@assets/banner2_1765774201033.jpeg";
import banner3 from "@assets/banner3_1765774201030.jpeg";
import mtnLogo from "@assets/mtn_1765780772203.jpg";
import telecelLogo from "@assets/telecel_1765780772206.jpg";
import airteltigoLogo from "@assets/at_1765780772206.jpg";
import resultLogo from "@assets/result_1765780772205.jpg";

const bannerImages = [banner1, banner2, banner3];

// Types
interface StorefrontData {
  agent: Agent & { user: { name: string } };
}

interface ValidationResult {
  phone: string;
  network: string | null;
  isValid: boolean;
  error?: string;
}

// Form schemas
const singleOrderSchema = z.object({
  customerPhone: z.string()
    .min(10, "Phone number must be exactly 10 digits")
    .max(10, "Phone number must be exactly 10 digits")
    .regex(/^0[0-9]{9}$/, "Phone number must start with 0 and be 10 digits"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

const bulkOrderSchema = z.object({
  phoneNumbers: z.string().min(10, "Enter at least one phone number"),
  customerEmail: z.string().email("Invalid email").optional().or(z.literal("")),
});

type SingleOrderFormData = z.infer<typeof singleOrderSchema>;
type BulkOrderFormData = z.infer<typeof bulkOrderSchema>;

export default function AgentPublicStorefront() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // State management
  const [currentBanner, setCurrentBanner] = useState(0);
  const [orderType, setOrderType] = useState<"single" | "bulk">("single");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isStep1Open, setIsStep1Open] = useState(true);
  const [isStep2Open, setIsStep2Open] = useState(false);
  const [isStep3Open, setIsStep3Open] = useState(false);

  // Banner carousel effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Queries
  const { data, isLoading } = useQuery<StorefrontData & { dataBundles?: Array<any> }>({
    queryKey: ["/api/store", slug],
    enabled: !!slug,
    refetchInterval: 30000,
  });

  const agent = data?.agent;

  // Persist agent store context so downstream pages (checkout, receipt) know this is an agent storefront
  useEffect(() => {
    if (slug) {
      try {
        localStorage.setItem("agentStore", slug);
      } catch (e) {
        // ignore storage errors
      }
    }
  }, [slug]);

  // Agent products come from agent-scoped source only and are not available until `data` is loaded
  const dataBundles = data?.dataBundles || [];

  // Filter bundles by selected network (use agent product `price`)
  const networkBundles = dataBundles?.filter(
    (bundle) => bundle.network === selectedNetwork && bundle.isActive
  )?.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

  const selectedBundle = networkBundles?.find(bundle => bundle.id === selectedBundleId);

  // Forms
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

  // Excel file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as string[][];
        
        const phones = jsonData
          .flat()
          .filter((cell) => cell && typeof cell === "string")
          .map((cell) => cell.toString().trim())
          .filter((phone) => /\d{10}/.test(phone));
        
        setPhoneNumbers(phones.join("\n"));
        toast({
          title: "File Uploaded",
          description: `Found ${phones.length} phone numbers`,
        });
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "Could not read Excel file. Please check the format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Phone number validation
  const validatePhoneNumbers = () => {
    if (!phoneNumbers.trim()) {
      toast({
        title: "No Phone Numbers",
        description: "Please enter or upload phone numbers",
        variant: "destructive",
      });
      return;
    }

    const lines = phoneNumbers
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const results: ValidationResult[] = lines.map((phone) => {
      const normalized = normalizePhoneNumber(phone);
      const network = detectNetwork(normalized);
      
      if (!network) {
        return {
          phone: normalized,
          network: null,
          isValid: false,
          error: "Invalid or unrecognized network prefix",
        };
      }

      return {
        phone: normalized,
        network,
        isValid: true,
      };
    });

    setValidationResults(results);
    
    const validCount = results.filter(r => r.isValid).length;
    const invalidCount = results.length - validCount;
    
    toast({
      title: "Validation Complete",
      description: `${validCount} valid numbers, ${invalidCount} invalid`,
    });

    // Auto-expand step 3 if validation successful
    if (validCount > 0) {
      setIsStep3Open(true);
    }
  };

  // Download template
  const downloadTemplate = () => {
    const template = [
      ["Phone Numbers"],
      ["0241234567"],
      ["0501234567"],
      ["0261234567"],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Phone Numbers");
    XLSX.writeFile(wb, "bulk_upload_template.xlsx");
    
    toast({
      title: "Template Downloaded",
      description: "Use this template to upload phone numbers",
    });
  };

  // Payment initialization mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (data: SingleOrderFormData | BulkOrderFormData) => {
      if (!selectedBundle) throw new Error("No bundle selected");
      if (!agent) throw new Error("Store not found");

      const isBulk = orderType === "bulk";
      const phoneNumbersList = isBulk 
        ? phoneNumbers.split("\n").map(n => normalizePhoneNumber(n.trim())).filter(n => n)
        : [normalizePhoneNumber((data as SingleOrderFormData).customerPhone)];

      // Validate all phone numbers match the bundle network
      for (const phone of phoneNumbersList) {
        const validation = validatePhoneNetwork(phone, selectedBundle.network);
        if (!validation.isValid) {
          throw new Error(`${phone}: ${validation.error}`);
        }
      }

      const totalAmount = parseFloat(selectedBundle.price) * phoneNumbersList.length;

      const payload = {
        productType: "data_bundle",
        productId: selectedBundle.id,
        customerPhone: phoneNumbersList[0],
        phoneNumbers: isBulk ? phoneNumbersList : undefined,
        isBulkOrder: isBulk,
        customerEmail: data.customerEmail || undefined,
        agentSlug: slug,
      };

      const response = await apiRequest("POST", "/api/checkout/initialize", payload);
      return await response.json();
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
    },
  });

  // Submit handlers
  const handleSingleOrder = (data: SingleOrderFormData) => {
    if (!selectedBundle) {
      toast({
        title: "No Bundle Selected",
        description: "Please select a data bundle",
        variant: "destructive",
      });
      return;
    }
    initializePaymentMutation.mutate(data);
  };

  const handleBulkOrder = () => {
    if (!selectedBundle) {
      toast({
        title: "No Bundle Selected",
        description: "Please select a data bundle",
        variant: "destructive",
      });
      return;
    }

    if (!selectedNetwork) {
      toast({
        title: "No Network Selected",
        description: "Please select a network",
        variant: "destructive",
      });
      return;
    }

    const validNumbers = validationResults.filter(r => r.isValid && r.network === selectedNetwork);
    
    if (validNumbers.length === 0) {
      toast({
        title: "No Valid Numbers",
        description: `No ${selectedNetwork.toUpperCase()} numbers found`,
        variant: "destructive",
      });
      return;
    }

    const email = bulkForm.getValues("customerEmail");
    initializePaymentMutation.mutate({ phoneNumbers, customerEmail: email });
  };

  // Loading state
  if (isLoading || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const productCategories = [
    {
      id: "mtn",
      name: "MTN Data Bundles",
      description: "Buy MTN data bundles.",
      image: mtnLogo,
      network: "mtn"
    },
    {
      id: "telecel",
      name: "Telecel Data Bundles",
      description: "Buy Telecel data bundles.",
      image: telecelLogo,
      network: "telecel"
    },
    {
      id: "at_bigtime",
      name: "AT BIG TIME Bundles",
      description: "Buy AT BIG TIME data bundles.",
      image: airteltigoLogo,
      network: "at_bigtime"
    },
    {
      id: "at_ishare",
      name: "AT iShare Bundles",
      description: "Buy AT iShare data bundles.",
      image: airteltigoLogo,
      network: "at_ishare"
    },
    {
      id: "waec-result-checker",
      name: "WAEC Result Checker",
      description: "Purchase BECE & WASSCE result checkers.",
      image: resultLogo,
      network: "result-checkers"
    },
  ];

  const handleProductClick = (network: string) => {
    setLocation(`/store/${slug}/${network}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6" />
            <span className="font-semibold text-lg">{agent.businessName}</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section with Banner */}
        <section className="relative">
          <div className="relative h-[400px] md:h-[500px]">
            {bannerImages.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Banner ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                  index === currentBanner ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute inset-0 bg-black/50" />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto max-w-6xl text-center px-4">
                <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white">
                  Welcome to <span className="text-blue-400">{agent.businessName}</span>
                </h1>
                <p className="text-lg text-white/90 max-w-2xl mx-auto">
                  {agent.businessDescription || "Purchase data bundles instantly with secure payments."}
                </p>
              </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {bannerImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentBanner ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Product Categories Section */}
        <section id="products" className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-2xl font-bold text-center mb-8">Select Network</h2>
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-4 max-w-2xl">
                {productCategories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="p-3 h-full flex flex-col items-center justify-center gap-2 cursor-pointer hover-elevate transition-all min-h-[120px] w-full max-w-[180px]"
                    onClick={() => handleProductClick(cat.network)}
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-lg flex-shrink-0"
                    />
                    <div className="flex flex-col items-center gap-1 flex-1 justify-center">
                      <p className="text-sm font-semibold text-center leading-tight">{cat.name}</p>
                      <p className="text-xs text-center text-muted-foreground leading-tight">{cat.description}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Order Section */}
        <section id="order-section" className="py-12 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl space-y-6">
          {/* Single Order Flow */}
          {orderType === "single" && (
            <div className="space-y-6">
              {/* Enter Details */}
              {selectedBundle && (
                  <Card>
                      <CardContent>
                        <Form {...singleForm}>
                          <form onSubmit={singleForm.handleSubmit(handleSingleOrder)} className="space-y-4">
                            <FormField
                              control={singleForm.control}
                              name="customerPhone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone Number *</FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input placeholder="0241234567" className="pl-10" {...field} />
                                    </div>
                                  </FormControl>
                                  <FormDescription>
                                    Network prefixes: {getNetworkPrefixes(selectedBundle.network).join(", ")}
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

                            <Alert>
                              <CreditCard className="h-4 w-4" />
                              <AlertDescription>
                                <div className="flex items-center justify-between">
                                  <span>Total Amount:</span>
                                  <span className="text-2xl font-bold">{formatCurrency(selectedBundle.price)}</span>
                                </div>
                              </AlertDescription>
                            </Alert>

                            <Button type="submit" className="w-full" size="lg" disabled={initializePaymentMutation.isPending}>
                              {initializePaymentMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Pay with Paystack
                                </>
                              )}
                            </Button>
                          </form>
                        </Form>
                      </CardContent>
                  </Card>
              )}
            </div>
          )}

          {/* Bulk Order Flow */}
          {orderType === "bulk" && (
            <div className="space-y-6">
              {/* Step 1: Upload Phone Numbers */}
              <Collapsible open={isStep1Open} onOpenChange={setIsStep1Open}>
                <Card>
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          1
                        </div>
                        <div className="text-left">
                          <CardTitle>Upload Phone Numbers</CardTitle>
                          <CardDescription>Paste or upload a list of phone numbers</CardDescription>
                        </div>
                      </div>
                      {isStep1Open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Label>Paste Phone Numbers</Label>
                          <Textarea
                            placeholder="0241234567&#10;0501234567&#10;0261234567"
                            value={phoneNumbers}
                            onChange={(e) => setPhoneNumbers(e.target.value)}
                            rows={10}
                            className="font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-4">
                          <Label>Upload Excel File</Label>
                          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                            <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <span className="text-sm text-muted-foreground">
                                Click to upload or drag and drop
                              </span>
                              <Input
                                id="file-upload"
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                              />
                            </Label>
                          </div>
                          <Button
                            variant="outline"
                            onClick={downloadTemplate}
                            className="w-full gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download Template
                          </Button>
                        </div>
                      </div>

                      <Button onClick={validatePhoneNumbers} className="w-full" size="lg">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Validate Numbers
                      </Button>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>

              {/* Step 2: Validation Results */}
              {validationResults.length > 0 && (
                <Collapsible open={isStep2Open} onOpenChange={setIsStep2Open}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            2
                          </div>
                          <div className="text-left">
                            <CardTitle>Validation Results</CardTitle>
                            <CardDescription>
                              {validationResults.filter(r => r.isValid).length} valid / {validationResults.length} total
                            </CardDescription>
                          </div>
                        </div>
                        {isStep2Open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Phone Number</TableHead>
                                <TableHead>Network</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {validationResults.map((result, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-mono">{result.phone}</TableCell>
                                  <TableCell>
                                    {result.network ? (
                                      <Badge variant="outline">{result.network.toUpperCase()}</Badge>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {result.isValid ? (
                                      <div className="flex items-center gap-2 text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                        <span className="text-sm">Valid</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2 text-red-600">
                                        <XCircle className="h-4 w-4" />
                                        <span className="text-sm">{result.error}</span>
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Step 3: Select Bundle & Pay */}
              {validationResults.some(r => r.isValid) && (
                <Collapsible open={isStep3Open} onOpenChange={setIsStep3Open}>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                            3
                          </div>
                          <div className="text-left">
                            <CardTitle>Select Bundle & Complete Payment</CardTitle>
                            <CardDescription>Choose network and data bundle</CardDescription>
                          </div>
                        </div>
                        {isStep3Open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Network</Label>
                          <RadioGroup value={selectedNetwork} onValueChange={(value) => {
                            setSelectedNetwork(value);
                            setSelectedBundleId("");
                          }}>
                            <div className="grid grid-cols-2 gap-3 mt-2">
                              <Label htmlFor="bulk-mtn" className="cursor-pointer">
                                <div className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${selectedNetwork === "mtn" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}>
                                  <RadioGroupItem value="mtn" id="bulk-mtn" className="sr-only" />
                                  <Badge style={{ backgroundColor: "#FFCC00", color: "#000" }}>MTN</Badge>
                                  <span className="text-sm text-center">
                                    {validationResults.filter(r => r.isValid && r.network === "mtn").length} numbers
                                  </span>
                                </div>
                              </Label>
                              <Label htmlFor="bulk-telecel" className="cursor-pointer">
                                <div className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${selectedNetwork === "telecel" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}>
                                  <RadioGroupItem value="telecel" id="bulk-telecel" className="sr-only" />
                                  <Badge style={{ backgroundColor: "#0066CC", color: "#fff" }}>Telecel</Badge>
                                  <span className="text-sm text-center">
                                    {validationResults.filter(r => r.isValid && r.network === "telecel").length} numbers
                                  </span>
                                </div>
                              </Label>
                              <Label htmlFor="bulk-at_bigtime" className="cursor-pointer">
                                <div className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${selectedNetwork === "at_bigtime" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}>
                                  <RadioGroupItem value="at_bigtime" id="bulk-at_bigtime" className="sr-only" />
                                  <Badge style={{ backgroundColor: "#FF0000", color: "#fff" }}>AT BIG TIME</Badge>
                                  <span className="text-sm text-center">
                                    {validationResults.filter(r => r.isValid && r.network === "at_bigtime").length} numbers
                                  </span>
                                </div>
                              </Label>
                              <Label htmlFor="bulk-at_ishare" className="cursor-pointer">
                                <div className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${selectedNetwork === "at_ishare" ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}>
                                  <RadioGroupItem value="at_ishare" id="bulk-at_ishare" className="sr-only" />
                                  <Badge style={{ backgroundColor: "#FF0000", color: "#fff" }}>AT iShare</Badge>
                                  <span className="text-sm text-center">
                                    {validationResults.filter(r => r.isValid && r.network === "at_ishare").length} numbers
                                  </span>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {selectedNetwork && networkBundles && networkBundles.length > 0 && (
                          <div>
                            <Label>Select Bundle</Label>
                            <RadioGroup value={selectedBundleId} onValueChange={setSelectedBundleId}>
                              <div className="grid gap-2 mt-2">
                                {networkBundles.map((bundle) => {
                                  const validCount = validationResults.filter(r => r.isValid && r.network === selectedNetwork).length;
                                  const totalPrice = parseFloat(bundle.price) * validCount;
                                  
                                  return (
                                    <Label key={bundle.id} htmlFor={`bulk-${bundle.id}`} className="cursor-pointer">
                                      <div className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${selectedBundleId === bundle.id ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"}`}>
                                        <div className="flex items-center gap-3">
                                          <RadioGroupItem value={bundle.id} id={`bulk-${bundle.id}`} className="sr-only" />
                                          <Smartphone className="h-5 w-5 text-muted-foreground" />
                                          <div>
                                            <div className="font-medium">{bundle.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {bundle.dataAmount} - {bundle.validity}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                              {formatCurrency(bundle.price)} × {validCount} = {formatCurrency(totalPrice.toFixed(2))}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-lg font-bold">{formatCurrency(totalPrice.toFixed(2))}</div>
                                      </div>
                                    </Label>
                                  );
                                })}
                              </div>
                            </RadioGroup>
                          </div>
                        )}

                        {selectedBundle && (
                          <Form {...bulkForm}>
                            <form onSubmit={bulkForm.handleSubmit(handleBulkOrder)} className="space-y-4">
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

                              {selectedNetwork && selectedBundleId && (
                                <Alert>
                                  <CreditCard className="h-4 w-4" />
                                  <AlertDescription>
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span>Recipients:</span>
                                        <span className="font-bold">
                                          {validationResults.filter(r => r.isValid && r.network === selectedNetwork).length}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span>Unit Price:</span>
                                        <span className="font-bold">{formatCurrency(selectedBundle.price)}</span>
                                      </div>
                                      <div className="flex items-center justify-between text-lg">
                                        <span>Total Amount:</span>
                                        <span className="font-bold text-primary">
                                          {formatCurrency((parseFloat(selectedBundle.price) * validationResults.filter(r => r.isValid && r.network === selectedNetwork).length).toFixed(2))}
                                        </span>
                                      </div>
                                    </div>
                                  </AlertDescription>
                                </Alert>
                              )}

                              <Button 
                                type="button" 
                                className="w-full" 
                                size="lg" 
                                disabled={!selectedNetwork || !selectedBundleId || initializePaymentMutation.isPending}
                                onClick={handleBulkOrder}
                              >
                                {initializePaymentMutation.isPending ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Pay with Paystack
                                  </>
                                )}
                              </Button>
                            </form>
                          </Form>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </div>
          )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {agent.businessName}. Powered by SmartDataStore
          </p>
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Secure payments • Fast delivery • 24/7 support</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
