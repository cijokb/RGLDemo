import React, { useCallback, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateLayout, dropWidget, setActiveWidget, removeWidget, setDraggedWidgetTemplate } from '../../store/dashboardSlice';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { v4 as uuidv4 } from 'uuid';
import WidgetRenderer from '../Widgets/WidgetRenderer';
import widgetsConfig from '../../widgetsConfig.json';

const ResponsiveGridLayout = WidthProvider(Responsive);

type WidgetConfig = typeof widgetsConfig;

interface CanvasProps {
  isPreview?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isPreview = false }) => {
  const dispatch = useDispatch();
  const { layouts, widgets, activeWidgetId, draggedWidgetTemplate } = useSelector((state: RootState) => state.dashboard);
  
  const [isInteracting, setIsInteracting] = useState(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');

  const onLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    if (isInteracting || draggedWidgetTemplate) return;

    const cleanedLayouts: any = {};
    for (const bp in allLayouts) {
      cleanedLayouts[bp] = allLayouts[bp]
        .filter((l: any) => l.i !== '__dropping-elem__')
        .map(({ i, x, y, w, h }: any) => {
          // Re-apply min/max constraints from widgetsConfig so react-grid-layout
          // always enforces them, even after layout updates strip the raw values.
          const widget = widgets[i];
          const config = widget ? widgetsConfig[widget.type as keyof typeof widgetsConfig] : null;
          return config
            ? { i, x, y, w, h, minW: config.min.w, minH: config.min.h, maxW: config.max.w, maxH: config.max.h }
            : { i, x, y, w, h };
        });
    }
    
    // Prevent infinite loops by serializing and comparing
    if (JSON.stringify(layouts) !== JSON.stringify(cleanedLayouts)) {
      dispatch(updateLayout(cleanedLayouts));
    }
  }, [layouts, widgets, isInteracting, draggedWidgetTemplate, dispatch]);

  const onDrop = (layout: any, _item: any, e: Event) => {
    e.preventDefault();
    try {
      if (!draggedWidgetTemplate) return;
      
      const widgetType = draggedWidgetTemplate.type as keyof WidgetConfig;
      const config = widgetsConfig[widgetType] || { default: { w: 3, h: 6 }, min: { w: 2, h: 3 }, max: { w: 12, h: 12 } };
      
      const newId = `w-${widgetType}-${uuidv4()}`;
      
      const resolvedLayout = layout.map((l: any) => {
         if (l.i === '__dropping-elem__') {
            return { 
              ...l, 
              i: newId, 
              w: config.default.w, 
              h: config.default.h,
              minW: config.min.w,
              minH: config.min.h,
              maxW: config.max.w,
              maxH: config.max.h
            };
         }
         return l;
      });

      const newWidget = {
        id: newId,
        type: widgetType,
        name: draggedWidgetTemplate.name,
        alias: '',
        description: '',
        language: 'EN',
        workspaces: ['Global'],
        active: true,
        accessLevel: 'Personal' as const
      };

      dispatch(setDraggedWidgetTemplate(null));
      dispatch(dropWidget({ 
        breakpoint: currentBreakpoint, 
        layout: resolvedLayout, 
        widget: newWidget 
      }));
      dispatch(setActiveWidget(newId));
    } catch (err) {
      console.error("Drop failed", err);
    }
  };

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };

  const handleWidgetClick = (id: string, e: React.MouseEvent) => {
    if (isPreview) return;
    e.stopPropagation();
    dispatch(setActiveWidget(id));
  };
  
  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeWidget(id));
  };

  return (
    <Box sx={{ minHeight: '100%', pb: 10 }} onClick={() => !isPreview && setActiveWidget(null)}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={45}
        onLayoutChange={onLayoutChange}
        onDrop={onDrop}
        onDropDragOver={(_e) => {
          const type = draggedWidgetTemplate?.type as keyof WidgetConfig;
          const config = type ? widgetsConfig[type] : { default: { w: 3, h: 6 } };
          return { w: config.default.w, h: config.default.h };
        }}
        onBreakpointChange={onBreakpointChange}
        droppingItem={{ i: '__dropping-elem__', x: 0, y: 99, w: 3, h: 6 }}
        isDroppable={!isPreview}
        isDraggable={!isPreview}
        isResizable={!isPreview}
        draggableHandle=".widget-drag-handle"
        margin={[16, 16]}
        style={{ minHeight: '80vh' }}
        compactType="vertical"
        verticalCompact={true}
        onDragStart={() => setIsInteracting(true)}
        onDragStop={() => setIsInteracting(false)}
        onResizeStart={() => setIsInteracting(true)}
        onResizeStop={() => setIsInteracting(false)}
      >
        {Object.values(widgets).map((widget) => {
          const isActive = activeWidgetId === widget.id && !isPreview;
          const config = widgetsConfig[widget.type as keyof WidgetConfig];
          const layoutItem = layouts[currentBreakpoint]?.find(l => l.i === widget.id);
          
          return (
            <div 
              key={widget.id} 
              data-grid={
                layoutItem ? { ...layoutItem, minW: config?.min.w, minH: config?.min.h, maxW: config?.max.w, maxH: config?.max.h } : 
                { i: widget.id, x: 0, y: 0, w: config?.default.w || 3, h: config?.default.h || 6, minW: config?.min.w, minH: config?.min.h, maxW: config?.max.w, maxH: config?.max.h }
              }
            >
              <Paper 
                elevation={isActive ? 6 : 1}
                sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0', borderRadius: 2 }}
                onClick={(e) => handleWidgetClick(widget.id, e)}
              >
                {!isPreview && (
                  <Box className="widget-drag-handle" sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: isActive ? '#f0f7ff' : '#fafafa', cursor: 'move' }}>
                    <DragIndicatorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>{widget.alias || widget.name}</Typography>
                    <IconButton size="small" onClick={(e) => handleRemove(widget.id, e)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                )}
                <Box sx={{ position: 'relative', flexGrow: 1, overflow: 'hidden' }}>
                  <WidgetRenderer type={widget.type} />
                </Box>
              </Paper>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </Box>
  );
};

export default Canvas;
