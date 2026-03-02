import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ServiceCost {
  service: string;
  cost: number;
}

interface DailyPoint {
  date: string;
  cost: number;
}

interface AwsCostData {
  currentMonth: number;
  lastMonth: number;
  byService: ServiceCost[];
  daily: DailyPoint[];
}

interface AnthropicCostData {
  currentMonth: number;
  daily: DailyPoint[];
}

interface AttributionRow {
  orgId: string;
  orgName: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
}

const fmt$ = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const CostsPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [awsData, setAwsData] = useState<AwsCostData | null>(null);
  const [anthropicData, setAnthropicData] = useState<AnthropicCostData | null>(null);
  const [attribution, setAttribution] = useState<AttributionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/costs/aws').catch(() => null),
      apiFetch('/costs/anthropic').catch(() => null),
      apiFetch('/costs/attribution').catch(() => ({ rows: [] })),
    ]).then(([aws, anthropic, attr]) => {
      setAwsData(aws);
      setAnthropicData(anthropic);
      setAttribution(attr?.rows ?? []);
    }).finally(() => setLoading(false));
  }, [apiFetch]);

  if (loading) {
    return <div className="p-6 text-gray-500 text-sm">Loading costs…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-lg font-semibold text-white">Costs</h1>

      {/* Top row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">AWS — Current Month</div>
          <div className="text-2xl font-semibold text-white">{awsData ? fmt$(awsData.currentMonth) : '—'}</div>
          {awsData && (
            <div className="text-xs text-gray-500 mt-1">
              {awsData.currentMonth >= awsData.lastMonth ? '+' : ''}
              {fmt$(awsData.currentMonth - awsData.lastMonth)} vs last month ({fmt$(awsData.lastMonth)})
            </div>
          )}
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-1">Anthropic — Current Month</div>
          <div className="text-2xl font-semibold text-white">
            {anthropicData ? fmt$(anthropicData.currentMonth) : '—'}
          </div>
        </div>
      </div>

      {/* AWS by service */}
      {awsData?.byService && awsData.byService.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wide">AWS by Service</div>
          <div className="space-y-2">
            {awsData.byService
              .sort((a, b) => b.cost - a.cost)
              .map(svc => (
                <div key={svc.service} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{svc.service}</span>
                  <span className="text-white font-medium">{fmt$(svc.cost)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Daily AWS trend */}
      {awsData?.daily && awsData.daily.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wide">Daily AWS Cost (2 months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={awsData.daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmt$(v), 'Cost']}
              />
              <Bar dataKey="cost" fill="#3b82f6" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-org attribution */}
      {attribution.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="text-xs text-gray-500 px-5 py-3 font-medium uppercase tracking-wide border-b border-white/10">
            Anthropic Cost Attribution by Org (30d)
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/10">
                <th className="text-left px-5 py-2">Org</th>
                <th className="text-right px-5 py-2">Input Tokens</th>
                <th className="text-right px-5 py-2">Output Tokens</th>
                <th className="text-right px-5 py-2">Est. Cost</th>
              </tr>
            </thead>
            <tbody>
              {attribution.map(row => (
                <tr key={row.orgId} className="border-b border-white/5">
                  <td className="px-5 py-2">
                    <div className="text-white">{row.orgName || row.orgId}</div>
                    {row.orgName && <div className="text-xs text-gray-600">{row.orgId}</div>}
                  </td>
                  <td className="px-5 py-2 text-right text-gray-300">{row.inputTokens.toLocaleString()}</td>
                  <td className="px-5 py-2 text-right text-gray-300">{row.outputTokens.toLocaleString()}</td>
                  <td className="px-5 py-2 text-right text-white font-medium">{fmt$(row.estimatedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CostsPage;
