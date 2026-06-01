import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateEndpoint } from '@/lib/api/hooks';
import { useProjectStore } from '@/store/project.store';
import { cn, METHOD_COLORS } from '@/lib/utils';
import type { HttpMethod } from '@vab/types';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const METHOD_DESCRIPTIONS: Record<HttpMethod, string> = {
  GET: 'Retrieve data',
  POST: 'Create resource',
  PUT: 'Replace resource',
  PATCH: 'Partial update',
  DELETE: 'Remove resource',
};

// Quick templates
const TEMPLATES = [
  { label: 'CRUD', description: 'Full set of 5 endpoints for an entity', methods: ['GET', 'POST', 'GET', 'PUT', 'DELETE'] as HttpMethod[] },
  { label: 'Read-only', description: 'List + detail endpoints', methods: ['GET', 'GET'] as HttpMethod[] },
  { label: 'Webhook', description: 'Single POST receiver', methods: ['POST'] as HttpMethod[] },
];

interface Props {
  projectId: string;
  onClose: () => void;
}

export function EndpointBuilder({ projectId, onClose }: Props) {
  const createEndpoint = useCreateEndpoint(projectId);
  const { metadata } = useProjectStore();

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [path, setPath] = useState('/');
  const [summary, setSummary] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState('');

  const handleSubmit = async () => {
    if (!path.startsWith('/')) return toast.error('Path must start with /');

    const tags = selectedEntity ? [selectedEntity.toLowerCase()] : [];

    try {
      await createEndpoint.mutateAsync({ method, path, summary: summary || undefined, isPublic, tags });
      toast.success(`${method} ${path} created`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create endpoint');
    }
  };

  const applyTemplate = (methods: HttpMethod[], entity: string) => {
    if (!entity) return toast.error('Select an entity first');
    const entityLower = entity.toLowerCase();
    const pathMap: Record<HttpMethod, string> = {
      GET: `/${entityLower}s`,
      POST: `/${entityLower}s`,
      PUT: `/${entityLower}s/:id`,
      PATCH: `/${entityLower}s/:id`,
      DELETE: `/${entityLower}s/:id`,
    };
    // Just set first one
    setMethod(methods[0]);
    setPath(pathMap[methods[0]]);
    setSummary('');
  };

  return (
    <Modal
      title="New Endpoint"
      description="Define a new REST endpoint"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={createEndpoint.isPending} onClick={handleSubmit}>
            Create Endpoint
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* HTTP Method */}
        <div>
          <label className="label">Method</label>
          <div className="flex flex-wrap gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={cn(
                  'badge cursor-pointer transition-all text-[10px] px-2 py-1',
                  METHOD_COLORS[m],
                  method === m ? 'ring-1 ring-current shadow-[0_0_6px_currentColor]' : 'opacity-60 hover:opacity-100',
                )}
              >
                {m}
                <span className="ml-1 font-normal text-[9px] opacity-70">{METHOD_DESCRIPTIONS[m]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Path */}
        <div>
          <label className="label">Path</label>
          <div className="flex items-center gap-0">
            <span className="input w-fit rounded-r-none border-r-0 text-text-muted px-2 select-none">
              /api
            </span>
            <input
              className="input rounded-l-none flex-1"
              placeholder="/users or /users/:id"
              value={path}
              onChange={(e) => setPath(e.target.value.startsWith('/') ? e.target.value : `/${e.target.value}`)}
              autoFocus
            />
          </div>
        </div>

        {/* Summary */}
        <div>
          <label className="label">Summary (optional)</label>
          <input
            className="input"
            placeholder="List all active users"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />
        </div>

        {/* Entity tag */}
        {metadata.entities.length > 0 && (
          <div>
            <label className="label">Link to Entity</label>
            <select
              className="select"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
            >
              <option value="">None</option>
              {metadata.entities.map((e) => (
                <option key={e.id} value={e.name}>{e.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Options */}
        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted hover:text-text">
            <input
              type="checkbox"
              className="accent-accent"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public (no auth required)
          </label>
        </div>
      </div>
    </Modal>
  );
}
