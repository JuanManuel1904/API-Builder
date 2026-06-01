import { create } from 'zustand';

type PanelTab = 'properties' | 'validation' | 'schema';
type ActiveModal = 'new-project' | 'new-entity' | 'new-endpoint' | 'export' | null;

interface UiStore {
  selectedNodeId: string | null;
  selectedEndpointId: string | null;
  panelTab: PanelTab;
  activeModal: ActiveModal;
  sidebarWidth: number;
  rightPanelWidth: number;

  // Actions
  selectNode: (nodeId: string | null) => void;
  selectEndpoint: (endpointId: string | null) => void;
  setPanelTab: (tab: PanelTab) => void;
  openModal: (modal: ActiveModal) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  selectedNodeId: null,
  selectedEndpointId: null,
  panelTab: 'properties',
  activeModal: null,
  sidebarWidth: 200,
  rightPanelWidth: 268,

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  selectEndpoint: (endpointId) => set({ selectedEndpointId: endpointId }),
  setPanelTab: (tab) => set({ panelTab: tab }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
}));
