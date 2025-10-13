"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import * as d3 from "d3";
import "./tick.css";
import {
  getAllIndicators,
  getDataNodes,
  Indicator,
  DataNode,
} from "../services/dataWarehouseApi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit, FiTrash2, FiPlus, FiEye } from "react-icons/fi";
import IndicatorChartss from "../components/indicator/IndicatorChartss";
import IndicatorOutputManager from "../components/indicator/IndicatorOutputManager";
import EnhancedIndicatorForm from "../components/indicator/EnhancedIndicatorForm";
import NodeChart from "../components/indicator/NodeChart";
import ConfirmationToastComponent from "../components/ConfirmationToast";
import { ToastContainer } from "react-toastify";

// --- SectorFilter ---
// --- SectorFilter (updated) ---
const SectorFilter = ({
  onSectorChange,
  onSubcategoryChange,
  selectedSector,
  selectedSubcategory,
}: {
  onSectorChange: (sector: string | null) => void;
  onSubcategoryChange: (subcategory: string | null) => void;
  selectedSector: string | null;
  selectedSubcategory: string | null;
}) => {
  type Option = { id: string; name: string };

  const [sectors, setSectors] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [loadingSectors, setLoadingSectors] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Normalize any list-like payload to [{id, name}] as strings
  const normalizeList = (raw: any): Option[] => {
    const list =
      Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.results)
        ? raw.results
        : [];

    return list.map((item: any, idx: number) => {
      const id =
        item?.id ??
        item?._id ??
        item?.value ??
        item?.code ??
        String(idx + 1);
      const name = item?.name ?? item?.label ?? item?.title ?? `Item ${idx + 1}`;
      return { id: String(id), name: String(name) };
    });
  };

  useEffect(() => {
    const fetchSectors = async () => {
      setLoadingSectors(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
        // Even if !ok, try to parse to surface server error message gracefully.
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.message || "Failed to fetch categories");
        setSectors(normalizeList(json));
      } catch {
        setSectors([]); // fallback to empty array guarantees .map works
      } finally {
        setLoadingSectors(false);
      }
    };
    fetchSectors();
  }, []);

  useEffect(() => {
    // Reset subcategory selection whenever sector changes
    onSubcategoryChange(null);

    if (selectedSector) {
      const fetchSubcategories = async () => {
        setLoadingSubs(true);
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedSector}/subcategories`
          );
          const json = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(json?.message || "Failed to fetch subcategories");
          setSubcategories(normalizeList(json));
        } catch {
          setSubcategories([]);
        } finally {
          setLoadingSubs(false);
        }
      };
      fetchSubcategories();
    } else {
      setSubcategories([]);
    }
  }, [selectedSector, onSubcategoryChange]);

  // If selectedSubcategory no longer exists in options, clear it
  useEffect(() => {
    if (
      selectedSubcategory &&
      !subcategories.some((s) => s.id === selectedSubcategory)
    ) {
      onSubcategoryChange(null);
    }
  }, [subcategories, selectedSubcategory, onSubcategoryChange]);

  return (
    <div className="flex flex-wrap gap-4">
      <select
        className="border rounded px-3 py-2 text-gray-700"
        value={selectedSector ?? ""}
        onChange={(e) => onSectorChange(e.target.value || null)}
        disabled={loadingSectors}
        aria-label="Select Sector"
      >
        <option value="">{loadingSectors ? "Loading sectors..." : "Select Sector"}</option>
        {sectors.map((sector) => (
          <option key={sector.id} value={sector.id}>
            {sector.name}
          </option>
        ))}
      </select>

      <select
        className="border rounded px-3 py-2 text-gray-700"
        value={selectedSubcategory ?? ""}
        onChange={(e) => onSubcategoryChange(e.target.value || null)}
        disabled={loadingSubs || subcategories.length === 0 || !selectedSector}
        aria-label="Select Subcategory"
      >
        <option value="">
          {loadingSubs ? "Loading subcategories..." : "Select Subcategory"}
        </option>
        {subcategories.map((subcategory) => (
          <option key={subcategory.id} value={subcategory.id}>
            {subcategory.name}
          </option>
        ))}
      </select>
    </div>
  );
};

// --- Placeholder Dropdown ---
const PlaceholderDropdown = () => {
  const [selectedValue, setSelectedValue] = useState("dropdown");
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedValue(event.target.value);
  };
  return (
    <div className="relative inline-block text-left">
      <select
        value={selectedValue}
        onChange={handleSelectChange}
        className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-2 py-1 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-blue-500"
        aria-label="Select item"
      >
        <option value="dropdown">Dropdown</option>
        <option value="item1">Item 1</option>
        <option value="item2">Item 2</option>
        <option value="item3">Item 3</option>
      </select>
    </div>
  );
};

// --- D3 IndicatorChart Component ---
interface D3ChartDataPoint {
  date: Date;
  value: number;
}

interface IndicatorChartProps {
  /** line: [{date:"YYYY-MM-DD", value}]
   *  bar/pie (categorical): [{label, value}]
   */
  data: Array<{ date?: string | Date; label?: string; value: number }>;
  type: "line" | "bar" | "pie";
  height?: number;
  width?: string;
}


const IndicatorChart = ({
  data,
  type,
  height: propHeight = 300,
}: IndicatorChartProps) => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = chartRef.current;
    if (!host) return;
    d3.select(host).selectAll("*").remove();
    if (!data || data.length === 0) return;

    const margin = { top: 24, right: 24, bottom: 48, left: 56 };
    const containerWidth = host.clientWidth || 480;
    const containerHeight = propHeight || host.clientHeight || 300;
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // helpers
    const categorical = Array.isArray(data) && !!data[0]?.label;
    const palette = d3.scaleOrdinal<string, string>([
      "#f87171", // rose-400
      "#60a5fa", // blue-400
      "#86efac", // green-300
      "#fbbf24", // amber-400
      "#c084fc", // violet-400
      "#34d399", // emerald-400
    ]);

    // ==== PIE (categorical: {label, value}) ====
    if (type === "pie" && categorical) {
      const svg = d3
        .select(host)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);

      const g = svg
        .append("g")
        .attr(
          "transform",
          `translate(${margin.left + width / 2},${margin.top + height / 2})`
        );

      const radius = Math.min(width, height) / 2;
      const pie = d3
        .pie<any>()
        .sort(null)
        .value((d: any) => d.value);
      const arcs = pie(data);
      const arc = d3.arc<d3.PieArcDatum<any>>().outerRadius(radius).innerRadius(0);
      const arcLabel = d3.arc<d3.PieArcDatum<any>>().outerRadius(radius * 0.7).innerRadius(radius * 0.7);

      const total = d3.sum(data, (d: any) => d.value) || 1;

      g.selectAll("path")
        .data(arcs)
        .enter()
        .append("path")
        .attr("d", arc)
        .attr("fill", (d, i) => palette(d.data.label ?? String(i)))
        .attr("stroke", "#fff")
        .attr("stroke-width", 2);

      // percentage labels
      g.selectAll("text.perc")
        .data(arcs)
        .enter()
        .append("text")
        .attr("class", "perc")
        .attr("transform", (d) => `translate(${arcLabel.centroid(d)})`)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .style("font-size", "12px")
        .style("fill", "#111827")
        .text((d) => `${((d.data.value / total) * 100).toFixed(1)}%`);

      // simple legend under the chart
      const legend = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${containerHeight - 20})`);
      const items = legend
        .selectAll("g.leg")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "leg")
        .attr("transform", (_d, i) => `translate(${i * 160},0)`);

      items
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 2)
        .attr("fill", (d, i) => palette(d.label ?? String(i)));

      items
        .append("text")
        .attr("x", 16)
        .attr("y", 10)
        .style("font-size", "12px")
        .text((d) => d.label ?? "");
    }

    // ==== BAR ====
    else if (type === "bar") {
      // A) categorical bar: {label, value}
      if (categorical) {
        const svg = d3
          .select(host)
          .append("svg")
          .attr("width", containerWidth)
          .attr("height", containerHeight);
        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleBand<string>()
          .domain(data.map((d: any) => d.label))
          .range([0, width])
          .padding(0.2);

        const yMax = d3.max(data, (d: any) => d.value) || 1;
        const y = d3.scaleLinear().domain([0, yMax * 1.1]).nice().range([height, 0]);

        // gridlines
        g.append("g")
          .attr("class", "grid")
          .call(
            d3
              .axisLeft(y)
              .ticks(5)
              .tickSize(-width)
              .tickFormat(() => "")
          )
          .selectAll("line")
          .attr("stroke", "#e5e7eb")
          .attr("stroke-dasharray", "4,4");

        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x))
          .selectAll("text")
          .attr("transform", "rotate(-25)")
          .style("text-anchor", "end");

        g.append("g").call(d3.axisLeft(y).ticks(5));

        g.selectAll("rect.bar")
          .data(data)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d: any) => x(d.label)!)
          .attr("y", (d: any) => y(d.value))
          .attr("width", x.bandwidth())
          .attr("height", (d: any) => height - y(d.value))
          .attr("rx", 4)
          .attr("fill", (d, i) => palette(d.label ?? String(i)));

        // value labels
        g.selectAll("text.val")
          .data(data)
          .enter()
          .append("text")
          .attr("class", "val")
          .attr("x", (d: any) => (x(d.label)! + x.bandwidth() / 2))
          .attr("y", (d: any) => y(d.value) - 6)
          .attr("text-anchor", "middle")
          .style("font-size", "12px")
          .style("fill", "#111827")
          .text((d: any) => d.value);
      }
      // B) time-series bar: {date, value}
      else if (data[0]?.date) {
        const parseDate = d3.timeParse("%Y-%m-%d");
        const processed = data
          .map((d: any) => ({
            date: typeof d.date === "string" ? parseDate(d.date) : d.date,
            value: d.value,
          }))
          .filter((d) => d.date);

        const svg = d3
          .select(host)
          .append("svg")
          .attr("width", containerWidth)
          .attr("height", containerHeight);
        const g = svg
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        const x = d3
          .scaleBand<Date>()
          .domain(processed.map((d) => d.date as Date))
          .range([0, width])
          .padding(0.1);
        const yMax = d3.max(processed, (d) => d.value) || 1;
        const y = d3.scaleLinear().domain([0, yMax * 1.1]).nice().range([height, 0]);

        g.append("g")
          .attr("transform", `translate(0,${height})`)
          .call(
            d3.axisBottom(
              d3.scaleTime().domain(d3.extent(processed, (d) => d.date) as [Date, Date]).range([0, width])
            )
          );

        g.append("g").call(d3.axisLeft(y).ticks(5));

        g.selectAll("rect.bar")
          .data(processed)
          .enter()
          .append("rect")
          .attr("class", "bar")
          .attr("x", (d) => x(d.date as Date)!)
          .attr("y", (d) => y(d.value))
          .attr("width", x.bandwidth())
          .attr("height", (d) => height - y(d.value))
          .attr("fill", "#3b82f6");
      }
    }

    // ==== LINE (time-series) ====
    else if (type === "line" && data[0]?.date) {
      const parseDate = d3.timeParse("%Y-%m-%d");
      const processed = data
        .map((d: any) => ({
          date: typeof d.date === "string" ? parseDate(d.date) : d.date,
          value: d.value,
        }))
        .filter((d) => d.date);

      const svg = d3
        .select(host)
        .append("svg")
        .attr("width", containerWidth)
        .attr("height", containerHeight);
      const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      const x = d3
        .scaleTime()
        .domain(d3.extent(processed, (d) => d.date) as [Date, Date])
        .range([0, width]);
      const yMax = d3.max(processed, (d) => d.value) || 1;
      const y = d3.scaleLinear().domain([0, yMax * 1.1]).nice().range([height, 0]);

      // gridlines
      g.append("g")
        .call(
          d3.axisLeft(y).ticks(5).tickSize(-width).tickFormat(() => "")
        )
        .selectAll("line")
        .attr("stroke", "#e5e7eb")
        .attr("stroke-dasharray", "4,4");

      g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x));
      g.append("g").call(d3.axisLeft(y).ticks(5));

      const line = d3.line<any>().x((d) => x(d.date)).y((d) => y(d.value));
      g.append("path")
        .datum(processed)
        .attr("fill", "none")
        .attr("stroke", "#3b82f6")
        .attr("stroke-width", 2)
        .attr("d", line);

      g.selectAll("circle")
        .data(processed)
        .enter()
        .append("circle")
        .attr("cx", (d) => x(d.date))
        .attr("cy", (d) => y(d.value))
        .attr("r", 3.5)
        .attr("fill", "#3b82f6");
    }

    return () => {
      d3.select(host).selectAll("*").remove();
    };
  }, [data, type, propHeight]);

  return (
    <div
      ref={chartRef}
      className="w-full h-full"
      style={{ height: propHeight ? `${propHeight}px` : undefined }}
    />
  );
};


// --- Top5ResistantList ---
interface TopResistantItem {
  label: string;
  value: number;
  subtitle?: string;
  max?: number;
}

const Top5ResistantList = ({ data }: { data: TopResistantItem[] }) => {
  if (!data || data.length === 0) {
    return <div className="text-gray-500 text-center">No data available.</div>;
  }
  const getBarColor = (percentage: number): string => {
    if (percentage < 40) return "#2ecc71";
    else if (percentage < 75) return "#f1c40f";
    else return "#e74c3c";
  };
  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage =
          item.max !== undefined && item.max > 0
            ? (item.value / item.max) * 100
            : item.value;
        const clampedPercentage = Math.max(0, Math.min(100, percentage));
        const barColor = getBarColor(clampedPercentage);

        return (
          <div key={index}>
            <div className="flex justify-between text-sm text-gray-700 mb-1">
              <span>
                {item.label}{" "}
                {item.subtitle && (
                  <span className="text-xs text-gray-500">
                    ({item.subtitle})
                  </span>
                )}
              </span>
              <span>
                {item.max !== undefined
                  ? `${item.value}/${item.max}`
                  : `${item.value.toFixed(1)}%`}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-width duration-300 ease-in-out`}
                style={{
                  backgroundColor: barColor,
                  width: `${clampedPercentage}%`,
                }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// --- NEW: Indicator Script Output Chart Viewer ---
// --- fetch helper: always return an array ---
// --- fetch helper: always return an array & adapt chart shapes ---
async function getIndicatorOutput(indicatorId: string) {
  const id = "68c4148af5492e246f93d76b";

  // ✅ build URL correctly
  const url = `${process.env.NEXT_PUBLIC_API_URL}/api/indicators/${id}/outputs`;

  console.log("Fetching indicator output:", url);

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch indicator outputs: ${res.status}`);

  const json = await res.json();

  const raw =
    (Array.isArray(json?.data?.outputs) && json.data.outputs) ||
    (Array.isArray(json?.data?.scriptOutputs) && json.data.scriptOutputs) ||
    [];

  const adapted = raw.map((o: any) => {
    if (!o?.data || Array.isArray(o.data)) return o;

    if (o.type === "pie_chart" || o.type === "bar_chart") {
      const labels = o.data.labels || o.data.categories || [];
      const values = o.data.values || [];
      const arr = labels.map((label: string, i: number) => ({
        label,
        value: Number(values[i] ?? 0),
      }));
      return { ...o, data: arr };
    }
    return o;
  });

  return adapted;
}


// --- NewIndicatorOutputViewer: safe‐guard against undefined ---
// Removed duplicate NewIndicatorOutputViewer component declaration


const NewIndicatorOutputViewer = ({ indicatorId }: { indicatorId: string }) => {
  const [loading, setLoading] = useState(true);
  const [outputs, setOutputs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const result = await getIndicatorOutput(indicatorId);
        if (!mounted) return;
        setOutputs(result);
      } catch (e: any) {
        if (!mounted) return;
        setError(e.message || "Failed to load outputs");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [indicatorId]);

  if (loading) return <div>Loading new charts…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!outputs.length) return <div>No new outputs found.</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {outputs.map((o) => (
        <div key={o.id} className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold mb-2">{o.name}</h3>

          {/* CHARTS */}
          {["line_chart", "bar_chart", "pie_chart"].includes(o.type) ? (
            <>
              <div className="mt-2" style={{ height: 200 }}>
                <IndicatorChart
                  data={o.data}
                  type={
                    o.type === "line_chart" ? "line" :
                    o.type === "bar_chart"  ? "bar"  : "pie"
                  }
                  height={200}
                />
              </div>
              {Array.isArray(o.data) && o.data[0]?.label && (
                <div className="mt-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {o.data.map((d: any, i: number) => (
                        <tr key={i}>
                          <td>{d.label}</td>
                          <td>{d.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : o.type === "numeric_value" &&
            o.data &&
            typeof o.data.value === "number" ? (
            <div className="flex flex-col items-center py-8">
              <div className="text-4xl font-bold text-blue-700">
                {o.data.value}
              </div>
              <div className="text-xs text-gray-500">{o.data.unit || ""}</div>
              {o.description && (
                <div className="mt-1 text-xs text-gray-500">{o.description}</div>
              )}
            </div>
          ) : o.type === "table" && Array.isArray(o.data) ? (
            <div className="mt-2 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    {(o.columns || Object.keys(o.data[0] || {})).map(
                      (col: any, i: number) => {
                        const label =
                          typeof col === "string" ? col : col?.label || col?.key;
                        return <th key={i} className="text-left">{label}</th>;
                      }
                    )}
                  </tr>
                </thead>
                <tbody>
                  {o.data.map((row: any, ri: number) => (
                    <tr key={ri}>
                      {(o.columns || Object.keys(row)).map((col: any, ci: number) => {
                        const key = typeof col === "string" ? col : col?.key;
                        return <td key={ci}>{row[key]}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <pre className="mt-2 text-xs bg-gray-50 p-2 border rounded overflow-auto">
              {JSON.stringify(o.data, null, 2)}
            </pre>
          )}

          {o.type !== "numeric_value" && o.description && (
            <p className="mt-1 text-xs text-gray-500">{o.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};


// --- Main DashboardOverview ---
export default function DashboardOverview() {
  const [timeRange, setTimeRange] = useState<string>("last_30_days");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [nodes, setNodes] = useState<DataNode[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [deletingNodeId, setDeletingNodeId] = useState<string | null>(null);
  const [deletingIndicatorId, setDeletingIndicatorId] = useState<string | null>(
    null
  );

  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(
    null
  );

  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [showOutputManager, setShowOutputManager] = useState(false);
  const [selectedIndicatorForOutput, setSelectedIndicatorForOutput] =
    useState<Indicator | null>(null);
  const [editingIndicator, setEditingIndicator] = useState<Indicator | null>(
    null
  );

  const [selectedIndicatorIdForNewViewer, setSelectedIndicatorIdForNewViewer] =
    useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
    fetchNodes();
    fetchIndicators();
  }, []);

  useEffect(() => {
    if (!selectedIndicatorIdForNewViewer && indicators.length) {
      setSelectedIndicatorIdForNewViewer(indicators[0].id);
    }
  }, [indicators, selectedIndicatorIdForNewViewer]);

  const fetchDashboardData = () => {
    // Static mock data for demonstration
    setData({
      summaryMetrics: [
        {
          id: "records",
          label: "TODAY'S VISITS",
          value: "1,975,224",
          subtitle: "24% higher yesterday",
          iconUrl: "/images/view.png",
          bgColor: "bg-green-500",
          topLabel: "Num. of Records Analysed",
        },
        {
          id: "facilities",
          label: "TODAY SALES",
          value: "150+",
          subtitle: "Operational",
          iconUrl: "/images/university.png",
          bgColor: "bg-red-500",
          topLabel: "Num. of facilities",
        },
        {
          id: "unique",
          label: "% UNIQUE VISITS",
          value: "54.45%",
          subtitle: "23% average duration",
          iconUrl: "/images/swab.png",
          bgColor: "bg-blue-500",
          topLabel: "Num. of Samples",
        },
        {
          id: "bounce",
          label: "BOUNCE RATE",
          value: "32.16%",
          subtitle: "65.45% on average time",
          iconUrl: "/images/petri-dish.png",
          bgColor: "bg-gray-600",
          topLabel: "Num. of Isolates",
        },
      ],
      amrTrendLineChartData1: [
        { date: "2023-01-01", value: 65 },
        { date: "2023-01-02", value: 59 },
        { date: "2023-01-03", value: 80 },
        { date: "2023-01-04", value: 81 },
        { date: "2023-01-05", value: 56 },
        { date: "2023-01-06", value: 55 },
        { date: "2023-01-07", value: 40 },
        { date: "2023-01-08", value: 45 },
        { date: "2023-01-09", value: 50 },
        { date: "2023-01-10", value: 55 },
        { date: "2023-01-11", value: 60 },
        { date: "2023-01-12", value: 65 },
        { date: "2023-01-13", value: 70 },
        { date: "2023-01-14", value: 68 },
      ],
      amrTrendLineChartData2: [
        { date: "2023-02-01", value: 20 },
        { date: "2023-02-02", value: 10 },
        { date: "2023-02-03", value: 30 },
        { date: "2023-02-04", value: 15 },
        { date: "2023-02-05", value: 40 },
        { date: "2023-02-06", value: 25 },
        { date: "2023-02-07", value: 35 },
      ],
      top5ResistantIndicatorsData: [
        { label: "Resistance 1", value: 60, subtitle: "1" },
        { label: "Resistance 2", value: 32.2, subtitle: "2" },
        { label: "Resistance 3", value: 82.2, subtitle: "5" },
        { label: "Resistance 4", value: 63, max: 100, subtitle: "7" },
        { label: "Resistance 5", value: 30, max: 50, subtitle: "9" },
      ],
      top5ResistantPieData: [
        { date: "2023-01-01", value: 10 },
        { date: "2023-01-02", value: 40 },
        { date: "2023-01-03", value: 25 },
        { date: "2023-01-04", value: 20 },
      ],
      amrTableBarChartData: [
        { date: "2006-01-01", value: 80 },
        { date: "2007-01-01", value: 150 },
        { date: "2008-01-01", value: 50 },
        { date: "2009-01-01", value: 120 },
        { date: "2010-01-01", value: 40 },
      ],
      tableColumns: [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "name", header: "NAME" },
        { accessorKey: "position", header: "POSITION" },
        { accessorKey: "salary", header: "SALARY" },
      ] as ColumnDef<any>[],
      tableData: [
        {
          id: 1,
          name: "Tiger Nixon",
          position: "System Architect",
          salary: "$320,800",
        },
        {
          id: 2,
          name: "Garrett Winters",
          position: "Accountant",
          salary: "$170,750",
        },
        {
          id: 3,
          name: "Ashton Cox",
          position: "Junior Technical Author",
          salary: "$86,000",
        },
        {
          id: 4,
          name: "Cedric Kelly",
          position: "Senior Javascript Developer",
          salary: "$433,060",
        },
        {
          id: 5,
          name: "Airi Satou",
          position: "Accountant",
          salary: "$162,700",
        },
        {
          id: 6,
          name: "Brielle Williamson",
          position: "Integration Specialist",
          salary: "$372,000",
        },
        {
          id: 7,
          name: "Herrod Chandler",
          position: "Sales Assistant",
          salary: "$137,500",
        },
        {
          id: 8,
          name: "Rhona Davidson",
          position: "Integration Specialist",
          salary: "$327,900",
        },
      ],
      ghanaHeatmapData: [
        { name: "Greater Accra", value: 85 },
        { name: "Ashanti", value: 70 },
        { name: "Central", value: 60 },
        { name: "Eastern", value: 55 },
        { name: "Volta", value: 45 },
        { name: "Western", value: 50 },
        { name: "Ahafo", value: 30 },
        { name: "Bono", value: 40 },
        { name: "Bono East", value: 35 },
        { name: "North East", value: 20 },
        { name: "Northern", value: 25 },
        { name: "Oti", value: 15 },
        { name: "Savannah", value: 18 },
        { name: "Upper East", value: 10 },
        { name: "Upper West", value: 12 },
        { name: "Western North", value: 28 },
      ],
      ghanaGeoJsonUrl: "/geo/ghana_regions_admin1.json",
    });
    setLoading(false);
  };

  const fetchNodes = async () => {
    try {
      setLoadingNodes(true);
      const nodesData = await getDataNodes();
      setNodes(nodesData);
    } catch (error) {
      toast.error("Failed to load data nodes");
    } finally {
      setLoadingNodes(false);
    }
  };

  const fetchIndicators = async () => {
    try {
      setLoadingIndicators(true);
      const indicatorsData = await getAllIndicators();
      setIndicators(indicatorsData);
    } catch (error) {
      toast.error("Failed to load indicators");
    } finally {
      setLoadingIndicators(false);
    }
  };

  const handleDeleteNode = async (nodeId: string) => {
    const performDelete = async () => {
      try {
        setDeletingNodeId(nodeId);
        setNodes((prev) => prev.filter((node) => node.id !== nodeId));
        toast.success("Node deleted successfully");
      } catch (err) {
        toast.error("Failed to delete node");
      } finally {
        setDeletingNodeId(null);
      }
    };
    toast(<ConfirmationToastComponent onConfirm={performDelete} />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: "bg-white shadow-xl rounded-lg border border-gray-300 p-0",
      style: { width: "420px" },
    });
  };

  const handleDeleteIndicator = async (indicatorId: string) => {
    const performDelete = async () => {
      try {
        setDeletingIndicatorId(indicatorId);
        setIndicators((prev) => prev.filter((ind) => ind.id !== indicatorId));
        toast.success("Indicator deleted successfully");
      } catch (err) {
        toast.error("Failed to delete indicator");
      } finally {
        setDeletingIndicatorId(null);
      }
    };
    toast(<ConfirmationToastComponent onConfirm={performDelete} />, {
      position: "top-center",
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      closeButton: false,
      className: "bg-white shadow-xl rounded-lg border border-gray-300 p-0",
      style: { width: "420px" },
    });
  };

  const handleEditIndicator = (indicator: Indicator) => {
    setEditingIndicator(indicator);
    setShowIndicatorModal(true);
  };

  const handleViewOutput = (indicator: Indicator) => {
    setSelectedIndicatorForOutput(indicator);
    setShowOutputManager(true);
  };

  const handleIndicatorSubmit = async (indicatorData: any) => {
    try {
      await fetchIndicators();
      setShowIndicatorModal(false);
      setEditingIndicator(null);
      toast.success(
        editingIndicator
          ? "Indicator updated successfully"
          : "Indicator created successfully"
      );
    } catch (error) {
      toast.error("Failed to save indicator");
    }
  };

  const chartHeight = 256;

  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        <div className="flex flex-wrap space-x-4 items-center">
          <Link href="/sectors" passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-200 whitespace-nowrap">
              Sub Categories
            </button>
          </Link>
          <Link href="/sectors" passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition duration-200 whitespace-nowrap">
              Sectors
            </button>
          </Link>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-2 text-gray-700 text-sm"
          >
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_quarter">Last Quarter</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">Filters</h2>
        <SectorFilter
          onSectorChange={setSelectedSector}
          onSubcategoryChange={setSelectedSubcategory}
          selectedSector={selectedSector}
          selectedSubcategory={selectedSubcategory}
        />
      </div>

      {/* Node Management Section */}
      {/* <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Data Nodes</h2>
          <Link href="/data-warehouse/warehouse/new-node" passHref>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm flex items-center gap-2">
              <FiPlus size={16} />
              Create Node
            </button>
          </Link>
        </div>
        {loadingNodes ? (
          <div className="p-6 text-gray-500">Loading nodes...</div>
        ) : nodes.length === 0 ? (
          <div className="p-6 text-gray-500">No data nodes found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Node Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Variables
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {nodes.map((node) => (
                  <tr key={node.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-blue-600">
                        {node.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {node.variables?.length || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {node.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          node.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {node.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href={`/data-warehouse/warehouse/new-node?id=${node.id}`}
                          passHref
                        >
                          <button className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors">
                            <FiEdit size={12} />
                          </button>
                        </Link>
                        <button
                          className="w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          title="Delete"
                          disabled={deletingNodeId === node.id}
                          onClick={() => handleDeleteNode(node.id)}
                        >
                          <FiTrash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div> */}

      {/* Node/Indicator Analytics Charts */}
      <div className="mb-6">
        <NodeChart
          className=""
          onEditNode={(node) =>
            (window.location.href = `/data-warehouse/warehouse/new-node?id=${node.id}`)
          }
          onViewNode={(node) =>
            (window.location.href = `/data-warehouse/warehouse/new-node?id=${node.id}`)
          }
          onDeleteNode={fetchNodes}
        />
      </div>
      <div className="mb-6">
        <IndicatorChartss
          className=""
          onEditIndicator={handleEditIndicator}
          onViewOutput={handleViewOutput}
          onDeleteIndicator={fetchIndicators}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading Data...</p>
        </div>
      ) : data ? (
        <div className="space-y-6 md:space-y-8">
          {/* Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {data.summaryMetrics.map((metric: any) => (
              <div
                key={metric.id}
                className={`${
                  metric.bgColor || "bg-gray-600"
                } relative text-white p-4 rounded-lg shadow-lg flex items-center justify-between`}
              >
                <div>
                  <h3 className="text-sm md:text-base font-medium uppercase tracking-wider">
                    {metric.topLabel}
                  </h3>
                  <p className="text-2xl md:text-3xl font-bold mt-1">
                    {metric.value}
                  </p>
                  {metric.subtitle && (
                    <p className="text-xs md:text-sm opacity-90 mt-1">
                      {metric.subtitle}
                    </p>
                  )}
                </div>
                {metric.iconUrl ? (
                  <div className="text-3xl md:text-4xl">
                    <img
                      src={metric.iconUrl}
                      alt={metric.label}
                      className="w-24 h-12 md:w-32 md:h-16"
                    />
                  </div>
                ) : (
                  metric.icon && (
                    <div className="text-3xl md:text-4xl">{metric.icon}</div>
                  )
                )}
              </div>
            ))}
          </div>
          {/* Main Chart Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Line Chart 1 & Bar Chart */}
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    AMR Trend (Data 1)
                  </h2>
                  <PlaceholderDropdown />
                </div>
                <div style={{ height: `${chartHeight}px` }}>
                  {data.amrTrendLineChartData1 &&
                  data.amrTrendLineChartData1.length > 0 ? (
                    <IndicatorChart
                      data={data.amrTrendLineChartData1}
                      type="line"
                      height={chartHeight}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No chart data available.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    AMR Data (Bar)
                  </h2>
                  <PlaceholderDropdown />
                </div>
                <div style={{ height: `${chartHeight}px` }}>
                  {data.amrTableBarChartData &&
                  data.amrTableBarChartData.length > 0 ? (
                    <IndicatorChart
                      data={data.amrTableBarChartData}
                      type="bar"
                      height={chartHeight}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No chart data available.
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right: Line Chart 2 & Horizontal Bars */}
            <div className="space-y-6">
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    AMR Trend (Data 2)
                  </h2>
                  <PlaceholderDropdown />
                </div>
                <div style={{ height: `${chartHeight}px` }}>
                  {data.amrTrendLineChartData2 &&
                  data.amrTrendLineChartData2.length > 0 ? (
                    <IndicatorChart
                      data={data.amrTrendLineChartData2}
                      type="line"
                      height={chartHeight}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No chart data available.
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                    Top 5 Resistant
                  </h2>
                  <PlaceholderDropdown />
                </div>
                {data.top5ResistantIndicatorsData &&
                data.top5ResistantIndicatorsData.length > 0 ? (
                  <Top5ResistantList data={data.top5ResistantIndicatorsData} />
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    No data available.
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Bottom: Pie & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                  Top 5 Resistant
                </h2>
                <PlaceholderDropdown />
              </div>
              <div className="flex-grow flex items-center justify-center min-h-[400px]">
                {data.top5ResistantPieData?.length > 0 ? (
                  <div className="w-full h-full">
                    <IndicatorChart
                      data={data.top5ResistantPieData}
                      type="pie"
                      height={chartHeight}
                      width="100%"
                    />
                  </div>
                ) : (
                  <div className="text-gray-500 w-full text-center">
                    No chart data available.
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg flex flex-col h-full">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-4">
                Regional Distribution (Ghana)
              </h2>
              <div className="border rounded-md overflow-hidden flex-grow flex items-center justify-center min-h-[400px]">
                <img
                  src="/heatmap.png"
                  className="w-full h-auto object-contain"
                  alt="Ghana Heatmap"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow text-center text-gray-500">
          <p>Could not load dashboard data.</p>
        </div>
      )}

      {/* Modals */}
      {showIndicatorModal && (
        <EnhancedIndicatorForm
          isOpen={showIndicatorModal}
          onClose={() => {
            setShowIndicatorModal(false);
            setEditingIndicator(null);
          }}
          onSubmit={handleIndicatorSubmit}
          editData={editingIndicator}
        />
      )}
      {showOutputManager && selectedIndicatorForOutput && (
        <IndicatorOutputManager
          indicatorId={selectedIndicatorForOutput.id}
          indicatorName={selectedIndicatorForOutput.name}
          isOpen={showOutputManager}
          onClose={() => {
            setShowOutputManager(false);
            setSelectedIndicatorForOutput(null);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}