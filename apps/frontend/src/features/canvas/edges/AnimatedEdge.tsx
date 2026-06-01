import React from 'react';
import { BaseEdge, EdgeProps, getBezierPath } from '@xyflow/react';

export function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? '#818cf8' : '#6366f1',
          strokeWidth: 1.5,
          strokeOpacity: selected ? 0.8 : 0.4,
          strokeDasharray: '6 4',
          animation: 'flowDash 1.5s linear infinite',
        }}
      />
      <style>{`
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }
      `}</style>
    </>
  );
}

export const edgeTypes = { animated: AnimatedEdge };
