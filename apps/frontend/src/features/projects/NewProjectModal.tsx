import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCreateProject } from '@/lib/api/hooks';

interface Props {
  onClose: () => void;
}

export function NewProjectModal({ onClose }: Props) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '' });
  const createProject = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      const project = await createProject.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      toast.success('Project created!');
      onClose();
      navigate(`/editor/${project.id}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create project');
    }
  };

  return (
    <Modal
      title="New Project"
      description="Create a new Visual API Builder project"
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            loading={createProject.isPending}
            onClick={handleSubmit as any}
          >
            Create
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="label">Project Name *</label>
          <input
            className="input"
            placeholder="My E-commerce API"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
            required
          />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea
            className="input resize-none h-16"
            placeholder="What does this API do?"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
}
