import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/store/project.store';
import { useUiStore } from '@/store/ui.store';
import { useDeleteEntity, useDeleteEndpoint, useDeleteRelation } from '@/lib/api/hooks';
import { METHOD_COLORS, cn } from '@/lib/utils';
import type { EntityDefinition, EndpointDefinition } from '@vab/types';

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

interface SidebarProps {
  projectId: string;
  onEditEntity: (entity: EntityDefinition) => void;
  onEditEndpoint: (endpoint: EndpointDefinition) => void;
}

export function Sidebar({ projectId, onEditEntity, onEditEndpoint }: SidebarProps) {
  const { metadata } = useProjectStore();
  const { selectEndpoint, selectedEndpointId, openModal } = useUiStore();
  const deleteEntity = useDeleteEntity(projectId);
  const deleteEndpoint = useDeleteEndpoint(projectId);
  const deleteRelation = useDeleteRelation(projectId);

  const onDragStart = (e: React.DragEvent, nodeType: string) => {
    e.dataTransfer.setData('application/vab-node', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDeleteEntity = async (e: React.MouseEvent, entityId: string, entityName: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete entity "${entityName}"? This will also remove related flows.`))
      return;
    try {
      await deleteEntity.mutateAsync(entityId);
      toast.success(`Entity "${entityName}" deleted`);
    } catch {
      toast.error('Failed to delete entity');
    }
  };

  const handleDeleteEndpoint = async (e: React.MouseEvent, endpointId: string, label: string) => {
    e.stopPropagation();
    if (!window.confirm(`Delete endpoint "${label}"?`)) return;
    try {
      await deleteEndpoint.mutateAsync(endpointId);
      toast.success('Endpoint deleted');
    } catch {
      toast.error('Failed to delete endpoint');
    }
  };

  const handleDeleteRelation = async (e: React.MouseEvent, relationId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this relation?')) return;
    try {
      await deleteRelation.mutateAsync(relationId);
      toast.success('Relation deleted');
    } catch {
      toast.error('Failed to delete relation');
    }
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
        {metadata.entities.length === 0 ? (
          <p className="text-[10px] text-text-muted px-3">No entities yet</p>
        ) : (
          metadata.entities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center gap-1.5 px-3 py-[7px] text-xs text-text-muted hover:text-text hover:bg-bg-3 transition-colors cursor-pointer group"
            >
              <div className="w-[22px] h-[22px] rounded-[5px] flex items-center justify-center text-[10px] bg-accent/10 text-accent-2 flex-shrink-0">
                ⬡
              </div>
              <span className="truncate flex-1">{entity.name}</span>
              <span className="text-[9px] text-text-muted/60 group-hover:hidden">
                {entity.fields.length}f
              </span>
              <div className="hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEntity(entity);
                  }}
                  className="w-4 h-4 flex items-center justify-center rounded text-[9px] hover:text-accent-2 hover:bg-accent/10 transition-colors"
                  title="Edit entity"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => handleDeleteEntity(e, entity.id, entity.name)}
                  className="w-4 h-4 flex items-center justify-center rounded text-[9px] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete entity"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Relations list */}
      <div className="border-b border-border py-3">
        <div className="flex items-center justify-between px-3 mb-1.5">
          <p className="label">Relations</p>
          <button
            onClick={() => openModal('new-relation')}
            className="text-text-muted hover:text-text text-xs leading-none"
          >
            +
          </button>
        </div>
        {metadata.relations.length === 0 ? (
          <p className="text-[10px] text-text-muted px-3">No relations yet</p>
        ) : (
          metadata.relations.map((rel) => {
            const from = metadata.entities.find((e) => e.id === rel.fromEntityId);
            const to = metadata.entities.find((e) => e.id === rel.toEntityId);
            if (!from || !to) return null;
            return (
              <div
                key={rel.id}
                className="flex items-center gap-1.5 px-3 py-[6px] text-[10px] text-text-muted hover:text-text hover:bg-bg-3 transition-colors group"
              >
                <div className="flex-1 min-w-0 font-mono truncate">
                  <span className="text-accent-2">{from.name}</span>
                  <span className="opacity-50 mx-0.5">→</span>
                  <span className="text-accent-2">{to.name}</span>
                </div>
                <span className="text-[8px] opacity-50 group-hover:hidden">{rel.type}</span>
                <button
                  onClick={(e) => handleDeleteRelation(e, rel.id)}
                  className="hidden group-hover:flex w-4 h-4 items-center justify-center rounded text-[9px] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete relation"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

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
                'flex items-center gap-1 px-3 py-[6px] text-[10px] font-mono cursor-pointer hover:bg-bg-3 transition-colors group',
                selectedEndpointId === ep.id && 'bg-bg-4',
              )}
            >
              <span
                className={cn('badge flex-shrink-0', METHOD_COLORS[ep.method])}
                style={{ fontSize: 8, padding: '1px 4px' }}
              >
                {ep.method}
              </span>
              <span className="text-text-muted truncate flex-1">{ep.path}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditEndpoint(ep);
                  }}
                  className="w-4 h-4 flex items-center justify-center rounded text-[9px] hover:text-accent-2 hover:bg-accent/10 transition-colors"
                  title="Edit endpoint"
                >
                  ✎
                </button>
                <button
                  onClick={(e) => handleDeleteEndpoint(e, ep.id, `${ep.method} ${ep.path}`)}
                  className="w-4 h-4 flex items-center justify-center rounded text-[9px] hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  title="Delete endpoint"
                >
                  ✕
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
