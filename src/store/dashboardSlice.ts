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
}

interface DashboardState {
  layouts: { [breakpoint: string]: any[] };
  widgets: Record<string, WidgetData>;
  activeWidgetId: string | null;
  draggedWidgetTemplate: { type: string; name: string } | null;
}

// Load initial state from localStorage if available
const loadInitialState = (): DashboardState => {
  try {
    const serializedState = localStorage.getItem('dashboardData');
    if (serializedState) {
      return JSON.parse(serializedState);
    }
  } catch (err) {
    console.error('Could not load dashboard data from localStorage', err);
  }
  
  return {
    layouts: { lg: [] },
    widgets: {},
    activeWidgetId: null,
    draggedWidgetTemplate: null,
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
    resetDashboard: (state) => {
      const saved = loadInitialState();
      state.layouts = saved.layouts;
      state.widgets = saved.widgets;
      state.activeWidgetId = null;
      state.draggedWidgetTemplate = null;
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
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
