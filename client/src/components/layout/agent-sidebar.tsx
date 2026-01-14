export 
  
  {
    title: "Settings",
    href: "/agent/settings",
    icon: Settings,
  },
  {
    title: "Support Chat",
    href: "/agent/support",
    icon: MessageCircle,
  },
];

export function AgentSidebar({ onClose }: { onClose?: () => void } = {}) {
  const [location] = useLocation();
  const { logout, isLoggingOut, user } = useAuth();

  const { data: profileData, error } = useQuery<AgentProfileResponse>({
    queryKey: ["/api/profile"],
  });

  // Get unread message count for admin (agent acts as support)
  const { data: unreadCount = 0 } = useQuery<number>({
    queryKey: ["/api/support/admin/unread-count"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/support/admin/unread-count");
        const data = await response.json();
        return data.count || 0;
      } catch (error) {
        return 0;
      }
    },
    refetchInterval: 5000, // Refetch every 5 seconds for admins
  });

  const agent = profileData?.agent;

  // If there's an error loading the profile, show a basic sidebar
  if (error) {
    return (
      <div className="flex h-screen w-64 flex-col border-r bg-background relative">
        <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
          <img
            src={siteLogo}
            alt="Logo"
            className="h-8 w-8 rounded-lg object-contain"
          />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{APP_NAME}</span>
            <span className="text-xs text-muted-foreground">{user?.role === 'agent' ? 'Agent Portal' : user?.role === 'dealer' ? 'Dealer Portal' : user?.role === 'super_dealer' ? 'Super Dealer Portal' : 'Reseller Portal'}</span>
          </div>
        </div>

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
                    onClick={onClose}
                  >
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.title}</span>
                    {isSupport && unreadCount > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {unreadCount}
                      </Badge>
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
    <div className="flex h-screen w-64 flex-col border-r bg-background relative">
      {onClose && (
        <div className="absolute top-4 right-4 lg:hidden z-10">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      <div className={`flex h-16 items-center gap-2 border-b px-6 ${onClose ? 'pr-16' : ''}`}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
          CT
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{agent?.businessName || APP_NAME}</span>
          <span className="text-xs text-muted-foreground">{user?.role === 'agent' ? 'Agent Portal' : user?.role === 'dealer' ? 'Dealer Portal' : user?.role === 'super_dealer' ? 'Super Dealer Portal' : 'Reseller Portal'}</span>
        </div>
      </div>

      {agent && (
        <div className="border-b p-4">
          <div className="rounded-lg bg-primary/5 p-4">
            <p className="text-xs text-muted-foreground mb-1">Profit Balance</p>
            <p className="text-2xl font-bold tabular-nums" data-testid="text-agent-profit-balance">
              {formatCurrency(agent.profitBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Wallet Balance: {formatCurrency(agent.walletBalance)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total Profit: {formatCurrency(agent.totalProfit)}
            </p>
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
                  data-testid={`link-agent-${item.title.toLowerCase().replace(" ", "-")}`}
                  onClick={() => onClose && onClose()}
                >
                  <item.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{item.title}</span>
                  {isSupport && unreadCount > 0 && user?.role === 'admin' && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>
            );
          })}

          {agent && (
            <a
              href={`/store/agent/${agent.storefrontSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2"
            >
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                data-testid="link-view-storefront"
                onClick={() => onClose && onClose()}
              >
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
          onClick={() => logout()}
          disabled={isLoggingOut}
          data-testid="button-agent-logout"
        >
          <LogOut className="h-4 w-4" />
          {isLoggingOut ? "Logging out..." : "Log out"}
        </Button>
      </div>
    </div>
  );
}
