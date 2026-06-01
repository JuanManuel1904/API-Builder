import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { ProjectMetadata, EntityDefinition, EndpointDefinition, FlowDefinition } from '@vab/types';

interface ProjectStore {
  projectId: string | null;
  projectName: string;
  metadata: ProjectMetadata;
  isDirty: boolean;
  lastSaved: Date | null;

  // Actions
  setProject: (id: string, name: string, metadata: ProjectMetadata) => void;
  setMetadata: (metadata: ProjectMetadata) => void;
  markSaved: () => void;

  // Entity actions
  upsertEntity: (entity: EntityDefinition) => void;
  removeEntity: (entityId: string) => void;

  // Endpoint actions
  upsertEndpoint: (endpoint: EndpointDefinition) => void;
  removeEndpoint: (endpointId: string) => void;

  // Flow actions
  upsertFlow: (flow: FlowDefinition) => void;
}

const defaultMetadata: ProjectMetadata = {
  entities: [],
  relations: [],
  flows: [],
  endpoints: [],
  validations: [],
  auth: { strategy: 'jwt' },
};

export const useProjectStore = create<ProjectStore>()(
  immer((set) => ({
    projectId: null,
    projectName: '',
    metadata: defaultMetadata,
    isDirty: false,
    lastSaved: null,

    setProject: (id, name, metadata) =>
      set((s) => {
        s.projectId = id;
        s.projectName = name;
        s.metadata = metadata;
        s.isDirty = false;
      }),

    setMetadata: (metadata) =>
      set((s) => {
        s.metadata = metadata;
        s.isDirty = true;
      }),

    markSaved: () =>
      set((s) => {
        s.isDirty = false;
        s.lastSaved = new Date();
      }),

    upsertEntity: (entity) =>
      set((s) => {
        const idx = s.metadata.entities.findIndex((e) => e.id === entity.id);
        if (idx !== -1) s.metadata.entities[idx] = entity;
        else s.metadata.entities.push(entity);
        s.isDirty = true;
      }),

    removeEntity: (entityId) =>
      set((s) => {
        s.metadata.entities = s.metadata.entities.filter((e) => e.id !== entityId);
        s.metadata.relations = s.metadata.relations.filter(
          (r) => r.fromEntityId !== entityId && r.toEntityId !== entityId,
        );
        s.isDirty = true;
      }),

    upsertEndpoint: (endpoint) =>
      set((s) => {
        const idx = s.metadata.endpoints.findIndex((e) => e.id === endpoint.id);
        if (idx !== -1) s.metadata.endpoints[idx] = endpoint;
        else s.metadata.endpoints.push(endpoint);
        s.isDirty = true;
      }),

    removeEndpoint: (endpointId) =>
      set((s) => {
        const ep = s.metadata.endpoints.find((e) => e.id === endpointId);
        if (ep?.flowId) {
          s.metadata.flows = s.metadata.flows.filter((f) => f.id !== ep.flowId);
        }
        s.metadata.endpoints = s.metadata.endpoints.filter((e) => e.id !== endpointId);
        s.isDirty = true;
      }),

    upsertFlow: (flow) =>
      set((s) => {
        const idx = s.metadata.flows.findIndex((f) => f.id === flow.id);
        if (idx !== -1) s.metadata.flows[idx] = flow;
        else s.metadata.flows.push(flow);
        s.isDirty = true;
      }),
  })),
);
