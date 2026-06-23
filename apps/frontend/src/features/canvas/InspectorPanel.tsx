// apps/frontend/src/features/canvas/InspectorPanel.tsx
import React from 'react';
import { useUiStore } from '@/store/ui.store';
import { useProjectStore } from '@/store/project.store';
import { cn } from '@/lib/utils';
import type {
  RequestNodeConfig,
  AuthNodeConfig,
  ValidationNodeConfig,
  DbQueryNodeConfig,
  ResponseNodeConfig,
  TransformNodeConfig,
  ExternalApiNodeConfig,
  CacheNodeConfig,
  ConditionNodeConfig,
  LoggerNodeConfig,
} from '@vab/types';

const TABS = ['Properties', 'Validation', 'Schema'] as const;

export function InspectorPanel() {
  const { selectedNodeId, panelTab, setPanelTab } = useUiStore();

  return (
    <aside className="w-[268px] flex-shrink-0 bg-bg-2 border-l border-border flex flex-col overflow-hidden">
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
      <div className="w-10 h-10 rounded-xl bg-bg-3 flex items-center justify-center text-lg">◻</div>
      <div>
        <p className="text-xs font-medium text-text">Select a node</p>
        <p className="text-[11px] text-text-muted mt-0.5">
          Click any node on the canvas to configure it
        </p>
      </div>
    </div>
  );
}

function NodeProperties({ nodeId, tab }: { nodeId: string; tab: string }) {
  const { metadata, updateNodeConfig } = useProjectStore();

  let foundNode: any = null;
  let foundFlowId: string | null = null;
  for (const flow of metadata.flows) {
    const n = flow.nodes.find((n) => n.id === nodeId);
    if (n) {
      foundNode = n;
      foundFlowId = flow.id;
      break;
    }
  }

  if (!foundNode || !foundFlowId) {
    return <p className="text-xs text-text-muted">Node not found in any flow.</p>;
  }

  const handleConfigChange = (patch: Record<string, any>) => {
    updateNodeConfig(foundFlowId!, nodeId, patch);
  };

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

  return <PropertiesTab node={foundNode} onChange={handleConfigChange} metadata={metadata} />;
}

// ─── Field helpers ────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="field-group">
      <p className="label">{label}</p>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <input
      className={cn('input', mono && 'font-mono text-[10px]')}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      className="input"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        onClick={() => onChange(!value)}
        className={cn(
          'w-8 h-4 rounded-full transition-colors flex-shrink-0 relative',
          value ? 'bg-accent' : 'bg-bg-3 border border-border',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform',
            value ? 'translate-x-4' : 'translate-x-0.5',
          )}
        />
      </div>
      <span className="text-[11px] text-text-muted">{label}</span>
    </label>
  );
}

function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      className="input font-mono text-[10px] resize-y leading-5"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

// Key-value editor for headers / maps
function KeyValueEditor({
  value,
  onChange,
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
}: {
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}) {
  const entries = Object.entries(value ?? {});

  const updateEntry = (index: number, newKey: string, newVal: string) => {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      if (i === index) next[newKey] = newVal;
      else next[k] = v;
    });
    onChange(next);
  };

  const removeEntry = (index: number) => {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      if (i !== index) next[k] = v;
    });
    onChange(next);
  };

  const addEntry = () => onChange({ ...value, '': '' });

  return (
    <div className="space-y-1">
      {entries.map(([k, v], i) => (
        <div key={i} className="flex gap-1 items-center">
          <input
            className="input flex-1 py-1 text-[10px] font-mono"
            placeholder={keyPlaceholder}
            value={k}
            onChange={(e) => updateEntry(i, e.target.value, v)}
          />
          <input
            className="input flex-1 py-1 text-[10px] font-mono"
            placeholder={valuePlaceholder}
            value={v}
            onChange={(e) => updateEntry(i, k, e.target.value)}
          />
          <button
            onClick={() => removeEntry(i)}
            className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-red-400 text-[10px] flex-shrink-0"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addEntry}
        className="text-[10px] text-accent-2 hover:text-accent transition-colors mt-1"
      >
        + Add header
      </button>
    </div>
  );
}

// ─── Properties dispatcher ────────────────────────────────────

function PropertiesTab({
  node,
  onChange,
  metadata,
}: {
  node: any;
  onChange: (p: Record<string, any>) => void;
  metadata: any;
}) {
  const config = node.config ?? {};
  const nodeTypeLabel: Record<string, string> = {
    request: 'Request',
    auth: 'JWT Guard',
    validation: 'Validate DTO',
    'db-query': 'DB Query',
    response: 'Response',
    transform: 'Transform',
    'external-api': 'External API',
    cache: 'Cache',
    condition: 'Condition',
    logger: 'Logger',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 py-1.5 px-2 bg-bg-3 border border-border rounded-md">
        <span className="text-[10px] text-text-muted">Type:</span>
        <span className="text-[11px] font-semibold text-accent-2">
          {nodeTypeLabel[node.type] ?? node.type}
        </span>
      </div>
      {node.type === 'request' && <RequestForm config={config} onChange={onChange} />}
      {node.type === 'auth' && <AuthForm config={config} onChange={onChange} />}
      {node.type === 'validation' && (
        <ValidationForm config={config} onChange={onChange} metadata={metadata} />
      )}
      {node.type === 'db-query' && (
        <DbQueryForm config={config} onChange={onChange} metadata={metadata} />
      )}
      {node.type === 'response' && (
        <ResponseForm config={config} onChange={onChange} metadata={metadata} />
      )}
      {node.type === 'transform' && <TransformForm config={config} onChange={onChange} />}
      {node.type === 'external-api' && <ExternalApiForm config={config} onChange={onChange} />}
      {node.type === 'cache' && <CacheForm config={config} onChange={onChange} />}
      {node.type === 'condition' && <ConditionForm config={config} onChange={onChange} />}
      {node.type === 'logger' && <LoggerForm config={config} onChange={onChange} />}
    </div>
  );
}

// ─── Node-type forms ──────────────────────────────────────────

function RequestForm({
  config,
  onChange,
}: {
  config: RequestNodeConfig;
  onChange: (p: any) => void;
}) {
  return (
    <>
      <Field label="HTTP Method">
        <SelectInput
          value={config.method ?? 'GET'}
          onChange={(v) => onChange({ method: v })}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))}
        />
      </Field>
      <Field label="Path">
        <TextInput
          value={config.path ?? '/'}
          onChange={(v) => onChange({ path: v })}
          placeholder="/users/:id"
          mono
        />
      </Field>
      <Field label="Content-Type">
        <SelectInput
          value={config.contentType ?? 'application/json'}
          onChange={(v) => onChange({ contentType: v })}
          options={[
            { label: 'application/json', value: 'application/json' },
            { label: 'multipart/form-data', value: 'multipart/form-data' },
            {
              label: 'application/x-www-form-urlencoded',
              value: 'application/x-www-form-urlencoded',
            },
          ]}
        />
      </Field>
      <Toggle
        value={config.rateLimitEnabled ?? false}
        onChange={(v) => onChange({ rateLimitEnabled: v })}
        label="Enable rate limiting"
      />
      {config.rateLimitEnabled && (
        <>
          <Field label="Max requests">
            <NumberInput
              value={config.rateLimitMax ?? 100}
              onChange={(v) => onChange({ rateLimitMax: v })}
              min={1}
            />
          </Field>
          <Field label="Window (ms)">
            <NumberInput
              value={config.rateLimitWindow ?? 60000}
              onChange={(v) => onChange({ rateLimitWindow: v })}
              min={1000}
            />
          </Field>
        </>
      )}
    </>
  );
}

function AuthForm({ config, onChange }: { config: AuthNodeConfig; onChange: (p: any) => void }) {
  return (
    <>
      <Field label="Strategy">
        <SelectInput
          value={config.strategy ?? 'jwt'}
          onChange={(v) => onChange({ strategy: v })}
          options={[
            { label: 'JWT (Bearer)', value: 'jwt' },
            { label: 'API Key', value: 'api-key' },
            { label: 'Basic Auth', value: 'basic' },
            { label: 'OAuth2', value: 'oauth2' },
            { label: 'None', value: 'none' },
          ]}
        />
      </Field>
      <Field label="Roles (comma-separated)">
        <TextInput
          value={(config.roles ?? []).join(', ')}
          onChange={(v) =>
            onChange({
              roles: v
                .split(',')
                .map((r) => r.trim())
                .filter(Boolean),
            })
          }
          placeholder="admin, developer"
        />
      </Field>
      <Toggle
        value={config.isPublic ?? false}
        onChange={(v) => onChange({ isPublic: v })}
        label="Public route (no auth)"
      />
      <Toggle
        value={config.refreshTokenEnabled ?? false}
        onChange={(v) => onChange({ refreshTokenEnabled: v })}
        label="Enable refresh token"
      />
    </>
  );
}

function ValidationForm({
  config,
  onChange,
  metadata,
}: {
  config: ValidationNodeConfig;
  onChange: (p: any) => void;
  metadata: any;
}) {
  const entityOptions = [
    { label: '— None —', value: '' },
    ...(metadata.entities ?? []).map((e: any) => ({ label: e.name, value: e.id })),
  ];
  return (
    <>
      <Field label="Entity">
        <SelectInput
          value={config.entityId ?? ''}
          onChange={(v) => onChange({ entityId: v || undefined })}
          options={entityOptions}
        />
      </Field>
      <Field label="Mode">
        <SelectInput
          value={config.mode ?? 'strict'}
          onChange={(v) => onChange({ mode: v })}
          options={[
            { label: 'Strict', value: 'strict' },
            { label: 'Partial', value: 'partial' },
            { label: 'Passthrough', value: 'passthrough' },
          ]}
        />
      </Field>
      <Toggle
        value={config.whitelist ?? true}
        onChange={(v) => onChange({ whitelist: v })}
        label="Whitelist"
      />
      <Toggle
        value={config.forbidNonWhitelisted ?? false}
        onChange={(v) => onChange({ forbidNonWhitelisted: v })}
        label="Forbid non-whitelisted fields"
      />
      <Toggle
        value={config.transform ?? true}
        onChange={(v) => onChange({ transform: v })}
        label="Transform"
      />
    </>
  );
}

function DbQueryForm({
  config,
  onChange,
  metadata,
}: {
  config: DbQueryNodeConfig;
  onChange: (p: any) => void;
  metadata: any;
}) {
  const entityOptions = [
    { label: '— None —', value: '' },
    ...(metadata.entities ?? []).map((e: any) => ({ label: e.name, value: e.id })),
  ];
  const selectedEntity = metadata.entities?.find((e: any) => e.id === config.entityId);
  const fieldOptions: string[] = selectedEntity
    ? selectedEntity.fields.map((f: any) => f.name)
    : [];

  return (
    <>
      <Field label="Entity">
        <SelectInput
          value={config.entityId ?? ''}
          onChange={(v) => onChange({ entityId: v || undefined, selectFields: [] })}
          options={entityOptions}
        />
      </Field>
      <Field label="Operation">
        <SelectInput
          value={config.operation ?? 'findMany'}
          onChange={(v) => onChange({ operation: v })}
          options={[
            { label: 'findMany', value: 'findMany' },
            { label: 'findOne', value: 'findOne' },
            { label: 'create', value: 'create' },
            { label: 'update', value: 'update' },
            { label: 'delete', value: 'delete' },
            { label: 'upsert', value: 'upsert' },
          ]}
        />
      </Field>
      {fieldOptions.length > 0 && (
        <Field label="Select fields">
          <div className="space-y-1">
            {fieldOptions.map((fname) => {
              const selected = (config.selectFields ?? []).includes(fname);
              return (
                <label key={fname} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const prev = config.selectFields ?? [];
                      const next = selected
                        ? prev.filter((f: string) => f !== fname)
                        : [...prev, fname];
                      onChange({ selectFields: next });
                    }}
                    className="w-3 h-3 accent-indigo-500"
                  />
                  <span className="text-[11px] text-text font-mono">{fname}</span>
                </label>
              );
            })}
          </div>
        </Field>
      )}
      <Toggle
        value={config.includeRelations ?? false}
        onChange={(v) => onChange({ includeRelations: v })}
        label="Include relations"
      />
      <Toggle
        value={config.useTransaction ?? false}
        onChange={(v) => onChange({ useTransaction: v })}
        label="Use transaction"
      />
      <Toggle
        value={config.softDelete ?? false}
        onChange={(v) => onChange({ softDelete: v })}
        label="Soft delete"
      />
      <Toggle
        value={config.paginationEnabled ?? false}
        onChange={(v) => onChange({ paginationEnabled: v })}
        label="Enable pagination"
      />
      {config.paginationEnabled && (
        <>
          <Field label="Default page">
            <NumberInput
              value={(config as any).defaultPage ?? 1}
              onChange={(v) => onChange({ defaultPage: v })}
              min={1}
            />
          </Field>
          <Field label="Default limit">
            <NumberInput
              value={(config as any).defaultLimit ?? 20}
              onChange={(v) => onChange({ defaultLimit: v })}
              min={1}
              max={100}
            />
          </Field>
        </>
      )}
      <Toggle
        value={config.filterFromQuery ?? false}
        onChange={(v) => onChange({ filterFromQuery: v })}
        label="Filter from query params"
      />
    </>
  );
}

function ResponseForm({
  config,
  onChange,
  metadata,
}: {
  config: ResponseNodeConfig;
  onChange: (p: any) => void;
  metadata: any;
}) {
  const entityOptions = [
    { label: '— None —', value: '' },
    ...(metadata.entities ?? []).map((e: any) => ({ label: e.name, value: e.id })),
  ];
  return (
    <>
      <Field label="Status Code">
        <SelectInput
          value={String(config.statusCode ?? 200)}
          onChange={(v) => onChange({ statusCode: Number(v) })}
          options={[
            { label: '200 OK', value: '200' },
            { label: '201 Created', value: '201' },
            { label: '204 No Content', value: '204' },
            { label: '400 Bad Request', value: '400' },
            { label: '401 Unauthorized', value: '401' },
            { label: '403 Forbidden', value: '403' },
            { label: '404 Not Found', value: '404' },
            { label: '500 Server Error', value: '500' },
          ]}
        />
      </Field>
      <Field label="Response entity">
        <SelectInput
          value={config.entityId ?? ''}
          onChange={(v) => onChange({ entityId: v || undefined })}
          options={entityOptions}
        />
      </Field>
      <Toggle
        value={config.isArray ?? false}
        onChange={(v) => onChange({ isArray: v })}
        label="Response is array"
      />
      <Toggle
        value={config.wrapInData ?? false}
        onChange={(v) => onChange({ wrapInData: v })}
        label="Wrap in { data: … }"
      />
      <Toggle
        value={config.includeMeta ?? false}
        onChange={(v) => onChange({ includeMeta: v })}
        label="Include meta (total, page…)"
      />
      <Toggle
        value={config.compress ?? false}
        onChange={(v) => onChange({ compress: v })}
        label="Compress response"
      />
    </>
  );
}

function TransformForm({
  config,
  onChange,
}: {
  config: TransformNodeConfig;
  onChange: (p: any) => void;
}) {
  return (
    <Field label="Script (JavaScript)">
      <TextareaInput
        value={config.script ?? ''}
        onChange={(v) => onChange({ script: v })}
        placeholder={'// payload contains the previous result\nreturn payload;'}
        rows={8}
      />
    </Field>
  );
}

function ExternalApiForm({
  config,
  onChange,
}: {
  config: ExternalApiNodeConfig;
  onChange: (p: any) => void;
}) {
  return (
    <>
      <Field label="URL">
        <TextInput
          value={config.url ?? ''}
          onChange={(v) => onChange({ url: v })}
          placeholder="https://api.example.com/data"
          mono
        />
      </Field>
      <Field label="Method">
        <SelectInput
          value={config.method ?? 'GET'}
          onChange={(v) => onChange({ method: v })}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))}
        />
      </Field>
      <Field label="Headers">
        <KeyValueEditor
          value={config.headers ?? {}}
          onChange={(v) => onChange({ headers: v })}
          keyPlaceholder="Header-Name"
          valuePlaceholder="value"
        />
      </Field>
      <Field label="Timeout (ms)">
        <NumberInput
          value={config.timeout ?? 5000}
          onChange={(v) => onChange({ timeout: v })}
          min={100}
        />
      </Field>
      <Field label="Retries">
        <NumberInput
          value={config.retries ?? 0}
          onChange={(v) => onChange({ retries: v })}
          min={0}
          max={5}
        />
      </Field>
      <Field label="Body template (JSON)">
        <TextareaInput
          value={config.bodyTemplate ?? ''}
          onChange={(v) => onChange({ bodyTemplate: v })}
          placeholder={'{\n  "id": "{{payload.id}}"\n}'}
          rows={5}
        />
      </Field>
    </>
  );
}

function CacheForm({ config, onChange }: { config: CacheNodeConfig; onChange: (p: any) => void }) {
  return (
    <>
      <Field label="Strategy">
        <SelectInput
          value={config.strategy ?? 'memory'}
          onChange={(v) => onChange({ strategy: v })}
          options={[
            { label: 'Memory', value: 'memory' },
            { label: 'Redis', value: 'redis' },
          ]}
        />
      </Field>
      <Field label="TTL (seconds)">
        <NumberInput value={config.ttl ?? 60} onChange={(v) => onChange({ ttl: v })} min={1} />
      </Field>
      <Field label="Cache key">
        <TextInput
          value={config.key ?? ''}
          onChange={(v) => onChange({ key: v })}
          placeholder="users:{{params.id}}"
          mono
        />
      </Field>
    </>
  );
}

function ConditionForm({
  config,
  onChange,
}: {
  config: ConditionNodeConfig;
  onChange: (p: any) => void;
}) {
  return (
    <>
      <Field label="Expression (JS boolean)">
        <TextareaInput
          value={config.expression ?? ''}
          onChange={(v) => onChange({ expression: v })}
          placeholder="payload.role === 'admin'"
          rows={3}
        />
      </Field>
      <Field label="True branch label">
        <TextInput
          value={config.trueLabel ?? 'true'}
          onChange={(v) => onChange({ trueLabel: v })}
        />
      </Field>
      <Field label="False branch label">
        <TextInput
          value={config.falseLabel ?? 'false'}
          onChange={(v) => onChange({ falseLabel: v })}
        />
      </Field>
    </>
  );
}

function LoggerForm({
  config,
  onChange,
}: {
  config: LoggerNodeConfig;
  onChange: (p: any) => void;
}) {
  return (
    <>
      <Field label="Level">
        <SelectInput
          value={config.level ?? 'info'}
          onChange={(v) => onChange({ level: v })}
          options={[
            { label: 'debug', value: 'debug' },
            { label: 'info', value: 'info' },
            { label: 'warn', value: 'warn' },
            { label: 'error', value: 'error' },
          ]}
        />
      </Field>
      <Field label="Message">
        <TextInput
          value={config.message ?? ''}
          onChange={(v) => onChange({ message: v })}
          placeholder="Log message…"
        />
      </Field>
      <Toggle
        value={config.includePayload ?? false}
        onChange={(v) => onChange({ includePayload: v })}
        label="Include payload in log"
      />
    </>
  );
}

// ─── Validation Tab ───────────────────────────────────────────

function ValidationTab({ node, metadata }: { node: any; metadata: any }) {
  const config = node.config ?? {};
  const entity = config.entityId
    ? metadata.entities.find((e: any) => e.id === config.entityId)
    : null;

  if (!entity) {
    return (
      <p className="text-[11px] text-text-muted">
        {node.type === 'validation' || node.type === 'db-query'
          ? 'No entity linked — configure it in Properties'
          : 'Validation is not applicable to this node type'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="label mb-2">Entity: {entity.name}</p>
      <div className="space-y-1.5">
        {entity.fields.map((f: any) => (
          <div
            key={f.id}
            className="flex items-center gap-2 bg-bg-3 border border-border rounded px-2 py-1.5 text-[10px] font-mono"
          >
            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-accent" />
            <span className="text-text flex-1">{f.name}</span>
            <span className="text-accent-2">{f.type}</span>
            {f.constraints?.required && <span className="text-amber-400 text-[9px]">req</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
