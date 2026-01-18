import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Trophy, Medal, Award } from "lucide-react";
import { formatCurrency } from "@/lib/constants";

interface TopCustomer {
  rank: number;
  customerPhone: string;
  totalPurchases: number;
  totalSpent: number;
}

export default function MainDashboard() {
  const { user } = useAuth();

  const { data: rankings } = useQuery<TopCustomer[]>({
    queryKey: ["/api/rankings/customers"],
    refetchInterval: 60000,
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  const isCurrentUser = (phone: string) => {
    return user?.phone === phone;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-16">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Page Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Top Customers Leaderboard
            </h1>
            <p className="text-muted-foreground">
              Highest spending customers ranked by total purchases
            </p>
          </div>

          {/* Rankings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Users Ranking
              </CardTitle>
              <CardDescription>Top customers by total spending</CardDescription>
            </CardHeader>
            <CardContent>
              {rankings && rankings.length > 0 ? (
                <div className="space-y-3">
                  {rankings.map((customer) => (
                    <div
                      key={customer.customerPhone}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isCurrentUser(customer.customerPhone)
                          ? "bg-primary/20 border-primary shadow-md"
                          : "bg-white hover:bg-accent/80"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                          {getRankIcon(customer.rank) || (
                            <span className="text-lg font-bold text-muted-foreground">
                              #{customer.rank}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{customer.customerPhone}</p>
                            {isCurrentUser(customer.customerPhone) && (
                              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary text-primary-foreground">
                                You
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {customer.totalPurchases} {customer.totalPurchases === 1 ? 'purchase' : 'purchases'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(customer.totalSpent)}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Trophy className="h-20 w-20 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No Rankings Available Yet</p>
                  <p className="text-sm">Start purchasing to appear on the leaderboard!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
