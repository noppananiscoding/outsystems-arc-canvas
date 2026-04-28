'use client';
import { memo, useState } from 'react';
import { EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer } from 'reactflow';
import { useArchitectureStore } from '@/store/architecture-store';

interface DependencyEdgeData {
  isValid: boolean;
  violationReason?: string;
}

function DependencyEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
}: EdgeProps<DependencyEdgeData>) {
  const [hovered, setHovered] = useState(false);
  const { deleteDependency } = useArchitectureStore();

  // getBezierPath returns [path, labelX, labelY, offsetX, offsetY]
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const baseColor = data?.isValid === false ? '#EF4444' : '#10B981';
  // Brighter colour when hovered or selected
  const activeColor = data?.isValid === false ? '#FF6B6B' : '#34D399';
  const color = (hovered || selected) ? activeColor : baseColor;
  const strokeWidth = selected ? 3 : 2;
  const showDeleteBtn = hovered || selected;

  return (
    <>
      {/* Invisible wider hit-area so users can hover/click the thin line easily */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ cursor: 'pointer' }}
      />

      {/* Visible edge line */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: color, strokeWidth, transition: 'stroke 0.15s, stroke-width 0.15s' }}
        markerEnd={`url(#arrow-${data?.isValid === false ? 'invalid' : 'valid'})`}
      />

      {/* HTML delete button rendered at edge midpoint via EdgeLabelRenderer portal */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            // Centre the button exactly on the midpoint of the curve
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`transition-opacity duration-150 ${showDeleteBtn ? 'opacity-100' : 'opacity-0'}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteDependency(id);
            }}
            className="w-5 h-5 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border border-red-400 leading-none cursor-pointer"
            title="Delete dependency"
          >
            ×
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export default memo(DependencyEdge);
