import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { NetworkProvider } from "@shared/schema";

interface BulkUploadData {
  network: string;
  data: string;
  file?: File;
}

export function BulkUploadSection() {
  const [uploadData, setUploadData] = useState<BulkUploadData>({
    network: "",
    data: "",
  });
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const bulkUploadMutation = useMutation({
    mutationFn: async (data: BulkUploadData) => {
      if (data.file) {
        // Handle file upload - the file should have format: phone GB (one per line)
        const formData = new FormData();
        formData.append('network', data.network);
        formData.append('file', data.file);

        const response = await fetch('/api/user/bulk-upload', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
          throw new Error(errorData.message || 'Upload failed');
        }

        return response.json();
      } else {
        // Handle text input with new format: phone GB
        const response = await fetch('/api/user/bulk-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            network: data.network,
            data: data.data,
          }),
          credentials: 'include',
        });
        if (!response.ok) {
          throw new Error('Upload failed');
        }
        return response.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      setUploadData({ network: "", data: "" });
      setUploadedFile(null);
      toast.success(`Bulk upload completed! ${data.processed || 0} items processed.`);
    },
    onError: (error: Error) => {
      toast.error("Bulk upload failed", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.network) {
      toast.error("Please select a network");
      return;
    }
    if (!uploadData.data && !uploadedFile) {
      toast.error("Please provide data or upload a file");
      return;
    }
    bulkUploadMutation.mutate(uploadData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadData({ ...uploadData, data: "" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Upload Data Bundles
        </CardTitle>
        <CardDescription>
          Upload multiple data bundle purchases at once using Excel or text format
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="network">Network</Label>
            <Select
              value={uploadData.network}
              onValueChange={(value) => setUploadData({ ...uploadData, network: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select network" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NetworkProvider.MTN}>MTN</SelectItem>
                <SelectItem value={NetworkProvider.TELECEL}>Telecel</SelectItem>
                <SelectItem value={NetworkProvider.AIRTELTIGO}>AirtelTigo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">Phone Numbers with GB Amounts (Text Format)</Label>
            <Textarea
              id="data"
              value={uploadData.data}
              onChange={(e) => setUploadData({ ...uploadData, data: e.target.value })}
              placeholder="Enter phone number and GB amount per line&#10;e.g.,&#10;0546591622 1&#10;0247064874 3&#10;0245696072 2&#10;233547897522 10"
              rows={6}
              disabled={!!uploadedFile}
            />
            <p className="text-xs text-muted-foreground">
              Format: phone_number GB_amount (one per line). Supports 0241234567 or 233241234567 (no + sign) - OR upload an Excel/CSV file below
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Upload Excel/CSV File (Optional)</Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
            />
            <p className="text-xs text-muted-foreground">
              Excel/CSV format: Column 1: Phone number, Column 2: GB amount (no headers needed)
            </p>
            {uploadedFile && (
              <p className="text-sm text-green-600 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                File selected: {uploadedFile.name}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={bulkUploadMutation.isPending}
          >
            {bulkUploadMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload & Purchase
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}