import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { WalletTopupSuccessView } from "./WalletTopupSuccessView";

export function WalletTopupSuccessContainer() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(useSearch());
  const reference = searchParams.get("reference");

  const { agent, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [attempts, setAttempts] = useState(0);

  const query = useQuery({
    queryKey: reference
      ? ["wallet-topup-verify", reference]
      : ["wallet-topup-missing-ref"],
    queryFn: () =>
      apiRequest(`/api/wallet/topup/verify/${reference}`, {
        disableAutoLogout: true,
      }),
    enabled: Boolean(reference) && !authLoading && attempts < 10,
    refetchInterval: (data) => (data?.success ? false : 3000),
  });

  useEffect(() => {
    if (!query.data || query.data.success || attempts >= 10) return;
    setAttempts((a) => a + 1);
  }, [query.data]);

  useEffect(() => {
    if (query.data?.success) {
      queryClient.invalidateQueries({
        queryKey: ["/api/user/stats"],
      });
    }
  }, [query.data, queryClient]);

  return (
    <WalletTopupSuccessView
      reference={reference}
      agent={agent}
      authLoading={authLoading}
      attempts={attempts}
      query={query}
      setLocation={setLocation}
    />
  );
}