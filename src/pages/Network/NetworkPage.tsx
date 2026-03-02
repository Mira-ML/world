import React, { useEffect, useRef, useState } from 'react';
import { useWorldData } from '../../contexts/WorldDataContext';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  label: string;
  type: 'org' | 'agent';
}

interface GraphEdge {
  source: string;
  target: string;
  referralCount: number;
  direction: 'outbound' | 'inbound' | 'mutual';
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface StatRow {
  fromOrg: string;
  toOrg: string;
  fromLabel: string;
  toLabel: string;
  referralCount: number;
  direction: string;
}

interface NetworkStats {
  totalConnections: number;
  totalReferrals: number;
  rows: StatRow[];
}

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

    const nodes = graph.nodes.map(n => ({ ...n })) as (GraphNode & d3.SimulationNodeDatum)[];
    const edges = graph.edges.map(e => ({ ...e })) as (GraphEdge & d3.SimulationLinkDatum<any>)[];

    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id((d: any) => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const g = svg.append('g');

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>().on('zoom', e => {
        g.attr('transform', e.transform.toString());
      })
    );

    // Edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', 'rgba(255,255,255,0.15)')
      .attr('stroke-width', (d: any) => Math.max(1, Math.min(6, d.referralCount / 2)));

    // Edge labels
    const edgeLabel = g.append('g')
      .selectAll('text')
      .data(edges)
      .join('text')
      .attr('fill', 'rgba(255,255,255,0.3)')
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .text((d: any) => d.referralCount > 0 ? `×${d.referralCount}` : '');

    // Nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 18)
      .attr('fill', '#1f2937')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 1.5)
      .call(
        d3.drag<SVGCircleElement, any>()
          .on('start', (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Node labels
    const label = g.append('g')
      .selectAll('text')
      .data(nodes)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', 'white')
      .attr('font-size', '11px')
      .attr('pointer-events', 'none')
      .text((d: any) => d.label.split(' ')[0].substring(0, 10));

    sim.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      edgeLabel
        .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
        .attr('y', (d: any) => (d.source.y + d.target.y) / 2);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y);

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y);
    });

    return () => sim.stop();
  }, [graph]);

  if (loading) return <div className="p-6 text-gray-500 text-sm">Loading network…</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Network</h1>
        {stats && (
          <div className="text-xs text-gray-500">
            {stats.totalConnections} connections · {stats.totalReferrals} referrals
          </div>
        )}
      </div>

      {/* D3 Graph */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {!graph || graph.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
            No network connections yet
          </div>
        ) : (
          <svg ref={svgRef} className="w-full" height={420} />
        )}
      </div>

      {/* Stats table */}
      {stats && stats.rows.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="text-xs text-gray-500 px-5 py-3 font-medium uppercase tracking-wide border-b border-white/10">
            Connection Details
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/10">
                <th className="text-left px-5 py-2">From</th>
                <th className="text-left px-5 py-2">To</th>
                <th className="text-left px-5 py-2">Direction</th>
                <th className="text-right px-5 py-2">Referrals</th>
              </tr>
            </thead>
            <tbody>
              {stats.rows.map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-5 py-2 text-gray-300">{row.fromLabel}</td>
                  <td className="px-5 py-2 text-gray-300">{row.toLabel}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">{row.direction}</td>
                  <td className="px-5 py-2 text-right text-white">{row.referralCount}</td>
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
