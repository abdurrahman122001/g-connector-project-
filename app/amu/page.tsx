// app/data-warehouse/analytics/amu/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : "http://localhost:8000/api";

type IndicatorLite = { id: string; name: string };
type IndicatorOutput = {
  id: string;
  name: string;
  description?: string;
  type: string;
  data: any;
  isVisibleOnAMC?: boolean;
  isVisibleOnAMR?: boolean;
  isVisibleOnAMU?: boolean;
  isVisibleOnDashboard?: boolean;
};

type OutputsResponse = {
  success: boolean;
  data: {
    indicatorId: string;
    indicatorName: string;
    scriptOutputs: IndicatorOutput[];
    lastExecuted: string | null;
    executionStatus: string;
  };
};

async function getIndicators(): Promise<IndicatorLite[]> {
  const res = await fetch(`${BASE_URL}/data-warehouse/indicators`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
    cache: "no-store",
  });
  const j = await res.json();
  if (!res.ok || !j?.success) {
    throw new Error(j?.error || "Failed to load indicators");
  }
  const list = j.data?.items || j.data || [];
  return list.map((x: any) => ({ id: x.id || x._id, name: x.name }));
}

async function getOutputs(indicatorId: string): Promise<IndicatorOutput[]> {
  const res = await fetch(
    `${BASE_URL}/data-warehouse/indicators/${indicatorId}/outputs`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
      cache: "no-store",
    }
  );
  const j: OutputsResponse = await res.json();
  if (!res.ok || !j?.success) {
    throw new Error(j?.error || "Failed to load outputs");
  }
  return j.data.scriptOutputs || [];
}

export default function AMUAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<
    Array<{ indicator: string; outputs: IndicatorOutput[] }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const indicators = await getIndicators();
        const acc: Array<{ indicator: string; outputs: IndicatorOutput[] }> = [];
        for (const ind of indicators) {
          const outs = await getOutputs(ind.id);
          const filtered = outs.filter((o) => !!o.isVisibleOnAMU);
          if (filtered.length) acc.push({ indicator: ind.name, outputs: filtered });
        }
        setGroups(acc);
      } catch (e: any) {
        setError(e?.message || "Failed to load AMU analytics");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const renderOutput = (o: IndicatorOutput) => {
    if (o.type === "numeric_value") {
      const v = o?.data?.value ?? "--";
      return <div className="text-3xl font-bold text-center py-6">{v}</div>;
    }
    return (
      <div className="text-sm text-gray-700 p-4">
        <div className="font-medium mb-2">Type: {o.type}</div>
        <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
          {JSON.stringify(o.data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">AMU Analytics</h1>
        <p className="text-sm text-gray-600">
          Outputs that were flagged to show on the <strong>AMU</strong> analytics view.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center text-gray-600 py-16">
          <FiRefreshCw className="animate-spin mr-2" /> Loading AMU outputs…
        </div>
      ) : error ? (
        <div className="text-center text-red-600 py-10">{error}</div>
      ) : groups.length === 0 ? (
        <div className="text-center text-gray-600 py-10">
          No outputs are currently visible for AMU.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((g) => (
            <div key={g.indicator} className="bg-white rounded-xl shadow border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold">{g.indicator}</h3>
                <div className="text-xs text-gray-500">
                  Showing outputs flagged for AMU.
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
                {g.outputs.map((o) => (
                  <div key={o.id} className="border border-gray-200 rounded-md overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="font-semibold">{o.name}</div>
                      {o.description && (
                        <div className="text-xs text-gray-500">{o.description}</div>
                      )}
                    </div>
                    {renderOutput(o)}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
