import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProject, useSaveFlow, useFlow } from '@/lib/api/hooks';
import { useProjectStore } from '@/store/project.store';
import { useUiStore } from '@/store/ui.store';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Canvas } from '@/features/canvas/Canvas';
import { InspectorPanel } from '@/features/canvas/InspectorPanel';
import { EntityBuilder } from '@/features/entities/EntityBuilder';
import { RelationBuilder } from '@/features/entities/RelationBuilder';
import { EndpointBuilder } from '@/features/endpoints/EndpointBuilder';
import { ExportModal } from '@/features/projects/ExportModal';
import { Playground } from '@/features/playground/Playground';
import { useAutoSave } from '@/lib/hooks/useAutoSave';
import type { EntityDefinition, EndpointDefinition, ProjectMetadata } from '@vab/types';
import type { Node, Edge } from '@xyflow/react';

export function EditorPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [showPlayground, setShowPlayground] = useState(false);
  const [editingEntity, setEditingEntity] = useState<EntityDefinition | null>(null);
  const [editingEndpoint, setEditingEndpoint] = useState<EndpointDefinition | null>(null);

  const { setProject, metadata, isDirty, markSaved, upsertFlow } = useProjectStore();
  const { activeModal, closeModal, selectedEndpointId, openModal } = useUiStore();

  // Load project
  const { data: project, isLoading, isError } = useProject(projectId ?? '');

  // Load flow for selected endpoint
  const { data: flow } = useFlow(projectId ?? '', selectedEndpointId ?? '');

  // Auto-save mutation
  const autoSaveMutation = useAutoSave(projectId ?? '', metadata, markSaved, isDirty);

  // Seed store when project loads
  useEffect(() => {
    if (project) {
      setProject(project.id, project.name, project.metadata as ProjectMetadata);
    }
  }, [project?.id]);

  // Navigation error
  useEffect(() => {
    if (isError) {
      toast.error('Project not found');
      navigate('/dashboard');
    }
  }, [isError, navigate]);

  const handleFlowChange = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      if (!selectedEndpointId || !flow) return;
      upsertFlow({
        id: flow.id,
        endpointId: selectedEndpointId,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type as any,
          position: n.position,
          config: (n.data?.config ?? {}) as any,
          label: n.data?.label as string,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle ?? undefined,
          targetHandle: e.targetHandle ?? undefined,
        })),
      });
    },
    [selectedEndpointId, flow, upsertFlow],
  );

  const handleEditEntity = (entity: EntityDefinition) => {
    setEditingEntity(entity);
    openModal('new-entity');
  };

  const handleEditEndpoint = (endpoint: EndpointDefinition) => {
    setEditingEndpoint(endpoint);
    openModal('new-endpoint');
  };

  const handleCloseEntityModal = () => {
    setEditingEntity(null);
    closeModal();
  };

  const handleCloseEndpointModal = () => {
    setEditingEndpoint(null);
    closeModal();
  };

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="h-screen flex flex-col bg-bg overflow-hidden">
      <Topbar projectId={projectId} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          projectId={projectId ?? ''}
          onEditEntity={handleEditEntity}
          onEditEndpoint={handleEditEndpoint}
        />

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden">
          {selectedEndpointId ? (
            <Canvas flow={flow ?? null} onFlowChange={handleFlowChange} />
          ) : (
            <CanvasEmptyState />
          )}

          {/* Playground toggle button */}
          <button
            onClick={() => setShowPlayground((v) => !v)}
            className="absolute bottom-4 right-4 btn btn-ghost text-xs shadow-lg z-10"
          >
            {showPlayground ? '✕ Close' : '▶ Playground'}
          </button>

          {/* Playground panel */}
          {showPlayground && (
            <div className="absolute bottom-0 left-0 right-0 h-72 border-t border-border bg-bg-2 z-20">
              <Playground projectId={projectId ?? ''} />
            </div>
          )}
        </div>

        <InspectorPanel />
      </div>

      {/* Modals */}
      {activeModal === 'new-entity' && (
        <EntityBuilder
          projectId={projectId ?? ''}
          onClose={handleCloseEntityModal}
          editEntity={editingEntity ?? undefined}
        />
      )}
      {activeModal === 'new-endpoint' && (
        <EndpointBuilder
          projectId={projectId ?? ''}
          onClose={handleCloseEndpointModal}
          editEndpoint={editingEndpoint ?? undefined}
        />
      )}
      {activeModal === 'new-relation' && (
        <RelationBuilder projectId={projectId ?? ''} onClose={closeModal} />
      )}
      {activeModal === 'export' && <ExportModal projectId={projectId ?? ''} onClose={closeModal} />}
    </div>
  );
}

function CanvasEmptyState() {
  const { openModal } = useUiStore();
  const { metadata } = useProjectStore();

  return (
    <div className="w-full h-full flex items-center justify-center">
      {/* Dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-bg-2 border border-border flex items-center justify-center text-xl">
          ◻
        </div>
        <div>
          <h3 className="font-semibold">
            {metadata.endpoints.length === 0 ? 'No endpoints yet' : 'Select an endpoint'}
          </h3>
          <p className="text-sm text-text-muted mt-1">
            {metadata.endpoints.length === 0
              ? 'Create your first endpoint to start building the flow'
              : 'Click an endpoint in the sidebar to edit its flow'}
          </p>
        </div>
        {metadata.endpoints.length === 0 && (
          <button onClick={() => openModal('new-endpoint')} className="btn btn-primary px-4 py-2">
            + Create endpoint
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="h-screen bg-bg flex items-center justify-center">
      <div className="flex items-center gap-3 text-text-muted">
        <div className="w-4 h-4 rounded-full bg-accent animate-pulse" />
        <span className="text-sm">Loading project…</span>
      </div>
    </div>
  );
}
