import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateRelation } from '@/lib/api/hooks';
import { useProjectStore } from '@/store/project.store';
import type { RelationType } from '@vab/types';

const RELATION_TYPES: RelationType[] = ['OneToOne', 'OneToMany', 'ManyToOne', 'ManyToMany'];

const RELATION_DESCRIPTIONS: Record<RelationType, string> = {
  OneToOne: 'Each record relates to exactly one record',
  OneToMany: 'One record relates to many records',
  ManyToOne: 'Many records relate to one record',
  ManyToMany: 'Many records relate to many records (join table)',
};

const ON_DELETE_OPTIONS = [
  { value: 'CASCADE', label: 'Cascade — delete related records' },
  { value: 'SET_NULL', label: 'Set Null — nullify the foreign key' },
  { value: 'RESTRICT', label: 'Restrict — prevent delete if related records exist' },
  { value: 'NO_ACTION', label: 'No Action — database default' },
];

interface Props {
  projectId: string;
  onClose: () => void;
}

export function RelationBuilder({ projectId, onClose }: Props) {
  const createRelation = useCreateRelation(projectId);
  const { metadata } = useProjectStore();

  const [fromEntityId, setFromEntityId] = useState('');
  const [toEntityId, setToEntityId] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('OneToMany');
  const [fromFieldName, setFromFieldName] = useState('');
  const [toFieldName, setToFieldName] = useState('');
  const [onDelete, setOnDelete] = useState<'CASCADE' | 'SET_NULL' | 'RESTRICT' | 'NO_ACTION'>(
    'CASCADE',
  );

  const fromEntity = metadata.entities.find((e) => e.id === fromEntityId);
  const toEntity = metadata.entities.find((e) => e.id === toEntityId);

  const handleEntityFromChange = (id: string) => {
    setFromEntityId(id);
    const entity = metadata.entities.find((e) => e.id === id);
    if (entity) setFromFieldName(entity.name.charAt(0).toLowerCase() + entity.name.slice(1) + 'Id');
  };

  const handleEntityToChange = (id: string) => {
    setToEntityId(id);
    const entity = metadata.entities.find((e) => e.id === id);
    if (entity) setToFieldName(entity.name.charAt(0).toLowerCase() + entity.name.slice(1) + 'Id');
  };

  const handleSubmit = async () => {
    if (!fromEntityId) return toast.error('Select the source entity');
    if (!toEntityId) return toast.error('Select the target entity');
    if (fromEntityId === toEntityId)
      return toast.error('Source and target entities must be different');
    if (!fromFieldName.trim()) return toast.error('From field name is required');
    if (!toFieldName.trim()) return toast.error('To field name is required');

    try {
      await createRelation.mutateAsync({
        type: relationType,
        fromEntityId,
        toEntityId,
        fromFieldName: fromFieldName.trim(),
        toFieldName: toFieldName.trim(),
        onDelete,
      });
      toast.success(`Relation ${fromEntity?.name} → ${toEntity?.name} created`);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create relation');
    }
  };

  if (metadata.entities.length < 2) {
    return (
      <Modal
        title="New Relation"
        description="Link two entities together"
        onClose={onClose}
        size="sm"
      >
        <div className="py-6 text-center text-sm text-text-muted">
          You need at least 2 entities to create a relation.
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="New Relation"
      description="Define a relationship between two entities"
      onClose={onClose}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={createRelation.isPending} onClick={handleSubmit}>
            Create Relation
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Relation type */}
        <div>
          <label className="label">Relation Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {RELATION_TYPES.map((rt) => (
              <button
                key={rt}
                onClick={() => setRelationType(rt)}
                className={`text-left px-3 py-2 rounded-md border text-xs transition-all ${
                  relationType === rt
                    ? 'border-accent bg-accent/10 text-accent-2'
                    : 'border-border text-text-muted hover:border-border-2 hover:text-text'
                }`}
              >
                <div className="font-medium">{rt}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{RELATION_DESCRIPTIONS[rt]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Entities */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From Entity</label>
            <select
              className="select"
              value={fromEntityId}
              onChange={(e) => handleEntityFromChange(e.target.value)}
            >
              <option value="">Select entity…</option>
              {metadata.entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">To Entity</label>
            <select
              className="select"
              value={toEntityId}
              onChange={(e) => handleEntityToChange(e.target.value)}
            >
              <option value="">Select entity…</option>
              {metadata.entities
                .filter((e) => e.id !== fromEntityId)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Visual diagram */}
        {fromEntity && toEntity && (
          <div className="flex items-center justify-center gap-3 py-2 px-4 bg-bg-3 rounded-md border border-border text-xs font-mono">
            <span className="text-accent-2">{fromEntity.name}</span>
            <span className="text-text-muted">—— {relationType} ——›</span>
            <span className="text-accent-2">{toEntity.name}</span>
          </div>
        )}

        {/* Field names */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">From Field Name</label>
            <input
              className="input"
              placeholder="userId"
              value={fromFieldName}
              onChange={(e) => setFromFieldName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">To Field Name</label>
            <input
              className="input"
              placeholder="posts"
              value={toFieldName}
              onChange={(e) => setToFieldName(e.target.value)}
            />
          </div>
        </div>

        {/* On delete */}
        <div>
          <label className="label">On Delete</label>
          <select
            className="select"
            value={onDelete}
            onChange={(e) => setOnDelete(e.target.value as any)}
          >
            {ON_DELETE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
}
