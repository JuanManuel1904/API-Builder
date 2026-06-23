import React from 'react';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useExportPrisma, useExportOpenApi, useExportPostman, useExportZip } from '@/lib/api/hooks';

interface Props {
  projectId: string;
  onClose: () => void;
}

const EXPORTS = [
  {
    key: 'prisma' as const,
    icon: '◈',
    title: 'Prisma Schema',
    description: 'Generate a schema.prisma file with your models, relations, and field types.',
    filename: 'schema.prisma',
    color: '#5a67d8',
  },
  {
    key: 'openapi' as const,
    icon: '⊙',
    title: 'OpenAPI 3.0 Spec',
    description: 'Generate an openapi.json file to document and share your API.',
    filename: 'openapi.json',
    color: '#38a169',
  },
  {
    key: 'postman' as const,
    icon: '↗',
    title: 'Postman Collection',
    description: 'Import directly into Postman to test your endpoints.',
    filename: 'postman_collection.json',
    color: '#e05c2d',
  },
  {
    key: 'zip' as const,
    icon: '⬡',
    title: 'Full NestJS Project',
    description:
      'Download a complete NestJS boilerplate with controllers, services, DTOs, and Dockerfile.',
    filename: 'project.zip',
    color: '#e53e3e',
  },
];

export function ExportModal({ projectId, onClose }: Props) {
  const prisma = useExportPrisma(projectId);
  const openapi = useExportOpenApi(projectId);
  const postman = useExportPostman(projectId);
  const zip = useExportZip(projectId);

  const mutations = { prisma, openapi, postman, zip };

  const handleExport = async (key: keyof typeof mutations) => {
    try {
      await mutations[key].mutateAsync();
      toast.success('Download started');
    } catch {
      toast.error('Export failed — check the console');
    }
  };

  return (
    <Modal
      title="Export Project"
      description="Download your API in different formats"
      onClose={onClose}
      size="md"
    >
      <div className="space-y-3">
        {EXPORTS.map((exp) => {
          const mut = mutations[exp.key];
          return (
            <div
              key={exp.key}
              className="flex items-center gap-4 p-4 bg-bg-3 border border-border rounded-lg hover:border-border-2 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${exp.color}18`, color: exp.color }}
              >
                {exp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-text">{exp.title}</span>
                  <code className="text-[9px] px-1 py-0.5 rounded bg-bg-4 text-text-muted font-mono">
                    {exp.filename}
                  </code>
                </div>
                <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{exp.description}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={mut.isPending}
                onClick={() => handleExport(exp.key)}
                className="flex-shrink-0"
              >
                ↓ Download
              </Button>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
