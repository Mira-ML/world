import React, { useEffect, useRef, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import * as d3 from 'd3';

interface GraphNode { id: string; label: string; type: 'org' | 'agent'; }
interface GraphEdge { source: string; target: string; referralCount: number; direction: 'outbound' | 'inbound' | 'mutual'; }
interface GraphData { nodes: GraphNode[]; edges: GraphEdge[]; }
interface StatRow { fromOrg: string; toOrg: string; fromLabel: string; toLabel: string; referralCount: number; direction: string; }
interface NetworkStats { totalConnections: number; totalReferrals: number; rows: StatRow[]; }

const NetworkPage: React.FC = () => {
  const { apiFetch } = useWorldData();
  const svgRef = useRef<SVGSVGElement>(null);
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/network/graph').catch(() => null),
      apiFetch('/network/stats').catch(() => null),
    ]).then(([g, s]) => {
      setGraph(g);
      setStats(s);
    }).finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    if (!graph || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth || 700;
    const height = 420;

    // D3 CRASH FIX: filter out edges where source or target node doesn't exist
    const nodeIds = new Set(graph.nodes.map(n => n.id).filter(Boolean));
    const validEdges = graph.edges.filter(e => e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target));

    if (graph.nodes.length === 0) return;

    const nodes = graph.nodes.map(n => ({ ...n })) as (GraphNode & d3.SimulationNodeDatum)[];
    const edges = validEdges.map(e => ({ ...e })) as (GraphEdge & d3.SimulationLinkDatum<any>)[];

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(140))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const g = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().on('zoom', e => { g.attr('transform', e.transform.toString()); }));

    const link = g.append('g').selectAll('line').data(edges).join('line')
      .attr('stroke', 'rgba(74,108,111,0.35)')
      .attr('stroke-width', (d: any) => Math.max(1, Math.min(6, (d.referralCount || 0) / 2)));

    const edgeLabel = g.append('g').selectAll('text').data(edges).join('text')
      .attr('fill', 'rgba(44,40,37,0.4)').attr('font-size', '10px').attr('text-anchor', 'middle')
      .text((d: any) => d.referralCount > 0 ? `×${d.referralCount}` : '');

    const node = g.append('g').selectAll<SVGCircleElement, typeof nodes[number]>('circle')
      .data(nodes).join('circle')
      .attr('r', 20).attr('fill', '#FFFFFF').attr('stroke', '#4A6C6F').attr('stroke-width', 2)
      .call(
        d3.drag<SVGCircleElement, any>()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    const label = g.append('g').selectAll('text').data(nodes).join('text')
      .attr('text-anchor', 'middle').attr('dy', '0.35em')
      .attr('fill', 'var(--color-text-primary)').attr('font-size', '11px')
      .attr('font-family', 'var(--font-primary)').attr('pointer-events', 'none')
      .text((d: any) => (d.label || d.id || '').split(' ')[0].substring(0, 10));

    sim.on('tick', () => {
      link.attr('x1', (d: any) => d.source.x).attr('y1', (d: any) => d.source.y)
          .attr('x2', (d: any) => d.target.x).attr('y2', (d: any) => d.target.y);
      edgeLabel.attr('x', (d: any) => (d.source.x + d.target.x) / 2).attr('y', (d: any) => (d.source.y + d.target.y) / 2);
      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);
      label.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
    });

    return () => { sim.stop(); };
  }, [graph]);

  if (loading) return <div style={{ padding: 24, color: 'var(--color-text-muted)', fontSize: 14 }}>Loading network…</div>;

  const card: React.CSSProperties = {
    background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-tile)', overflow: 'hidden',
  };

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text-primary)' }}>Network</h1>
        {stats && (
          <div style={{ fontSize: 13, color: 'var(--color-text-subtle)' }}>
            {stats.totalConnections} connections · {stats.totalReferrals} referrals
          </div>
        )}
      </div>

      <div style={card}>
        {!graph || graph.nodes.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: 'var(--color-text-subtle)', fontSize: 14 }}>
            No network connections yet
          </div>
        ) : (
          <svg ref={svgRef} style={{ width: '100%', background: 'var(--color-bg-primary)' }} height={420} />
        )}
      </div>

      {stats && stats.rows.length > 0 && (
        <div style={card}>
          <div style={{ fontSize: 11, color: 'var(--color-text-subtle)', padding: '14px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--color-border)' }}>
            Connection Details
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['From', 'To', 'Direction', 'Referrals'].map((h, i) => (
                  <th key={i} style={{ padding: '10px 20px', textAlign: i === 3 ? 'right' : 'left', fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 20px', color: 'var(--color-text-primary)' }}>{row.fromLabel || row.fromOrg}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--color-text-primary)' }}>{row.toLabel || row.toOrg}</td>
                  <td style={{ padding: '10px 20px', color: 'var(--color-text-subtle)', fontSize: 12 }}>{row.direction}</td>
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
