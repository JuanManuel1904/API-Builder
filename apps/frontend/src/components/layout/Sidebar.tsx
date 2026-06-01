import React from 'react';
import { useProjectStore } from '@/store/project.store';
import { useUiStore } from '@/store/ui.store';
import { METHOD_COLORS, cn } from '@/lib/utils';

const NODE_PALETTE = [
  { type: 'request', label: 'Request', color: '#818cf8', icon: '↓' },
  { type: 'auth', label: 'Auth Guard', color: '#f59e0b', icon: '🔒' },
  { type: 'validation', label: 'Validation', color: '#3b82f6', icon: '✓' },
  { type: 'db-query', label: 'DB Query', color: '#a78bfa', icon: '◉' },
  { type: 'transform', label: 'Transform', color: '#ec4899', icon: '⇄' },
  { type: 'response', label: 'Response', color: '#34d399', icon: '→' },
  { type: 'external-api', label: 'External API', color: '#fb923c', icon: '↗' },
  { type: 'condition', label: 'Condition', color: '#f472b6', icon: '⋄' },
  { type: 'cache', label: 'Cache', color: '#22d3ee', icon: '⚡' },
  { type: 'logger', label: 'Logger', color: '#94a3b8', icon: '☰' },
];

export function Sidebar() {
  const { metadata } = useProjectStore();
  const { selectEndpoint, selectedEndpointId, openModal } = useUiStore();

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/vab-node', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-[200px] flex-shrink-0 bg-bg-2 border-r border-border flex flex-col overflow-hidden">
      {/* Node palette */}
      <div className="border-b border-border py-3">
        <p className="label px-3 mb-1.5">Nodes</p>
        {NODE_PALETTE.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="flex items-center gap-2 px-3 py-[7px] cursor-grab text-xs text-text-muted hover:text-text hover:bg-bg-3 transition-colors select-none"
          >
            <div
              className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[11px] flex-shrink-0"
              style={{ background: `${node.color}18`, color: node.color }}
            >
              {node.icon}
            </div>
            {node.label}
          </div>
        ))}
      </div>

      {/* Entities list */}
      {metadata.entities.length > 0 && (
        <div className="border-b border-border py-3">
          <div className="flex items-center justify-between px-3 mb-1.5">
            <p className="label">Entities</p>
            <button
              onClick={() => openModal('new-entity')}
              className="text-text-muted hover:text-text text-xs leading-none"
            >
              +
            </button>
          </div>
          {metadata.entities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center gap-2 px-3 py-[7px] text-xs text-text-muted hover:text-text hover:bg-bg-3 transition-colors cursor-pointer"
            >
              <div className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[10px] bg-accent/10 text-accent-2 flex-shrink-0">
                ⬡
              </div>
              <span className="truncate">{entity.name}</span>
              <span className="ml-auto text-[9px] text-text-muted/60">{entity.fields.length}f</span>
            </div>
          ))}
        </div>
      )}

      {/* Endpoints list */}
      <div className="flex-1 overflow-y-auto py-3">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <p className="label">Endpoints</p>
          <button
            onClick={() => openModal('new-endpoint')}
            className="text-text-muted hover:text-text text-xs leading-none"
          >
            +
          </button>
        </div>
        {metadata.endpoints.length === 0 ? (
          <p className="text-[10px] text-text-muted px-3">No endpoints yet</p>
        ) : (
          metadata.endpoints.map((ep) => (
            <div
              key={ep.id}
              onClick={() => selectEndpoint(ep.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-[6px] text-[10px] font-mono cursor-pointer hover:bg-bg-3 transition-colors',
                selectedEndpointId === ep.id && 'bg-bg-4',
              )}
            >
              <span className={cn('badge', METHOD_COLORS[ep.method])} style={{ fontSize: 8, padding: '1px 4px' }}>
                {ep.method}
              </span>
              <span className="text-text-muted truncate">{ep.path}</span>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
