import React, { useMemo, useState } from "react";
import type { HostApi } from "@deck/contracts";
import { useQuery } from "@tanstack/react-query";
import { Badge, Card, CardContent, CardTitle } from "@deck/ui";
import { useParams } from "react-router-dom";
import { createContractsApi } from "../api";

export default function ContractPage({ getHost }: { getHost: () => HostApi | null }) {
  const { contractId = "" } = useParams();
  const host = getHost();
  const [backoffActive, setBackoffActive] = useState(false);
  const api = useMemo(() => createContractsApi(getHost, setBackoffActive), [getHost]);

  const contract = useQuery({
    queryKey: ["contract", contractId],
    queryFn: ({ signal }) => api.getContract(contractId, signal),
    enabled: !!contractId && !!host?.getSession().token
  });

  if (!host?.getSession().token) {
    return <div className="text-slate-300">Go to Session and set a token.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">Contract {contractId}</h2>
        {backoffActive ? <Badge variant="warning">Backoff active</Badge> : null}
      </div>
      {contract.isLoading ? <div className="text-slate-300">Loading contract...</div> : null}
      {contract.isError ? <div className="text-rose-300">Failed to load contract.</div> : null}
      {contract.data ? (
        <Card>
          <CardContent className="space-y-2 p-5 text-sm text-slate-300">
          <CardTitle className="text-cyan-100">Terms</CardTitle>
          <div>
            <span className="text-slate-400">Faction:</span> {contract.data.data.factionSymbol}
          </div>
          <div>
            <span className="text-slate-400">Accepted:</span> {String(contract.data.data.accepted)}
          </div>
          <div>
            <span className="text-slate-400">Fulfilled:</span> {String(contract.data.data.fulfilled)}
          </div>
          <div>
            <span className="text-slate-400">Deadline:</span> {contract.data.data.terms?.deadline ?? "-"}
          </div>
          <div>
            <span className="text-slate-400">Payment:</span>{" "}
            {contract.data.data.terms?.payment?.onAccepted ?? 0} / {contract.data.data.terms?.payment?.onFulfilled ?? 0}
          </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
