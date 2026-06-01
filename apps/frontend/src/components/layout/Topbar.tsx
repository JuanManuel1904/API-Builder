import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useProjectStore } from '@/store/project.store';
import { useUiStore } from '@/store/ui.store';
import { useUpdateProjectMetadata } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api/client';

interface TopbarProps {
  projectId?: string;
}

export function Topbar({ projectId }: TopbarProps) {
  const navigate = useNavigate();
  const { projectName, metadata, isDirty, markSaved } = useProjectStore();
  const { openModal } = useUiStore();
  const { user, logout } = useAuthStore();
  const updateMeta = useUpdateProjectMetadata(projectId ?? '');

  const handleSave = async () => {
    if (!projectId) return;
    await toast.promise(
      updateMeta.mutateAsync(metadata as unknown as Record<string, unknown>).then(() => markSaved()),
      { loading: 'Saving…', success: 'Saved', error: 'Failed to save' },
    );
  };

  const handleExportZip = () => {
    if (!projectId) return;
    const token = localStorage.getItem('accessToken');
    window.open(`/api/projects/${projectId}/export/zip?formats=nestjs,prisma,openapi,docker,postman`, '_blank');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-[44px] bg-bg-2 border-b border-border flex items-center px-3 gap-2 flex-shrink-0 z-10">
      {/* Logo */}
      <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 mr-2">
        <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#6366f1]" />
        <span className="text-[13px] font-bold tracking-tight">VAB</span>
      </button>

      <div className="w-px h-5 bg-border" />

      {/* Project name */}
      {projectName && (
        <span className="text-[12px] text-text-muted flex items-center gap-1.5">
          <span className="text-text font-medium">{projectName}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Unsaved changes" />}
        </span>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {projectId && (
          <>
            <button onClick={handleSave} disabled={!isDirty} className="btn btn-ghost disabled:opacity-40">
              Save
            </button>
            <button onClick={() => openModal('new-entity')} className="btn btn-ghost">
              + Entity
            </button>
            <button onClick={() => openModal('new-endpoint')} className="btn btn-ghost">
              + Endpoint
            </button>
            <button onClick={() => openModal('export')} className="btn btn-ghost">
              Export
            </button>
            <button onClick={handleExportZip} className="btn btn-ghost">
              ↓ ZIP
            </button>
          </>
        )}

        {!projectId && (
          <button onClick={() => openModal('new-project')} className="btn btn-primary">
            New Project
          </button>
        )}

        {/* User menu */}
        {user && (
          <div className="flex items-center gap-2 ml-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-[10px] font-bold text-accent-2">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <button onClick={handleLogout} className="text-[11px] text-text-muted hover:text-text">
              logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
