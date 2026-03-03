import React, { useEffect, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface ServiceCost { service: string; cost: number; }
interface DailyPoint { date: string; cost: number; }
interface AwsCostData { currentMonth: number; lastMonth: number; byService: ServiceCost[]; daily: DailyPoint[]; }
interface AnthropicCostData { currentMonth: number; daily: DailyPoint[]; }
interface AttributionRow { orgId: string; orgName: string; inputTokens: number; outputTokens: number; estimatedCost: number; }

const fmt$ = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const card: React.CSSProperties = {
  background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-tile)', padding: 20,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 11, color: 'var(--color-text-subtle)', marginBottom: 16,
  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
};

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

  if (loading) return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading costs…</div>;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Costs</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={card}>
          <div style={sectionLabel}>AWS — Current Month</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)' }}>{awsData ? fmt$(awsData.currentMonth) : '—'}</div>
          {awsData && (
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
              {awsData.currentMonth >= awsData.lastMonth ? '+' : ''}{fmt$(awsData.currentMonth - awsData.lastMonth)} vs last month ({fmt$(awsData.lastMonth)})
            </div>
          )}
        </div>
        <div style={card}>
          <div style={sectionLabel}>Anthropic — Current Month</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {anthropicData ? fmt$(anthropicData.currentMonth) : '—'}
          </div>
        </div>
      </div>

      {awsData?.byService && awsData.byService.length > 0 && (
        <div style={card}>
          <div style={sectionLabel}>AWS by Service</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {awsData.byService.sort((a, b) => b.cost - a.cost).map(svc => (
              <div key={svc.service} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{svc.service}</span>
                <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{fmt$(svc.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {awsData?.daily && awsData.daily.length > 0 && (
        <div style={card}>
          <div style={sectionLabel}>Daily AWS Cost (2 months)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={awsData.daily} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-subtle)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip
                contentStyle={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [fmt$(v), 'Cost']}
              />
              <Bar dataKey="cost" fill="var(--color-accent)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {attribution.length > 0 && (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          <div style={{ ...sectionLabel, padding: '16px 20px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: 0 }}>
            Anthropic Cost Attribution by Org (30d)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Org', 'Input Tokens', 'Output Tokens', 'Est. Cost'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 16px', textAlign: i === 0 ? 'left' : 'right', fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attribution.map(row => (
                <tr key={row.orgId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>{row.orgName || row.orgId}</div>
                    {row.orgName && <div style={{ fontSize: 11, color: 'var(--color-text-subtle)' }}>{row.orgId}</div>}
                  </td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{row.inputTokens.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', color: 'var(--color-text-muted)' }}>{row.outputTokens.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--color-text-primary)' }}>{fmt$(row.estimatedCost)}</td>
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
