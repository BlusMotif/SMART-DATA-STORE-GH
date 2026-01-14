import 
  { title: "Settings", href: "/agent/settings", icon: Settings },
  { title: "Support Chat", href: "/agent/support", icon: MessageCircle },
];

export function AgentSidebarV2({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user } = useAuth();
  const [showApiModal, setShowApiModal] = useState(false);

  // Get user rank
  const { data: rankData } = useQuery({
    queryKey: ["user-rank"],
    queryFn: () => apiRequest("/api/user/rank"),
    enabled: !!user,
  });

  const { data: profileData, error } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/profile"],
  });

  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/admin/unread-count"],
    enabled: user?.role === 'admin',
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/support/admin/unread-count");
        const data = await res.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds instead of 5
  });

  const agent = profileData?.agent;

  if (error) {
    return (
      <div className="flex h-full w-64 flex-col border-r bg-background relative">
        <div className={`flex h-16 items-center justify-center border-b px-6 ${onClose ? 'pr-4' : ''}`}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </div>

        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {sidebarNavItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/agent/dashboard" && location.startsWith(item.href));
              const isSupport = item.href === "/agent/support";
              const isApiIntegration = item.href === "/dashboard/api-integrations";

              if (isApiIntegration) {
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-normal relative",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => {
                      setShowApiModal(true);
                      onClose && onClose();
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                  </Button>
                );
              }

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 font-normal relative",
                      isActive && "bg-primary/10 text-primary font-medium"
                    )}
                    onClick={() => onClose && onClose()}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isSupport && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="border-t p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => { onClose && onClose(); logout(); }}
            disabled={isLoggingOut}
          >
            <LogOut className="h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Log out"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background relative">
      <div className={`flex h-16 items-center justify-center border-b px-6 ${onClose ? 'pr-4' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          {user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>

      {agent && (
        <div className="border-b p-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">Profit Balance</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-agent-profit-balance">{formatCurrency(agent.profitBalance)}</p>
            <p className="text-xs text-muted-foreground mt-2">Wallet Balance: {formatCurrency(agent.walletBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Profit: {formatCurrency(agent.totalProfit)}</p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {sidebarNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/agent/dashboard" && location.startsWith(item.href));
            const isSupport = item.href === "/agent/support";
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 font-normal relative",
                    isActive && "bg-primary/10 text-primary font-medium"
                  )}
                  data-testid={`link-agent-${item.title.toLowerCase().replace(/ /g, "-")}`}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isSupport && unreadCount > 0 && user?.role === 'admin' && (
                    <Badge variant="destructive" className="ml-auto">{unreadCount}</Badge>
                  )}
                </Button>
              </Link>
            );
          })}

          {agent && (
            <a href={`/store/agent/${agent.storefrontSlug}`} target="_blank" rel="noopener noreferrer" className="mt-2">
              <Button variant="outline" className="w-full justify-start gap-3" data-testid="link-view-storefront" onClick={() => onClose && onClose()}>
                <ExternalLink className="h-4 w-4" />
                View Public Store
              </Button>
            </a>
          )}
        </nav>
      </ScrollArea>

      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => { onClose && onClose(); logout(); }}
          disabled={isLoggingOut}
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>

      <ApiIntegrationsModal open={showApiModal} onOpenChange={setShowApiModal} />
    </div>
  );
}
