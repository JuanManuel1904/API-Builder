import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProjects, useCreateProject, useDeleteProject, useDuplicateProject } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth.store';
import { Topbar } from '@/components/layout/Topbar';
import { NewProjectModal } from '@/features/projects/NewProjectModal';
import { useUiStore } from '@/store/ui.store';
import type { ProjectSummary } from '@vab/types';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeModal, openModal, closeModal } = useUiStore();
  const { data: projects, isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const duplicateProject = useDuplicateProject();

  const handleDelete = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await toast.promise(deleteProject.mutateAsync(id), {
      loading: 'Deleting…',
      success: 'Project deleted',
      error: 'Failed to delete',
    });
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await toast.promise(duplicateProject.mutateAsync(id), {
      loading: 'Duplicating…',
      success: 'Project duplicated',
      error: 'Failed to duplicate',
    });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <Topbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-text-muted mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </p>
          </div>
          <button onClick={() => openModal('new-project')} className="btn btn-primary px-4 py-2 text-sm">
            + New Project
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <ProjectsSkeleton />
        ) : !projects?.length ? (
          <EmptyState onNew={() => openModal('new-project')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onClick={() => navigate(`/editor/${p.id}`)}
                onDelete={(e) => handleDelete(p.id, p.name, e)}
                onDuplicate={(e) => handleDuplicate(p.id, e)}
              />
            ))}
          </div>
        )}
      </main>

      {activeModal === 'new-project' && <NewProjectModal onClose={closeModal} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function ProjectCard({
  project,
  onClick,
  onDelete,
  onDuplicate,
}: {
  project: ProjectSummary;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      onClick={onClick}
      className="group bg-bg-2 border border-border rounded-xl p-5 cursor-pointer hover:border-border-2 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)] transition-all animate-fade-in"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-sm font-bold text-accent-2">
          {project.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onDuplicate}
            title="Duplicate"
            className="w-7 h-7 rounded-md bg-bg-3 border border-border hover:border-border-2 text-text-muted hover:text-text text-xs flex items-center justify-center transition-all"
          >
            ⧉
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="w-7 h-7 rounded-md bg-bg-3 border border-border hover:border-red-500/30 text-text-muted hover:text-red-400 text-xs flex items-center justify-center transition-all"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Name + description */}
      <h3 className="font-semibold text-sm text-text truncate">{project.name}</h3>
      {project.description && (
        <p className="text-[11px] text-text-muted mt-0.5 line-clamp-2">{project.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
        <StatPill label="entities" value={project.entityCount} />
        <StatPill label="endpoints" value={project.endpointCount} />
        <span className="ml-auto text-[10px] text-text-muted">{formatDate(project.updatedAt)}</span>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1 text-[10px] font-mono">
      <span className="text-accent-2 font-semibold">{value}</span>
      <span className="text-text-muted">{label}</span>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-bg-2 border border-border flex items-center justify-center text-2xl">
        ◻
      </div>
      <div>
        <h3 className="font-semibold text-base">No projects yet</h3>
        <p className="text-sm text-text-muted mt-1">Create your first visual API project</p>
      </div>
      <button onClick={onNew} className="btn btn-primary px-5 py-2 text-sm mt-2">
        Create project
      </button>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-bg-2 border border-border rounded-xl p-5 animate-shimmer">
          <div className="w-9 h-9 rounded-lg bg-bg-3 mb-3" />
          <div className="h-3 bg-bg-3 rounded w-2/3 mb-2" />
          <div className="h-2.5 bg-bg-3 rounded w-full" />
        </div>
      ))}
    </div>
  );
}
