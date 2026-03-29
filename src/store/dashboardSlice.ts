import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface WidgetData {
  id: string;
  type: string; // 'bar', 'heat', 'metric', 'sankey', 'table'
  name: string;
  alias: string;
  description: string;
  language: string;
  workspaces: string[];
  active: boolean;
  accessLevel: 'Personal' | 'Global';
  backgroundColor?: string;
  backgroundImage?: string;
  titleColor?: string;
}

interface DashboardState {
  layouts: { [breakpoint: string]: any[] };
  widgets: Record<string, WidgetData>;
  widgetData: Record<string, { loading: boolean; data: any | null }>;
  widgetUIState: Record<string, any>; // Stores pagination, sorting, etc.
  activeWidgetId: string | null;
  draggedWidgetTemplate: { type: string; name: string } | null;
  name: string;
  description: string;
  isExporting: boolean;
}

// Load initial state from localStorage if available
const loadInitialState = (id: string = 'default'): DashboardState => {
  try {
    const serializedState = localStorage.getItem(`dashboardData_${id}`);
    if (serializedState) {
      const parsedState = JSON.parse(serializedState);
      
      // Ensure all required state keys exist to avoid crashes in components
      return {
        layouts: parsedState.layouts || { lg: [] },
        widgets: parsedState.widgets || {},
        widgetData: parsedState.widgetData || {},
        widgetUIState: parsedState.widgetUIState || {},
        activeWidgetId: null, // Always reset transient state
        draggedWidgetTemplate: null,
        name: parsedState.name || (id === 'default' ? 'New Dashboard' : `Dashboard ${id}`),
        description: parsedState.description || '',
        isExporting: false,
      };
    }
  } catch (err) {
    console.error(`Could not load dashboard data for ${id} from localStorage`, err);
  }
  
  return {
    layouts: { lg: [] },
    widgets: {},
    widgetData: {},
    widgetUIState: {},
    activeWidgetId: null,
    draggedWidgetTemplate: null,
    name: 'New Dashboard',
    description: '',
    isExporting: false,
  };
};

const initialState: DashboardState = loadInitialState();

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<{ layout: any; widget: WidgetData }>) => {
      const { layout, widget } = action.payload;
      
      if (!state.layouts.lg) state.layouts.lg = [];
      
      const exists = state.layouts.lg.some(l => l.i === layout.i);
      if (!exists) {
        state.layouts.lg.push({ ...layout });
      }
      
      state.widgets[widget.id] = widget;
    },
    dropWidget: (state, action: PayloadAction<{ breakpoint: string; layout: any[]; widget: WidgetData }>) => {
      const { layout, widget } = action.payload;
      
      // Always store under 'lg' since we use a single breakpoint
      state.layouts.lg = layout;
      
      state.widgets[widget.id] = widget;
    },
    updateLayout: (state, action: PayloadAction<{ [key: string]: any[] }>) => {
      state.layouts = { ...state.layouts, ...action.payload };
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      Object.keys(state.layouts).forEach(bp => {
        state.layouts[bp] = state.layouts[bp].filter((l: any) => l.i !== id);
      });
      delete state.widgets[id];
      delete state.widgetData[id];
      if (state.activeWidgetId === id) {
        state.activeWidgetId = null;
      }
    },
    setActiveWidget: (state, action: PayloadAction<string | null>) => {
      state.activeWidgetId = action.payload;
    },
    updateWidgetProperties: (state, action: PayloadAction<{ id: string; properties: Partial<WidgetData> }>) => {
      const { id, properties } = action.payload;
      if (state.widgets[id]) {
        state.widgets[id] = { ...state.widgets[id], ...properties };
      }
    },
    setDraggedWidgetTemplate: (state, action: PayloadAction<{ type: string; name: string } | null>) => {
      state.draggedWidgetTemplate = action.payload;
    },
    resetDashboard: (state, action: PayloadAction<string>) => {
      const saved = loadInitialState(action.payload);
      state.layouts = saved.layouts;
      state.widgets = saved.widgets;
      state.widgetData = {};
      state.activeWidgetId = null;
      state.draggedWidgetTemplate = null;
      state.name = saved.name;
      state.description = saved.description;
    },
    loadDashboard: (state, action: PayloadAction<string>) => {
      const saved = loadInitialState(action.payload);
      state.layouts = saved.layouts;
      state.widgets = saved.widgets;
      state.widgetData = {};
      state.activeWidgetId = null;
      state.draggedWidgetTemplate = null;
      state.name = saved.name;
      state.description = saved.description;
    },
    setWidgetLoading: (state, action: PayloadAction<string>) => {
      state.widgetData[action.payload] = { loading: true, data: null };
    },
    setWidgetData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.widgetData[action.payload.id] = { loading: false, data: action.payload.data };
    },
    updateWidgetUIState: (state, action: PayloadAction<{ id: string; state: any }>) => {
      const { id, state: newState } = action.payload;
      state.widgetUIState[id] = { ...(state.widgetUIState[id] || {}), ...newState };
    },
    clearDashboard: (state) => {
      state.layouts = { lg: [] };
      state.widgets = {};
      state.widgetData = {};
      state.activeWidgetId = null;
      state.draggedWidgetTemplate = null;
      state.name = 'New Dashboard';
      state.description = '';
    },
    updateDashboardMetadata: (state, action: PayloadAction<{ name?: string; description?: string }>) => {
      if (action.payload.name !== undefined) state.name = action.payload.name;
      if (action.payload.description !== undefined) state.description = action.payload.description;
    },
    setExporting: (state, action: PayloadAction<boolean>) => {
      state.isExporting = action.payload;
    },
  },
});

export const {
  addWidget,
  updateLayout,
  dropWidget,
  removeWidget,
  setActiveWidget,
  updateWidgetProperties,
  setDraggedWidgetTemplate,
  resetDashboard,
  loadDashboard,
  setWidgetLoading,
  setWidgetData,
  updateWidgetUIState,
  clearDashboard,
  updateDashboardMetadata,
  setExporting,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
