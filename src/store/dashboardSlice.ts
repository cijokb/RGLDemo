import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { LayoutItem } from 'react-grid-layout';

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
}

interface DashboardState {
  layouts: DashboardLayouts;
  widgets: Record<string, WidgetData>;
  widgetData: Record<string, { loading: boolean; data: any | null }>;
  activeWidgetId: string | null;
  draggedWidgetTemplate: { type: string; name: string } | null;
  name: string;
  description: string;
}

export type DashboardLayoutItem = Pick<LayoutItem, 'i' | 'x' | 'y' | 'w' | 'h' | 'minW' | 'minH' | 'maxW' | 'maxH'>;
export type DashboardLayouts = Record<string, DashboardLayoutItem[]>;

const emptyLayouts = (): DashboardLayouts => ({ lg: [] });

const sanitizeLayoutItem = (item: unknown): DashboardLayoutItem | null => {
  if (!item || typeof item !== 'object') return null;

  const candidate = item as Partial<LayoutItem>;

  if (
    typeof candidate.i !== 'string' ||
    typeof candidate.x !== 'number' ||
    typeof candidate.y !== 'number' ||
    typeof candidate.w !== 'number' ||
    typeof candidate.h !== 'number'
  ) {
    return null;
  }

  return {
    i: candidate.i,
    x: candidate.x,
    y: candidate.y,
    w: candidate.w,
    h: candidate.h,
    minW: typeof candidate.minW === 'number' ? candidate.minW : undefined,
    minH: typeof candidate.minH === 'number' ? candidate.minH : undefined,
    maxW: typeof candidate.maxW === 'number' ? candidate.maxW : undefined,
    maxH: typeof candidate.maxH === 'number' ? candidate.maxH : undefined,
  };
};

export const sanitizeLayouts = (layouts: unknown): DashboardLayouts => {
  if (!layouts || typeof layouts !== 'object') {
    return emptyLayouts();
  }

  const sanitized = Object.fromEntries(
    Object.entries(layouts as Record<string, unknown>).map(([breakpoint, layout]) => [
      breakpoint,
      Array.isArray(layout)
        ? layout
            .map(sanitizeLayoutItem)
            .filter((item): item is DashboardLayoutItem => item !== null)
        : [],
    ]),
  ) as DashboardLayouts;

  return Object.keys(sanitized).length > 0 ? sanitized : emptyLayouts();
};

// Load initial state from localStorage if available
const loadInitialState = (id: string = 'default'): DashboardState => {
  try {
    const serializedState = localStorage.getItem(`dashboardData_${id}`);
    if (serializedState) {
      const parsedState = JSON.parse(serializedState);
      
      // Ensure all required state keys exist to avoid crashes in components
      return {
        layouts: sanitizeLayouts(parsedState.layouts),
        widgets: parsedState.widgets || {},
        widgetData: parsedState.widgetData || {},
        activeWidgetId: null, // Always reset transient state
        draggedWidgetTemplate: null,
        name: parsedState.name || (id === 'default' ? 'New Dashboard' : `Dashboard ${id}`),
        description: parsedState.description || '',
      };
    }
  } catch (err) {
    console.error(`Could not load dashboard data for ${id} from localStorage`, err);
  }
  
  return {
    layouts: emptyLayouts(),
    widgets: {},
    widgetData: {},
    activeWidgetId: null,
    draggedWidgetTemplate: null,
    name: 'New Dashboard',
    description: '',
  };
};

const initialState: DashboardState = loadInitialState();

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<{ layout: DashboardLayoutItem; widget: WidgetData }>) => {
      const { layout, widget } = action.payload;
      
      if (!state.layouts.lg) state.layouts.lg = [];
      
      const exists = state.layouts.lg.some(l => l.i === layout.i);
      const sanitizedLayout = sanitizeLayoutItem(layout);

      if (!exists && sanitizedLayout) {
        state.layouts.lg.push(sanitizedLayout);
      }
      
      state.widgets[widget.id] = widget;
    },
    dropWidget: (state, action: PayloadAction<{ breakpoint: string; layout: DashboardLayoutItem[]; widget: WidgetData }>) => {
      const { layout, widget } = action.payload;
      
      // Always store under 'lg' since we use a single breakpoint
      state.layouts.lg = sanitizeLayouts({ lg: layout }).lg;
      
      state.widgets[widget.id] = widget;
    },
    updateLayout: (state, action: PayloadAction<DashboardLayouts>) => {
      state.layouts = { ...state.layouts, ...sanitizeLayouts(action.payload) };
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
    },
    loadDashboard: (state, action: PayloadAction<string>) => {
      const saved = loadInitialState(action.payload);
      state.layouts = saved.layouts;
      state.widgets = saved.widgets;
      state.widgetData = {};
      state.activeWidgetId = null;
      state.draggedWidgetTemplate = null;
    },
    setWidgetLoading: (state, action: PayloadAction<string>) => {
      state.widgetData[action.payload] = { loading: true, data: null };
    },
    setWidgetData: (state, action: PayloadAction<{ id: string; data: any }>) => {
      state.widgetData[action.payload.id] = { loading: false, data: action.payload.data };
    },
    clearDashboard: (state) => {
      state.layouts = emptyLayouts();
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
  clearDashboard,
  updateDashboardMetadata,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
