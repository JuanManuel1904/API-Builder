import React from 'react';
import { useUiStore } from '@/store/ui.store';
import { useProjectStore } from '@/store/project.store';
import { cn } from '@/lib/utils';

const TABS = ['Properties', 'Validation', 'Schema'] as const;
type Tab = (typeof TABS)[number];

export function InspectorPanel() {
  const { selectedNodeId, panelTab, setPanelTab } = useUiStore();
  const { metadata, selectedEndpointId } = useUiStore() as any;

  return (
    <aside className="w-[268px] flex-shrink-0 bg-bg-2 border-l border-border flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-0.5 px-3 pt-2 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setPanelTab(tab.toLowerCase() as any)}
            className={cn(
              'text-[11px] px-2.5 py-[5px] rounded-t border-b-2 transition-colors font-medium',
              panelTab === tab.toLowerCase()
                ? 'text-text border-accent'
                : 'text-text-muted border-transparent hover:text-text',
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!selectedNodeId ? (
          <EmptyState />
        ) : (
          <NodeProperties nodeId={selectedNodeId} tab={panelTab} />
        )}
      </div>
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center text-lg">
        ◻
      </div>
      <div>
        <p className="text-xs font-medium text-text">Select a node</p>
        <p className="text-[11px] text-text-muted mt-0.5">Click any node on the canvas to configure it</p>
      </div>
    </div>
  );
}

function NodeProperties({ nodeId, tab }: { nodeId: string; tab: string }) {
  const { metadata } = useProjectStore();

  // Find node in all flows
  let foundNode: any = null;
  for (const flow of metadata.flows) {
    const n = flow.nodes.find((n) => n.id === nodeId);
    if (n) { foundNode = n; break; }
  }

  if (!foundNode) {
    return <p className="text-xs text-text-muted">Node not found in any flow</p>;
  }

  if (tab === 'schema') {
    return (
      <div>
        <p className="label mb-2">Metadata JSON</p>
        <pre className="text-[10px] font-mono text-text bg-bg-3 border border-border rounded-md p-2 overflow-x-auto whitespace-pre-wrap break-all leading-5">
          {JSON.stringify(foundNode, null, 2)}
        </pre>
      </div>
    );
  }

  if (tab === 'validation') {
    return <ValidationTab node={foundNode} metadata={metadata} />;
  }

  return <PropertiesTab node={foundNode} />;
}

function PropertiesTab({ node }: { node: any }) {
  const config = node.config ?? {};

  return (
    <div className="space-y-3">
      <div>
        <p className="label">Node Type</p>
        <div className="input py-1.5 text-accent-2">{node.type}</div>
      </div>
      <div>
        <p className="label">Config</p>
        <div className="space-y-2">
          {Object.entries(config).map(([key, val]) => (
            <div key={key} className="field-group">
              <p className="label">{key}</p>
              <input
                readOnly
                className="input"
                value={typeof val === 'object' ? JSON.stringify(val) : String(val)}
              />
            </div>
          ))}
          {Object.keys(config).length === 0 && (
            <p className="text-[11px] text-text-muted">No config — drag from sidebar to configure</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ValidationTab({ node, metadata }: { node: any; metadata: any }) {
  const config = node.config ?? {};
  const entity = config.entityId
    ? metadata.entities.find((e: any) => e.id === config.entityId)
    : null;

  if (!entity) {
    return (
      <p className="text-[11px] text-text-muted">
        {node.type === 'validation' || node.type === 'db-query'
          ? 'No entity linked — configure in Properties'
          : 'Validation not applicable for this node type'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="label">Entity: {entity.name}</p>
        <div className="space-y-1.5">
          {entity.fields.map((f: any) => (
            <div
              key={f.id}
              className="flex items-center gap-2 bg-bg-3 border border-border rounded px-2 py-1.5 text-[10px] font-mono"
            >
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-accent" />
              <span className="text-text flex-1">{f.name}</span>
              <span className="text-accent-2">{f.type}</span>
              {f.constraints?.required && (
                <span className="text-amber-400 text-[9px]">req</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
