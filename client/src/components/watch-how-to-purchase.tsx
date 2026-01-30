import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle, Video, Info, CheckCircle2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type VideoCategory = "guest" | "customer" | "agent";

export type VideoGuide = {
  id: string;
  category: VideoCategory;
  title: string;
  description: string;
  url?: string;
};

const DEFAULT_GUIDES: VideoGuide[] = [
  {
    id: "guest",
    category: "guest",
    title: "How to Use Resellers Data Hub Pro Gh",
    description: "Choose your options and see how to get started with Resellers Data Hub Pro Gh services.",
    url: "https://cdn.example.com/videos/how-to-use-dahtahome.mp4",
  },
  {
    id: "customer",
    category: "customer",
    title: "How to Purchase as Customer",
    description: "Learn how to buy data bundles, track orders, and manage your purchases.",
    url: "https://cdn.example.com/videos/how-to-purchase-as-customer.mp4",
  },
  {
    id: "agent",
    category: "agent",
    title: "How to Become an Agent",
    description: "Discover how to join our agent program, earn commissions, and grow your business.",
    url: "https://cdn.example.com/videos/how-to-become-agent.mp4",
  },
];

type WatchHowToPurchaseProps = {
  label?: string;
  description?: string;
  triggerVariant?: ButtonProps["variant"];
  triggerSize?: ButtonProps["size"];
  className?: string;
};

export function WatchHowToPurchase({
  label = "Watch How to Purchase",
  description = "Learn the quickest way to purchase bundles or become an agent.",
  triggerVariant = "outline",
  triggerSize = "default",
  className,
}: WatchHowToPurchaseProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<VideoCategory>("guest");
  const [selectedGuide, setSelectedGuide] = useState<VideoGuide | null>(null);

  // Fetch guides from API for the active category
  const { data: fetchedGuides } = useQuery<VideoGuide[]>({
    queryKey: ["/api/guides", activeCategory],
    queryFn: async () => await apiRequest("GET", `/api/guides?category=${activeCategory}`),
  });

  const guidesByCategory = useMemo(() => {
    const apiGuides = Array.isArray(fetchedGuides) ? fetchedGuides : [];
    const fallback = DEFAULT_GUIDES.filter((guide) => guide.category === activeCategory);
    return apiGuides.length > 0 ? apiGuides : fallback;
  }, [activeCategory, fetchedGuides]);

  const currentGuide = selectedGuide && selectedGuide.category === activeCategory
    ? selectedGuide
    : guidesByCategory[0] || null;

  const renderPlayer = () => {
    if (!currentGuide?.url) {
      return (
        <div className="rounded-lg border p-6 bg-muted/50 text-sm text-muted-foreground">
          Video will appear here once an admin uploads it.
        </div>
      );
    }

    const isEmbed = currentGuide.url.includes("youtube.com") || currentGuide.url.includes("youtu.be") || currentGuide.url.includes("vimeo.com");

    if (isEmbed) {
      // Convert YouTube URLs to embed format
      let embedUrl = currentGuide.url;
      
      // Handle youtube.com/watch?v=VIDEO_ID
      if (embedUrl.includes("youtube.com/watch")) {
        const videoId = new URL(embedUrl).searchParams.get("v");
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      // Handle youtube.com/shorts/VIDEO_ID
      else if (embedUrl.includes("youtube.com/shorts/")) {
        const videoId = embedUrl.split("/shorts/")[1]?.split("?")[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      // Handle youtu.be/VIDEO_ID
      else if (embedUrl.includes("youtu.be/")) {
        const videoId = embedUrl.split("youtu.be/")[1]?.split("?")[0];
        if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
      // Handle vimeo.com/VIDEO_ID
      else if (embedUrl.includes("vimeo.com/") && !embedUrl.includes("player.vimeo.com")) {
        const videoId = embedUrl.split("vimeo.com/")[1]?.split("?")[0];
        if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
      }

      return (
        <div className="rounded-lg md:rounded-none overflow-hidden border bg-black aspect-video md:aspect-auto md:h-64">
          <iframe
            src={embedUrl}
            title={currentGuide.title}
            className="w-full h-full md:h-64"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }

    return (
      <div className="rounded-lg md:rounded-none overflow-hidden border bg-black aspect-video md:aspect-auto md:h-64">
        <video className="w-full h-full md:h-64" controls poster={undefined}>
          <source src={currentGuide.url} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  return (
    <>
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={cn("bg-transparent border-2 border-primary text-primary hover:bg-transparent", className)}
        onClick={() => setOpen(true)}
      >
        <PlayCircle className="h-4 w-4 mr-2 text-primary" />
        {label}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl bg-card text-card-foreground md:rounded-none" style={{ backgroundColor: 'hsl(var(--card))', opacity: 1 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              How to Use Resellers Data Hub Pro Gh
            </DialogTitle>
            <DialogDescription>
              {description}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as VideoCategory)}>
            <TabsList className="grid grid-cols-3 w-full gap-2">
              <TabsTrigger
                value="guest"
                className="border-2 border-primary rounded-md md:rounded-none px-3 py-2 transition-colors hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
              >
                Guest
              </TabsTrigger>
              <TabsTrigger
                value="customer"
                className="border-2 border-primary rounded-md md:rounded-none px-3 py-2 transition-colors hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
              >
                Customer
              </TabsTrigger>
              <TabsTrigger
                value="agent"
                className="border-2 border-primary rounded-md md:rounded-none px-3 py-2 transition-colors hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary"
              >
                Agent
              </TabsTrigger>
            </TabsList>

            {(["guest", "customer", "agent"] as VideoCategory[]).map((category) => {
              const guides = category === activeCategory
                ? guidesByCategory
                : DEFAULT_GUIDES.filter((g) => g.category === category);
              return (
                <TabsContent key={category} value={category} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {guides.map((guide) => (
                      <Card key={guide.id} className={`h-full md:rounded-none ${currentGuide?.id === guide.id ? "border-primary" : ""}`}>
                        <CardHeader className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">{guide.category}</Badge>
                            {currentGuide?.id === guide.id && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                          <CardTitle className="text-base leading-tight">{guide.title}</CardTitle>
                          <CardDescription className="text-xs leading-snug">{guide.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            variant={currentGuide?.id === guide.id ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedGuide(guide)}
                          >
                            <PlayCircle className="h-4 w-4 mr-2" />
                            {currentGuide?.id === guide.id ? "Playing" : "Play"}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4 text-primary" />
                      {currentGuide?.title || "Select a video"}
                    </div>
                    {renderPlayer()}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
