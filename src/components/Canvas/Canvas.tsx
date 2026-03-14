import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import { verticalCompactor } from 'react-grid-layout/core';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateLayout, dropWidget, setActiveWidget, removeWidget, setDraggedWidgetTemplate, setWidgetLoading, setWidgetData } from '../../store/dashboardSlice';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { v4 as uuidv4 } from 'uuid';
import WidgetRenderer from '../Widgets/WidgetRenderer';
import widgetsConfig from '../../widgetsConfig.json';
import { fetchWidgetData } from '../../services/mockApi';

type WidgetConfig = typeof widgetsConfig;

const Canvas: React.FC = () => {
  const dispatch = useDispatch();
  const { layouts, widgets, widgetData, activeWidgetId, draggedWidgetTemplate } = useSelector((state: RootState) => state.dashboard);

  // Deep-clone frozen Immer layouts so v2 RGL can mutate items during drag/resize.
  // IMPORTANT: structuredClone (not JSON.parse/stringify) preserves undefined properties
  // (e.g., minW: undefined). v2's deepEqual treats missing keys differently from undefined
  // values, and will re-compact layouts if properties are dropped, rearranging widgets.
  const mutableLayouts = useMemo(() => structuredClone(layouts), [layouts]);

  const { width, containerRef, mounted } = useContainerWidth();
  const isInteractingRef = useRef(false);
  const isProcessingDropRef = useRef(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const lastDispatchedRef = useRef<string>('');

  const onLayoutChange = useCallback((_layout: any, allLayouts: any) => {
    if (isInteractingRef.current || isProcessingDropRef.current || draggedWidgetTemplate) return;

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
    isProcessingDropRef.current = true;
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

      // Trigger mock API fetch — shows skeleton loader immediately
      dispatch(setWidgetLoading(newId));
      fetchWidgetData(newId, widgetType).then((data) => {
        dispatch(setWidgetData({ id: newId, data }));
      });
    } catch (err) {
      console.error("Drop failed", err);
    } finally {
      // Give RGL one tick to finish its internal state update before we allow onLayoutChange to fire again
      setTimeout(() => {
        isProcessingDropRef.current = false;
      }, 100);
    }
  };

  const onBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };

  const handleWidgetClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveWidget(id));
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeWidget(id));
  };

  return (
    <Box ref={containerRef} sx={{ minHeight: '100%', pb: 10 }} onClick={() => dispatch(setActiveWidget(null))}>
      {mounted && (
        <Responsive
          className="layout"
          width={width}
          layouts={mutableLayouts}
          breakpoints={{ lg: 0 }}
          cols={{ lg: 12 }}
          rowHeight={45}
          margin={[16, 16]}
          dragConfig={{ enabled: true, handle: '.widget-drag-handle' }}
          resizeConfig={{ enabled: true }}
          dropConfig={{ enabled: true }}
          compactor={verticalCompactor}
          droppingItem={{ i: '__dropping-elem__', x: 0, y: 99, w: 3, h: 6 }}
          onLayoutChange={onLayoutChange}
          onDrop={onDrop}
          onDropDragOver={(_e) => {
            const type = draggedWidgetTemplate?.type as keyof WidgetConfig;
            // Safety check: Ensure config exists before accessing .default
            const config = (type && widgetsConfig[type]) ? widgetsConfig[type] : { default: { w: 3, h: 6 } };
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
            const isActive = activeWidgetId === widget.id;

            return (
              <div key={widget.id}>
                <Paper
                  elevation={isActive ? 6 : 1}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0', borderRadius: 2 }}
                  onClick={(e) => handleWidgetClick(widget.id, e)}
                >
                  <Box className="widget-drag-handle" sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: isActive ? '#f0f7ff' : '#fafafa', cursor: 'move' }}>
                    <DragIndicatorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>{widget.alias || widget.name}</Typography>
                    <IconButton size="small" onClick={(e) => handleRemove(widget.id, e)}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
                  </Box>
                  <Box sx={{ position: 'relative', flexGrow: 1, overflow: 'hidden' }}>
                    <WidgetRenderer
                      type={widget.type}
                      loading={widgetData[widget.id]?.loading}
                      data={widgetData[widget.id]?.data}
                    />
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
