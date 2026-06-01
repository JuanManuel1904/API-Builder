import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import type {
  Project,
  ProjectSummary,
  CreateProjectDto,
  EntityDefinition,
  CreateEntityDto,
  EndpointDefinition,
  CreateEndpointDto,
  FlowDefinition,
  SaveFlowDto,
} from '@vab/types';

// ── Auth ──────────────────────────────────────────────────────
export function useLogin() {
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then((r) => r.data),
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string }) =>
      api.post('/auth/register', data).then((r) => r.data),
    onSuccess: (res) => {
      localStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('refreshToken', res.data.refreshToken);
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then((r) => r.data.data),
    enabled: !!localStorage.getItem('accessToken'),
    retry: false,
  });
}

// ── Projects ──────────────────────────────────────────────────
export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.data),
  });
}

export function useProject(id: string) {
  return useQuery<Project>({
    queryKey: ['projects', id],
    queryFn: () => api.get(`/projects/${id}`).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectDto) => api.post('/projects', data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useUpdateProjectMetadata(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (metadata: Record<string, unknown>) =>
      api.put(`/projects/${projectId}/metadata`, { metadata }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

export function useDuplicateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/projects/${id}/duplicate`).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  });
}

// ── Entities ──────────────────────────────────────────────────
export function useEntities(projectId: string) {
  return useQuery<EntityDefinition[]>({
    queryKey: ['projects', projectId, 'entities'],
    queryFn: () => api.get(`/projects/${projectId}/entities`).then((r) => r.data.data),
    enabled: !!projectId,
  });
}

export function useCreateEntity(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntityDto) =>
      api.post(`/projects/${projectId}/entities`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useUpdateEntity(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ entityId, data }: { entityId: string; data: CreateEntityDto }) =>
      api.put(`/projects/${projectId}/entities/${entityId}`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useDeleteEntity(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entityId: string) =>
      api.delete(`/projects/${projectId}/entities/${entityId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

// ── Endpoints ─────────────────────────────────────────────────
export function useEndpoints(projectId: string) {
  return useQuery<EndpointDefinition[]>({
    queryKey: ['projects', projectId, 'endpoints'],
    queryFn: () => api.get(`/projects/${projectId}/endpoints`).then((r) => r.data.data),
    enabled: !!projectId,
  });
}

export function useCreateEndpoint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEndpointDto) =>
      api.post(`/projects/${projectId}/endpoints`, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

export function useDeleteEndpoint(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (endpointId: string) =>
      api.delete(`/projects/${projectId}/endpoints/${endpointId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });
}

// ── Flows ─────────────────────────────────────────────────────
export function useFlow(projectId: string, endpointId: string) {
  return useQuery<FlowDefinition>({
    queryKey: ['projects', projectId, 'flows', endpointId],
    queryFn: () =>
      api.get(`/projects/${projectId}/endpoints/${endpointId}/flow`).then((r) => r.data.data),
    enabled: !!projectId && !!endpointId,
  });
}

export function useSaveFlow(projectId: string, endpointId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveFlowDto) =>
      api
        .put(`/projects/${projectId}/endpoints/${endpointId}/flow`, data)
        .then((r) => r.data.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['projects', projectId, 'flows', endpointId] }),
  });
}

// ── Export ────────────────────────────────────────────────────
export function useExportOpenApi(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'export', 'openapi'],
    queryFn: () =>
      api.get(`/projects/${projectId}/export/openapi`).then((r) => r.data.data),
    enabled: false,
  });
}
