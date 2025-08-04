'use client';

import React, { useContext, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { UserContext } from '../context/UserContext';
import { useApi } from '../hooks/useApi';
import { ErrorDisplay } from '../components/ui/ErrorDisplay';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PageTitle } from '../components/ui/PageTitle';
import type { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-2d';

const ForceGraph = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => <LoadingSpinner />,
});

type MyNode = NodeObject & { id: string; level: number };
type MyLink = LinkObject & { source: string; target: string; type: string; directional: boolean };

export const NetworkGraphPage = () => {
  const fgRef = useRef<ForceGraphMethods|undefined>(undefined);
  const { username } = useContext(UserContext);
  const { data: apiData, loading, error } = useApi(username ? `/analytic/network/${username}` : null);

  const graphData = useMemo(() => {
    if (!apiData || !apiData.name) return null;

    const nodes = new Map<string, MyNode>();
    const links: MyLink[] = [];
    const centralNodeName = apiData.name;

    nodes.set(centralNodeName, { id: centralNodeName, level: 0 });

    if (apiData.referredBy && apiData.referredBy.name) {
        const referrer = apiData.referredBy;
        if (!nodes.has(referrer.name)) {
            nodes.set(referrer.name, { id: referrer.name, level: -1 });
        }
        links.push({ source: referrer.name, target: centralNodeName, type: 'Referred', directional: true });
    }

    if (apiData.friends && Array.isArray(apiData.friends)) {
      apiData.friends.forEach((friend: { name:string; }) => {
        if (friend && friend.name && !nodes.has(friend.name)) {
          nodes.set(friend.name, { id: friend.name, level: 1 });
        }
        if (friend && friend.name) {
            links.push({ source: centralNodeName, target: friend.name, type: 'Friend', directional: true });
        }
      });
    }

    if (apiData.referred && Array.isArray(apiData.referred)) {
      apiData.referred.forEach((ref: { name: string; }) => {
        if (ref && ref.name && !nodes.has(ref.name)) {
          nodes.set(ref.name, { id: ref.name, level: 1 });
        }
        if (ref && ref.name) {
            links.push({ source: centralNodeName, target: ref.name, type: 'Referred', directional: true });
        }
      });
    }

    return { nodes: Array.from(nodes.values()), links };
  }, [apiData]);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-400);
      fgRef.current.d3Force('link')?.distance(100);
    }
  }, [graphData]);

  return (
    <div className="flex flex-col h-full">
      <PageTitle title="Network Graph" subtitle={`Visual relationship map for ${username}`} />
      <div className="flex-grow mt-4 bg-gray-900 rounded-lg relative">
        {loading && <LoadingSpinner />}
        {error && <ErrorDisplay message={error} />}
        {graphData && (
          <ForceGraph
            ref={fgRef as any}
            graphData={graphData}
            dagMode="td" 
            dagLevelDistance={100}
            backgroundColor="rgba(0,0,0,0)"
            cooldownTicks={100}
            onEngineStop={() => {
              if (fgRef.current) {
                fgRef.current.zoomToFit(400, 100);
              }
            }}
            nodeRelSize={1}
            nodeVal={() => 100}
            nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.id as string;
                const padding = 8;
                ctx.font = `5px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const boxWidth = textWidth + 2 * padding;
                const boxHeight = 14;

                ctx.fillStyle = '#1f2937';
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 0.2;
                
                ctx.fillRect((node.x || 0) - boxWidth / 2, (node.y || 0) - boxHeight / 2, boxWidth, boxHeight);
                ctx.strokeRect((node.x || 0) - boxWidth / 2, (node.y || 0) - boxHeight / 2, boxWidth, boxHeight);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#f3f4f6';
                ctx.fillText(label, node.x || 0, node.y || 0);
            }}
            linkColor={() => '#4b5563'}
            linkWidth={0.5}
            linkDirectionalArrowLength={link => ((link as MyLink).type === 'Referred' ? 3.5 : 0)}
            linkDirectionalArrowRelPos={1}
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx, globalScale) => {
                const start = link.source as NodeObject;
                const end = link.target as NodeObject;
                const label = (link as MyLink).type;
                
                if (typeof start !== 'object' || typeof end !== 'object' || start.x === undefined || start.y === undefined || end.x === undefined || end.y === undefined) {
                    return;
                }

                const midX = start.x + (end.x - start.x) / 2;
                const midY = start.y + (end.y - start.y) / 2;

                const padding = 3;
                ctx.font = `${4 / globalScale}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const boxWidth = textWidth + 2 * padding;
                const boxHeight = 6 / globalScale;

                ctx.fillStyle = 'rgba(55, 65, 81, 1)';
                ctx.fillRect(midX - boxWidth / 2, midY - boxHeight / 2, boxWidth, boxHeight);

                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#d1d5db';
                ctx.fillText(label, midX, midY);
            }}
          />
        )}
      </div>
    </div>
  );
};