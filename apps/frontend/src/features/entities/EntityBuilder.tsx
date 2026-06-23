import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateEntity, useUpdateEntity } from '@/lib/api/hooks';
import { cn } from '@/lib/utils';
import type { EntityDefinition, EntityField, FieldType } from '@vab/types';

const FIELD_TYPES: FieldType[] = [
  'string',
  'number',
  'boolean',
  'date',
  'uuid',
  'enum',
  'json',
  'array',
];

const TYPE_COLORS: Record<FieldType, string> = {
  string: 'text-blue-400',
  number: 'text-amber-400',
  boolean: 'text-emerald-400',
  date: 'text-violet-400',
  uuid: 'text-accent-2',
  enum: 'text-pink-400',
  json: 'text-orange-400',
  array: 'text-cyan-400',
};

function generateId() {
  return `f-${Math.random().toString(36).slice(2, 9)}`;
}

interface Props {
  projectId: string;
  onClose: () => void;
  editEntity?: EntityDefinition;
}

export function EntityBuilder({ projectId, onClose, editEntity }: Props) {
  const createEntity = useCreateEntity(projectId);
  const updateEntity = useUpdateEntity(projectId);
  const isEditing = !!editEntity;

  const [name, setName] = useState(editEntity?.name ?? '');
  const [description, setDescription] = useState(editEntity?.description ?? '');
  const [softDelete, setSoftDelete] = useState(editEntity?.softDelete ?? false);
  const [fields, setFields] = useState<EntityField[]>(
    editEntity?.fields ?? [
      { id: generateId(), name: 'id', type: 'uuid', isId: true, constraints: {} },
      { id: generateId(), name: 'createdAt', type: 'date', isCreatedAt: true, constraints: {} },
      { id: generateId(), name: 'updatedAt', type: 'date', isUpdatedAt: true, constraints: {} },
    ],
  );

  const addField = () => {
    setFields((f) => [
      ...f,
      { id: generateId(), name: '', type: 'string', constraints: { required: true } },
    ]);
  };

  const updateField = (id: string, patch: Partial<EntityField>) => {
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setFields((fs) => fs.filter((f) => f.id !== id));
  };

  const isPending = createEntity.isPending || updateEntity.isPending;

  const handleSubmit = async () => {
    if (!name.trim()) return toast.error('Entity name is required');
    if (fields.some((f) => !f.name.trim())) return toast.error('All fields need a name');

    const tableName = name.toLowerCase().replace(/\s+/g, '_') + 's';
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      tableName,
      fields,
      timestamps: true,
      softDelete,
    };

    try {
      if (isEditing) {
        await updateEntity.mutateAsync({ entityId: editEntity.id, data: payload });
        toast.success(`Entity "${name}" updated`);
      } else {
        await createEntity.mutateAsync(payload);
        toast.success(`Entity "${name}" created`);
      }
      onClose();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? `Failed to ${isEditing ? 'update' : 'create'} entity`,
      );
    }
  };

  const regularFields = fields.filter((f) => !f.isId && !f.isCreatedAt && !f.isUpdatedAt);
  const systemFields = fields.filter((f) => f.isId || f.isCreatedAt || f.isUpdatedAt);

  return (
    <Modal
      title={isEditing ? `Edit ${editEntity.name}` : 'New Entity'}
      description="Define the data model for your entity"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={isPending} onClick={handleSubmit}>
            {isEditing ? 'Update Entity' : 'Create Entity'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Name + description */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Entity Name *</label>
            <input
              className="input"
              placeholder="User, Product, Order…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Description</label>
            <input
              className="input"
              placeholder="What does this entity represent?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Fields */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label mb-0">Fields</label>
            <Button variant="ghost" size="sm" onClick={addField}>
              + Add field
            </Button>
          </div>

          {/* System fields (readonly) */}
          <div className="space-y-1 mb-2">
            {systemFields.map((f) => (
              <SystemField key={f.id} field={f} />
            ))}
          </div>

          {/* User fields */}
          <div className="space-y-1.5">
            {regularFields.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <p className="text-xs text-text-muted">No fields yet — click "+ Add field"</p>
              </div>
            ) : (
              regularFields.map((field) => (
                <FieldRow
                  key={field.id}
                  field={field}
                  onChange={(patch) => updateField(field.id, patch)}
                  onRemove={() => removeField(field.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Options */}
        <div className="pt-1 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-text-muted hover:text-text w-fit">
            <input
              type="checkbox"
              className="accent-accent"
              checked={softDelete}
              onChange={(e) => setSoftDelete(e.target.checked)}
            />
            Enable soft delete (adds <code className="text-accent-2 text-[10px]">deletedAt</code>{' '}
            field instead of hard delete)
          </label>
        </div>
      </div>
    </Modal>
  );
}

function SystemField({ field }: { field: EntityField }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-bg-3/50 border border-border rounded-md text-[10px] font-mono opacity-60">
      <span className="w-3 h-3 text-center">🔒</span>
      <span className="text-text w-24">{field.name}</span>
      <span className={cn('flex-1', TYPE_COLORS[field.type])}>{field.type}</span>
      <span className="text-text-muted">auto</span>
    </div>
  );
}

function FieldRow({
  field,
  onChange,
  onRemove,
}: {
  field: EntityField;
  onChange: (patch: Partial<EntityField>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-bg-3 border border-border rounded-md group hover:border-border-2 transition-colors">
      {/* Name */}
      <input
        className="input flex-1 min-w-0 py-1 text-[11px]"
        placeholder="fieldName"
        value={field.name}
        onChange={(e) => onChange({ name: e.target.value })}
      />

      {/* Type */}
      <select
        className="select w-28 py-1 text-[11px]"
        value={field.type}
        onChange={(e) => onChange({ type: e.target.value as FieldType })}
      >
        {FIELD_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      {/* Constraints */}
      <div className="flex items-center gap-2 text-[10px]">
        <label className="flex items-center gap-1 cursor-pointer text-text-muted hover:text-text">
          <input
            type="checkbox"
            className="accent-accent"
            checked={!!field.constraints.required}
            onChange={(e) =>
              onChange({ constraints: { ...field.constraints, required: e.target.checked } })
            }
          />
          req
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-text-muted hover:text-text">
          <input
            type="checkbox"
            className="accent-accent"
            checked={!!field.constraints.unique}
            onChange={(e) =>
              onChange({ constraints: { ...field.constraints, unique: e.target.checked } })
            }
          />
          uniq
        </label>
        <label className="flex items-center gap-1 cursor-pointer text-text-muted hover:text-text">
          <input
            type="checkbox"
            className="accent-accent"
            checked={!!field.constraints.nullable}
            onChange={(e) =>
              onChange({ constraints: { ...field.constraints, nullable: e.target.checked } })
            }
          />
          null
        </label>
      </div>

      {/* Remove */}
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded flex items-center justify-center text-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
      >
        ✕
      </button>
    </div>
  );
}
