import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import { verticalCompactor } from 'react-grid-layout/core';
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

type WidgetConfig = typeof widgetsConfig;

interface CanvasProps {
  isPreview?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({ isPreview = false }) => {
  const dispatch = useDispatch();
  const { layouts, widgets, activeWidgetId, draggedWidgetTemplate } = useSelector((state: RootState) => state.dashboard);
  
  // Deep-clone frozen Immer layouts so v2 RGL can mutate items during drag/resize.
  // IMPORTANT: structuredClone (not JSON.parse/stringify) preserves undefined properties
  // (e.g., minW: undefined). v2's deepEqual treats missing keys differently from undefined
  // values, and will re-compact layouts if properties are dropped, rearranging widgets.
  const mutableLayouts = useMemo(() => structuredClone(layouts), [layouts]);

  const { width, containerRef, mounted } = useContainerWidth();
  const isInteractingRef = useRef(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const lastDispatchedRef = useRef<string>('');

  const onLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    if (isInteractingRef.current || draggedWidgetTemplate) return;

    // Deep-clone all layouts to avoid storing v2's internal references in Redux
    // (Immer freezes them which breaks RGL mutability).
    // We filter out the temporary drop placeholder but process ALL breakpoints
    // so RGL retains accurate sizing and positioning across window resizes.
    const cleanedLayouts: any = {};
    for (const bp in allLayouts) {
      cleanedLayouts[bp] = allLayouts[bp]
        .filter((l: any) => l.i !== '__dropping-elem__')
        .map((l: any) => ({ ...l }));
    }

    const serialized = JSON.stringify(cleanedLayouts);

    if (serialized !== lastDispatchedRef.current) {
      lastDispatchedRef.current = serialized;
      dispatch(updateLayout(cleanedLayouts));
    }
  }, [draggedWidgetTemplate, dispatch]);

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
         return { ...l }; // Clone to avoid storing v2's internal refs in Redux
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
    <Box ref={containerRef} sx={{ minHeight: '100%', pb: 10 }} onClick={() => !isPreview && setActiveWidget(null)}>
      {mounted && (
        <Responsive
          className="layout"
          width={width}
          layouts={mutableLayouts}
          breakpoints={{ lg: 0 }}
          cols={{ lg: 12 }}
          rowHeight={45}
          margin={[16, 16]}
          dragConfig={{ enabled: !isPreview, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: !isPreview }}
          dropConfig={{ enabled: !isPreview }}
          compactor={verticalCompactor}
          droppingItem={{ i: '__dropping-elem__', x: 0, y: 99, w: 3, h: 6 }}
          onLayoutChange={onLayoutChange}
          onDrop={onDrop}
          onDropDragOver={(_e) => {
            const type = draggedWidgetTemplate?.type as keyof WidgetConfig;
            const config = type ? widgetsConfig[type] : { default: { w: 3, h: 6 } };
            return { w: config.default.w, h: config.default.h };
          }}
          onBreakpointChange={onBreakpointChange}
          onDragStart={() => { isInteractingRef.current = true; }}
          onDragStop={() => { isInteractingRef.current = false; }}
          onResizeStart={() => { isInteractingRef.current = true; }}
          onResizeStop={() => { isInteractingRef.current = false; }}
          style={{ minHeight: '80vh' }}
        >
          {Object.values(widgets).map((widget) => {
            const isActive = activeWidgetId === widget.id && !isPreview;

            return (
              <div key={widget.id}>
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
        </Responsive>
      )}
    </Box>
  );
};

export default Canvas;
