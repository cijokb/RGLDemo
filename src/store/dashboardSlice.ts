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
    layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] },
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
      const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
      const colsMap: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
      
      // Initialize layout for all standard breakpoints if they don't exist
      breakpoints.forEach(bp => {
        if (!state.layouts[bp]) {
          state.layouts[bp] = [];
        }
        
        // Check if widget already exists in this breakpoint to avoid duplicates
        const exists = state.layouts[bp].some(l => l.i === layout.i);
        if (!exists) {
          let bpLayout = { ...layout };
          const maxCols = colsMap[bp];
          
          // Ensure width and x-position don't exceed breakpoint capacity
          bpLayout.w = Math.min(layout.w, maxCols);
          if (bpLayout.x + bpLayout.w > maxCols) {
            bpLayout.x = Math.max(0, maxCols - bpLayout.w);
          }
          
          state.layouts[bp].push(bpLayout);
        }
      });
      
      state.widgets[widget.id] = widget;
    },
    dropWidget: (state, action: PayloadAction<{ breakpoint: string; layout: any[]; widget: WidgetData }>) => {
      const { breakpoint, layout, widget } = action.payload;
      
      // Update the layout for the active breakpoint with the resolved positions
      state.layouts[breakpoint] = layout;
      
      // For other breakpoints, we still need to add the widget if it doesn't exist
      const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];
      const colsMap: Record<string, number> = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };
      
      breakpoints.forEach(bp => {
        if (bp !== breakpoint) {
          if (!state.layouts[bp]) state.layouts[bp] = [];
          const exists = state.layouts[bp].some(l => l.i === widget.id);
          if (!exists) {
            // Find the layout item for this widget from the provided layout
            const droppedLayoutItem = layout.find(l => l.i === widget.id);
            if (droppedLayoutItem) {
              let bpLayout = { ...droppedLayoutItem };
              const maxCols = colsMap[bp];
              bpLayout.w = Math.min(bpLayout.w, maxCols);
              if (bpLayout.x + bpLayout.w > maxCols) {
                bpLayout.x = Math.max(0, maxCols - bpLayout.w);
              }
              state.layouts[bp].push(bpLayout);
            }
          }
        }
      });
      
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
