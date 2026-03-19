import React, { useEffect, useState, useMemo } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';

/* ── Types ───────────────────────────────────────────────────── */
interface GraphNode { id: string; label: string; agentName?: string; brandName?: string; uniqueUsers?: number; conversationsLast30d?: number; type: 'org' | 'agent'; }
interface GraphEdge { source: string; target: string; referralCount: number; status?: string; direction: 'outbound' | 'inbound' | 'mutual'; }
interface GraphData { nodes: GraphNode[]; edges: GraphEdge[]; }
interface StatRow { fromOrg: string; toOrg: string; fromLabel: string; toLabel: string; referralCount: number; direction: string; }
interface NetworkStats { totalConnections: number; totalReferrals: number; rows: StatRow[]; }

/* ── Moai SVG (inline, matching client-dashboard MoaiNode) ─── */
const MOAI_VIEWBOX = '410 58 220 195';
const MoaiSvg: React.FC<{ size: number; hatColor?: string; dimmed?: boolean }> = ({ size, hatColor = '#6B7F72', dimmed }) => (
  <svg width={size} height={size * 1.4} viewBox={MOAI_VIEWBOX} style={{ opacity: dimmed ? 0.4 : 1, display: 'block' }}>
    <path d="M428 148 Q428 72 520 68 Q612 72 612 148 Q612 195 588 208 Q520 218 452 208 Q428 195 428 148Z" fill="#d4c4a0" stroke="#1a1a1a" strokeWidth="2.2" strokeLinejoin="round"/>
    <path d="M440 118 Q440 75 520 72 Q600 75 600 118" fill="#ddd3b5" stroke="none"/>
    <ellipse cx="520" cy="71" rx="52" ry="14" fill={hatColor} stroke={hatColor === '#c8906e' ? '#1a1a1a' : '#4a5e54'} strokeWidth="2"/>
    <ellipse cx="520" cy="63" rx="40" ry="10" fill={hatColor} stroke={hatColor === '#c8906e' ? '#1a1a1a' : '#4a5e54'} strokeWidth="1.8"/>
    <path d="M478 112 Q490 106 502 110" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M538 110 Q550 106 562 112" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M480 124 Q493 115 506 124" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M534 124 Q547 115 560 124" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M510 134 L507 152 Q520 157 533 152 L530 134" fill="#c4b48e" stroke="#1a1a1a" strokeWidth="1.7" strokeLinejoin="round"/>
    <path d="M504 154 Q511 158 520 157 Q529 158 536 154" fill="none" stroke="#1a1a1a" strokeWidth="1.6" strokeLinecap="round"/>
    <path d="M492 178 Q520 192 548 178" fill="none" stroke="#4a7a5a" strokeWidth="3" strokeLinecap="round"/>
    <path d="M428 138 Q414 144 416 160 Q418 174 430 176" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
    <path d="M612 138 Q626 144 624 160 Q622 174 610 176" fill="none" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

/* ── Hat color palette for nodes ─────────────────────────────── */
const HAT_COLORS = ['#6B7F72', '#c8906e', '#4A6C6F', '#8F7F73', '#A85951', '#5F8D72', '#8BADB0', '#B8A090'];

/* ── Layout: deterministic circular positions ────────────────── */
function computeLayout(nodes: GraphNode[], width: number, height: number) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.32;

  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return {
      ...node,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
      hatColor: HAT_COLORS[i % HAT_COLORS.length],
    };
  });
}

/* ── Main Component ──────────────────────────────────────────── */
const NetworkPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/network/graph').catch(() => null),
      apiFetch('/network/stats').catch(() => null),
    ]).then(([g, s]) => {
      setGraph(g);
      setStats(s);
    }).finally(() => setLoading(false));
  }, [apiFetch]);

  const WIDTH = 800;
  const HEIGHT = 460;
  const MOAI_SIZE = 56;

  const positioned = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return [];
    return computeLayout(graph.nodes, WIDTH, HEIGHT);
  }, [graph]);

  const nodeById = useMemo(() => {
    const map: Record<string, typeof positioned[number]> = {};
    positioned.forEach(n => { map[n.id] = n; });
    return map;
  }, [positioned]);

  // Filter edges to those connecting existing nodes
  const validEdges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.filter(e => nodeById[e.source] && nodeById[e.target]);
  }, [graph, nodeById]);

  // Edges connected to selected node
  const selectedEdges = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    validEdges.forEach((e, i) => {
      if (e.source === selectedNodeId || e.target === selectedNodeId) set.add(String(i));
    });
    return set;
  }, [selectedNodeId, validEdges]);

  if (loading) return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading network...</div>;

  const card: React.CSSProperties = {
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', overflow: 'hidden',
  };

  const hasNodes = positioned.length > 0;

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Network</h1>
        {stats && (
          <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>
            {stats.totalConnections} connection{stats.totalConnections !== 1 ? 's' : ''} · {stats.totalReferrals} referral{stats.totalReferrals !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Graph */}
      <div style={card}>
        {!hasNodes ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--color-text-subtle)', fontSize: 14 }}>
            No network connections yet
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ width: '100%', height: 'auto', background: 'var(--color-bg-primary)', cursor: 'default' }}
            onClick={() => setSelectedNodeId(null)}
          >
            {/* Connection lines */}
            {validEdges.map((edge, i) => {
              const src = nodeById[edge.source];
              const tgt = nodeById[edge.target];
              if (!src || !tgt) return null;
              const isHighlighted = selectedNodeId ? selectedEdges.has(String(i)) : true;
              const opacity = selectedNodeId ? (isHighlighted ? 0.6 : 0.08) : 0.3;
              return (
                <line
                  key={i}
                  x1={src.x} y1={src.y}
                  x2={tgt.x} y2={tgt.y}
                  stroke="var(--color-accent)"
                  strokeWidth={Math.max(1.5, Math.min(5, (edge.referralCount || 0) + 1.5))}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Referral count labels on edges */}
            {validEdges.map((edge, i) => {
              if (edge.referralCount <= 0) return null;
              const src = nodeById[edge.source];
              const tgt = nodeById[edge.target];
              if (!src || !tgt) return null;
              const isHighlighted = selectedNodeId ? selectedEdges.has(String(i)) : true;
              if (selectedNodeId && !isHighlighted) return null;
              return (
                <text
                  key={`el-${i}`}
                  x={(src.x + tgt.x) / 2}
                  y={(src.y + tgt.y) / 2 - 6}
                  textAnchor="middle"
                  fill="var(--color-text-muted)"
                  fontSize="10"
                  fontFamily="var(--font-primary)"
                >
                  {edge.referralCount} referral{edge.referralCount !== 1 ? 's' : ''}
                </text>
              );
            })}

            {/* Moai nodes via foreignObject */}
            {positioned.map((node) => {
              const isSelected = selectedNodeId === node.id;
              const isDimmed = selectedNodeId !== null && !isSelected
                && !validEdges.some(e =>
                  (e.source === selectedNodeId && e.target === node.id) ||
                  (e.target === selectedNodeId && e.source === node.id)
                );
              const foWidth = MOAI_SIZE + 40;
              const foHeight = MOAI_SIZE * 1.4 + 64;

              return (
                <foreignObject
                  key={node.id}
                  x={node.x - foWidth / 2}
                  y={node.y - (MOAI_SIZE * 1.4) / 2 - 4}
                  width={foWidth}
                  height={foHeight}
                  style={{ overflow: 'visible', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNodeId(prev => prev === node.id ? null : node.id);
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      opacity: isDimmed ? 0.25 : 1,
                      transition: 'opacity 0.2s ease',
                    }}
                  >
                    <div style={{
                      padding: 3,
                      borderRadius: 12,
                      border: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
                      transition: 'border-color 0.2s ease',
                    }}>
                      <MoaiSvg size={MOAI_SIZE} hatColor={node.hatColor} />
                    </div>
                    {/* Brand name — prominent */}
                    <div style={{
                      marginTop: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text-primary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      maxWidth: foWidth,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontFamily: 'var(--font-primary)',
                    }}>
                      {node.brandName || node.label}
                    </div>
                    {/* Agent name — secondary, only if different from brand */}
                    {node.agentName && node.agentName !== (node.brandName || node.label) && (
                      <div style={{
                        fontSize: 9,
                        color: 'var(--color-text-subtle)',
                        textAlign: 'center',
                        maxWidth: foWidth,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'var(--font-primary)',
                      }}>
                        {node.agentName}
                      </div>
                    )}
                    {/* Stats line */}
                    {(node.uniqueUsers || node.conversationsLast30d) ? (
                      <div style={{
                        marginTop: 2,
                        fontSize: 8,
                        color: 'var(--color-text-subtle)',
                        textAlign: 'center',
                        fontFamily: 'var(--font-primary)',
                        letterSpacing: '0.03em',
                      }}>
                        {node.uniqueUsers ? `${node.uniqueUsers.toLocaleString()} users` : ''}
                        {node.uniqueUsers && node.conversationsLast30d ? ' · ' : ''}
                        {node.conversationsLast30d ? `${node.conversationsLast30d.toLocaleString()} chats/30d` : ''}
                      </div>
                    ) : null}
                  </div>
                </foreignObject>
              );
            })}
          </svg>
        )}
      </div>

      {/* Connection Details Table */}
      {stats && stats.rows.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', padding: '14px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--color-border)' }}>
            Connection Details
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['From', 'To', 'Status', 'Referrals'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 20px', textAlign: i === 3 ? 'right' : 'left', fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 20px', color: 'var(--color-text-primary)' }}>{row.fromLabel || row.fromOrg}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--color-text-primary)' }}>{row.toLabel || row.toOrg}</td>
                  <td style={{ padding: '10px 20px' }}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 8,
                      fontWeight: 500,
                      background: row.direction === 'connected' ? 'var(--color-accent-muted)' : 'rgba(44,40,37,0.06)',
                      color: row.direction === 'connected' ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    }}>
                      {row.direction}
                    </span>
                  </td>
                  <td style={{ padding: '10px 20px', textAlign: 'right', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row.referralCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default NetworkPage;
