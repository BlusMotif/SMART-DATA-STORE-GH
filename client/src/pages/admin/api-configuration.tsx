import { useEffect, useState } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Menu, Eye, EyeOff } from "lucide-react";

export default function AdminApiConfiguration() {
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    mtnApiKey: "",
    mtnEndpoint: "",
    telecelApiKey: "",
    airteltigo_at_bigtime: "",
    airteltigo_at_ishare: "",
    paystackSecret: "",
    paystackPublic: "",
  });
  const [show, setShow] = useState({
    mtnApiKey: false,
    telecelApiKey: false,
    airteltigo_at_bigtime: false,
    airteltigo_at_ishare: false,
    paystackSecret: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await apiRequest("GET", "/api/admin/api-config");
        setForm({
          mtnApiKey: data["api.mtn.key"] || "",
          mtnEndpoint: data["api.mtn.endpoint"] || "",
          telecelApiKey: data["api.telecel.key"] || "",
          airteltigo_at_bigtime: data["api.at_bigtime.key"] || "",
          airteltigo_at_ishare: data["api.at_ishare.key"] || "",
          paystackSecret: data["paystack.secret_key"] || "",
          paystackPublic: data["paystack.public_key"] || "",
        });
      } catch (error) {
        console.error(error);
      }
    })();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Record<string, string> = {
        "api.mtn.key": form.mtnApiKey,
        "api.mtn.endpoint": form.mtnEndpoint,
        "api.telecel.key": form.telecelApiKey,
        "api.at_bigtime.key": form.airteltigo_at_bigtime,
        "api.at_ishare.key": form.airteltigo_at_ishare,
        "paystack.secret_key": form.paystackSecret,
        "paystack.public_key": form.paystackPublic,
      };

      await apiRequest("POST", "/api/admin/api-config", payload);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/api-config"] });
      toast({ title: "API configuration saved" });
    } catch (error: any) {
      toast({ title: "Failed to save configuration", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out">
            <AdminSidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="hidden md:block">
        <AdminSidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-4 h-16 border-b px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg lg:text-xl font-semibold">API Configuration</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>General API settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>MTN API Endpoint</Label>
                    <Input value={form.mtnEndpoint} onChange={(e) => setForm({ ...form, mtnEndpoint: e.target.value })} placeholder="https://api.example.com" />
                  </div>
                  <div>
                    <Label>MTN API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={show.mtnApiKey ? "text" : "password"}
                        value={form.mtnApiKey}
                        onChange={(e) => setForm({ ...form, mtnApiKey: e.target.value })}
                        placeholder="MTN API key"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setShow(s => ({ ...s, mtnApiKey: !s.mtnApiKey }))} aria-label="Toggle MTN API visibility">
                        {show.mtnApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Telecel API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={show.telecelApiKey ? "text" : "password"}
                        value={form.telecelApiKey}
                        onChange={(e) => setForm({ ...form, telecelApiKey: e.target.value })}
                        placeholder="Telecel API key"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setShow(s => ({ ...s, telecelApiKey: !s.telecelApiKey }))} aria-label="Toggle Telecel API visibility">
                        {show.telecelApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>AirtelTigo - AT Bigtime Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={show.airteltigo_at_bigtime ? "text" : "password"}
                        value={form.airteltigo_at_bigtime}
                        onChange={(e) => setForm({ ...form, airteltigo_at_bigtime: e.target.value })}
                        placeholder="AT Bigtime key"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setShow(s => ({ ...s, airteltigo_at_bigtime: !s.airteltigo_at_bigtime }))} aria-label="Toggle AT Bigtime visibility">
                        {show.airteltigo_at_bigtime ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>AirtelTigo - AT iShare Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type={show.airteltigo_at_ishare ? "text" : "password"}
                        value={form.airteltigo_at_ishare}
                        onChange={(e) => setForm({ ...form, airteltigo_at_ishare: e.target.value })}
                        placeholder="AT iShare key"
                        className="flex-1"
                      />
                      <Button variant="ghost" size="icon" onClick={() => setShow(s => ({ ...s, airteltigo_at_ishare: !s.airteltigo_at_ishare }))} aria-label="Toggle AT iShare visibility">
                        {show.airteltigo_at_ishare ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label>Paystack Secret Key</Label>
                    <Input value={form.paystackSecret} onChange={(e) => setForm({ ...form, paystackSecret: e.target.value })} placeholder="sk_live_..." />
                  </div>
                  <div>
                    <Label>Paystack Public Key</Label>
                    <Input value={form.paystackPublic} onChange={(e) => setForm({ ...form, paystackPublic: e.target.value })} placeholder="pk_live_..." />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>{isSaving ? "Saving..." : "Save Configuration"}</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
