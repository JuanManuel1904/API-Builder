import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges/AnimatedEdge';
import { useUiStore } from '@/store/ui.store';
import type { FlowDefinition } from '@vab/types';

interface CanvasProps {
  flow: FlowDefinition | null;
  onFlowChange: (nodes: Node[], edges: Edge[]) => void;
}

export function Canvas({ flow, onFlowChange }: CanvasProps) {
  const { selectNode } = useUiStore();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const initialNodes: Node[] = (flow?.nodes ?? []).map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: { config: n.config, label: n.label },
  }));

  const initialEdges: Edge[] = (flow?.edges ?? []).map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'animated',
    label: e.label,
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdges = addEdge({ ...connection, type: 'animated' }, edges);
      setEdges(newEdges);
      onFlowChange(nodes, newEdges);
    },
    [edges, nodes, setEdges, onFlowChange],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/vab-node');
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 90,
        y: event.clientY - bounds.top - 40,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { config: {}, label: type },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Sync changes upward with debounce
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
    },
    [onNodesChange],
  );

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.06)" />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const colors: Record<string, string> = {
              request: '#818cf8', auth: '#f59e0b', validation: '#3b82f6',
              'db-query': '#a78bfa', transform: '#ec4899', response: '#34d399',
              'external-api': '#fb923c', condition: '#f472b6',
            };
            return colors[node.type ?? ''] ?? '#6b7280';
          }}
          maskColor="rgba(0,0,0,0.6)"
          style={{ background: '#131620', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}
        />
      </ReactFlow>
    </div>
  );
}
