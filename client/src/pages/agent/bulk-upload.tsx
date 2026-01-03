import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AgentSidebar } from "@/components/layout/agent-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { validatePhoneNetwork, detectNetwork, getNetworkDisplayName, getNetworkPrefixes, normalizePhoneNumber } from "@/lib/network-validator";
import { Menu, Upload, FileSpreadsheet, FileText, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import * as XLSX from "xlsx";
import type { DataBundle } from "@shared/schema";

interface ValidationResult {
  phone: string;
  network: string | null;
  isValid: boolean;
  error?: string;
}

interface BulkOrder {
  phone: string;
  bundleId: string;
  bundleName: string;
  network: string;
  amount: string;
}

export default function AgentBulkUpload() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [selectedBundleId, setSelectedBundleId] = useState<string>("");
  const { toast } = useToast();

  const { data: dataBundles } = useQuery<DataBundle[]>({
    queryKey: ["/api/products/data-bundles"],
  });

  const networkBundles = dataBundles?.filter(
    (bundle) => bundle.network === selectedNetwork && bundle.isActive
  );

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
        
        // Extract phone numbers from first column (skip header if exists)
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
  };

  const processBulkOrder = async () => {
    if (!selectedNetwork || !selectedBundleId) {
      toast({
        title: "Selection Required",
        description: "Please select a network and data bundle",
        variant: "destructive",
      });
      return;
    }

    const validNumbers = validationResults
      .filter((r) => r.isValid && r.network === selectedNetwork)
      .map((r) => r.phone);

    if (validNumbers.length === 0) {
      toast({
        title: "No Valid Numbers",
        description: `No ${selectedNetwork.toUpperCase()} numbers found for this order`,
        variant: "destructive",
      });
      return;
    }

    const selectedBundle = networkBundles?.find((b) => b.id === selectedBundleId);
    if (!selectedBundle) return;

    const orders: BulkOrder[] = validNumbers.map((phone) => ({
      phone,
      bundleId: selectedBundle.id,
      bundleName: selectedBundle.name,
      network: selectedBundle.network,
      amount: selectedBundle.basePrice,
    }));

    const totalAmount = orders.length * parseFloat(selectedBundle.basePrice);

    toast({
      title: "Bulk Order Summary",
      description: `${orders.length} orders × GH₵${selectedBundle.basePrice} = GH₵${totalAmount.toFixed(2)}`,
    });

    // Here you would send the bulk order to your backend
    // For now, we'll just show the summary
  };

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

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r">
            <AgentSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden lg:block">
        <AgentSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">Bulk Upload</h1>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Network Prefix Rules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Ghana Network Prefixes
                </CardTitle>
                <CardDescription>
                  Phone numbers are validated based on their network prefixes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <h4 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">MTN</h4>
                    <div className="flex flex-wrap gap-2">
                      {getNetworkPrefixes("mtn").map((prefix) => (
                        <Badge key={prefix} variant="secondary">{prefix}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">Telecel</h4>
                    <div className="flex flex-wrap gap-2">
                      {getNetworkPrefixes("telecel").map((prefix) => (
                        <Badge key={prefix} variant="secondary">{prefix}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <h4 className="font-semibold text-red-700 dark:text-red-400 mb-2">AirtelTigo</h4>
                    <div className="flex flex-wrap gap-2">
                      {getNetworkPrefixes("airteltigo").map((prefix) => (
                        <Badge key={prefix} variant="secondary">{prefix}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Paste Phone Numbers
                  </CardTitle>
                  <CardDescription>
                    Enter one phone number per line
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="0241234567&#10;0501234567&#10;0261234567"
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <Button onClick={validatePhoneNumbers} className="w-full">
                    Validate Numbers
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Upload Excel File
                  </CardTitle>
                  <CardDescription>
                    Upload an Excel file with phone numbers in the first column
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>
            </div>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Validation Results</CardTitle>
                  <CardDescription>
                    {validationResults.filter(r => r.isValid).length} valid numbers out of {validationResults.length}
                  </CardDescription>
                </CardHeader>
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
              </Card>
            )}

            {/* Bulk Order Selection */}
            {validationResults.some(r => r.isValid) && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Bulk Order</CardTitle>
                  <CardDescription>
                    Select network and data bundle for validated numbers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Network</Label>
                      <select
                        value={selectedNetwork}
                        onChange={(e) => {
                          setSelectedNetwork(e.target.value);
                          setSelectedBundleId("");
                        }}
                        className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2"
                      >
                        <option value="">Select Network</option>
                        <option value="mtn">MTN</option>
                        <option value="telecel">Telecel</option>
                        <option value="airteltigo">AirtelTigo</option>
                      </select>
                    </div>
                    <div>
                      <Label>Data Bundle</Label>
                      <select
                        value={selectedBundleId}
                        onChange={(e) => setSelectedBundleId(e.target.value)}
                        className="w-full mt-1 h-10 rounded-md border border-input bg-background px-3 py-2"
                        disabled={!selectedNetwork}
                      >
                        <option value="">Select Bundle</option>
                        {networkBundles?.map((bundle) => (
                          <option key={bundle.id} value={bundle.id}>
                            {bundle.dataAmount} - GH₵{bundle.basePrice}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedNetwork && selectedBundleId && (
                    <Alert>
                      <AlertDescription>
                        <strong>
                          {validationResults.filter(r => r.isValid && r.network === selectedNetwork).length}
                        </strong> {selectedNetwork.toUpperCase()} numbers will be processed
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    onClick={processBulkOrder}
                    className="w-full"
                    disabled={!selectedNetwork || !selectedBundleId}
                  >
                    Process Bulk Order
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
