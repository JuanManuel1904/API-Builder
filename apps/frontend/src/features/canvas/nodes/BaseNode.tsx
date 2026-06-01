import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { cn } from '@/lib/utils';

interface NodeField {
  label?: string;
  value: React.ReactNode;
}

interface BaseNodeProps {
  title: string;
  badge?: string;
  badgeClass?: string;
  icon: React.ReactNode;
  color: string;
  fields?: NodeField[];
  handles?: ('top' | 'bottom' | 'left' | 'right')[];
  selected?: boolean;
  children?: React.ReactNode;
}

export function BaseNode({
  title,
  badge,
  badgeClass,
  icon,
  color,
  fields = [],
  handles = ['top', 'bottom'],
  children,
}: BaseNodeProps) {
  return (
    <div className="vab-node">
      {handles.includes('top') && (
        <Handle type="target" position={Position.Top} className="!top-[-5px]" />
      )}
      {handles.includes('left') && (
        <Handle type="target" position={Position.Left} className="!left-[-5px]" />
      )}

      <div
        className="vab-node-header"
        style={{ background: `${color}12` }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] flex-shrink-0"
          style={{ background: `${color}25`, color }}
        >
          {icon}
        </div>
        <span className="text-[11px] font-semibold text-text flex-1 truncate">{title}</span>
        {badge && (
          <span
            className={cn('badge', badgeClass)}
            style={
              !badgeClass
                ? { background: `${color}18`, color, border: `1px solid ${color}30` }
                : undefined
            }
          >
            {badge}
          </span>
        )}
      </div>

      <div className="vab-node-body space-y-[3px]">
        {fields.map((f, i) => (
          <div key={i} className="vab-node-field">
            {f.label && <span className="text-text-muted">{f.label}:</span>}
            <span className="truncate max-w-[130px]">{f.value}</span>
          </div>
        ))}
        {children}
      </div>

      {handles.includes('right') && (
        <Handle type="source" position={Position.Right} className="!right-[-5px]" />
      )}
      {handles.includes('bottom') && (
        <Handle type="source" position={Position.Bottom} className="!bottom-[-5px]" />
      )}
    </div>
  );
}
