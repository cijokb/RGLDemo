import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import type { Layout, LayoutItem, ResponsiveLayouts } from 'react-grid-layout';
import type { LayoutItem as StoreLayoutItem } from '../../store/dashboardSlice';
import { verticalCompactor } from 'react-grid-layout/core';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateLayout, dropWidget, setActiveWidget, removeWidget, setDraggedWidgetTemplate } from '../../store/dashboardSlice';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { v4 as uuidv4 } from 'uuid';
import LazyWidget from '../Widgets/LazyWidget';
import widgetsConfig from '../../widgetsConfig.json';

type WidgetConfig = typeof widgetsConfig;

const WidgetWrapper = React.memo(({ widgetId }: { widgetId: string }) => {
  const dispatch = useDispatch();
  const widget = useSelector((state: RootState) => state.dashboard.widgets[widgetId]);
  const activeWidgetId = useSelector((state: RootState) => state.dashboard.activeWidgetId);
  
  if (!widget) return null;
  const isActive = activeWidgetId === widgetId;
  const isNonReport = widget.type === 'section_divider' || widget.type === 'landing_page';

  const handleWidgetClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(setActiveWidget(id));
  };

  const handleRemove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeWidget(id));
  };

  return (
    <Paper
      elevation={isActive ? 6 : 1}
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        border: isActive ? '2px solid #1976d2' : '1px solid #e0e0e0', 
        borderRadius: 2,
        position: 'relative',
        '&:hover .overlay-actions': { opacity: 1 }
      }}
      onClick={(e) => handleWidgetClick(widget.id, e)}
    >
      {isNonReport ? (
        <>
          <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <LazyWidget widgetId={widget.id} widgetType={widget.type} />
            {widget.name && (widget.type !== 'landing_page' || !widget.backgroundImage) && (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: widget.type === 'landing_page' ? 'center' : 'flex-start', px: 2, pointerEvents: 'none' }}>
                  <Typography 
                    variant={widget.type === 'landing_page' ? 'h4' : 'subtitle1'} 
                    fontWeight="bold" 
                    sx={{ 
                      color: widget.titleColor || (widget.type === 'landing_page' ? 'white' : 'inherit'), 
                      textShadow: widget.type === 'landing_page' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none' 
                    }}
                  >
                    {widget.name}
                  </Typography>
                </Box>
            )}
          </Box>
          <Box 
            className="widget-drag-handle overlay-actions" 
            sx={{ 
              position: 'absolute', 
              top: 0, 
              right: 0, 
              p: 0.5, 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(255,255,255,0.8)',
              borderBottomLeftRadius: 4,
              opacity: isActive ? 1 : 0,
              transition: 'opacity 0.2s',
              cursor: 'move',
              zIndex: 1
            }}
          >
            <DragIndicatorIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
            <IconButton size="small" onClick={(e) => handleRemove(widget.id, e)}>
              <RemoveCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        </>
      ) : (
        <>
          <Box className="widget-drag-handle" sx={{ p: 1, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', bgcolor: isActive ? '#f0f7ff' : '#fafafa', cursor: 'move' }}>
            <DragIndicatorIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            <Typography variant="subtitle2" sx={{ flexGrow: 1, fontWeight: 'bold' }}>{widget.alias || widget.name}</Typography>
            <IconButton size="small" onClick={(e) => handleRemove(widget.id, e)}><RemoveCircleOutlineIcon fontSize="small" /></IconButton>
          </Box>
          <Box sx={{ position: 'relative', flexGrow: 1, overflow: 'hidden' }}>
            <LazyWidget
              widgetId={widget.id}
              widgetType={widget.type}
            />
          </Box>
        </>
      )}
    </Paper>
  );
});

const Canvas: React.FC = () => {
  const dispatch = useDispatch();
  const layouts = useSelector((state: RootState) => state.dashboard.layouts);
  const draggedWidgetTemplate = useSelector((state: RootState) => state.dashboard.draggedWidgetTemplate);
  const widgetIds = useSelector((state: RootState) => Object.keys(state.dashboard.widgets), shallowEqual);

  const mutableLayouts = useMemo(() => structuredClone(layouts), [layouts]);

  const { width, containerRef, mounted } = useContainerWidth();
  const isInteractingRef = useRef(false);
  const isProcessingDropRef = useRef(false);
  const [currentBreakpoint, setCurrentBreakpoint] = useState('lg');
  const lastDispatchedRef = useRef<string>('');

  const onLayoutChange = useCallback((_layout: Layout, allLayouts: ResponsiveLayouts) => {
    if (isInteractingRef.current || isProcessingDropRef.current || draggedWidgetTemplate) return;

    const cleanedLayouts: { [key: string]: StoreLayoutItem[] } = {};
    for (const bp in allLayouts) {
      const bpLayout = allLayouts[bp];
      if (!bpLayout) continue;
      cleanedLayouts[bp] = bpLayout
        .filter((l) => l.i !== '__dropping-elem__')
        .map((l) => ({ ...l } as StoreLayoutItem));
    }

    const serialized = JSON.stringify(cleanedLayouts);

    if (serialized !== lastDispatchedRef.current) {
      lastDispatchedRef.current = serialized;
      dispatch(updateLayout(cleanedLayouts));
    }
  }, [draggedWidgetTemplate, dispatch]);

  const onDrop = useCallback((layout: Layout, _item: LayoutItem | undefined, e: Event) => {
    e.preventDefault();
    isProcessingDropRef.current = true;
    try {
      if (!draggedWidgetTemplate) return;

      const widgetType = draggedWidgetTemplate.type as keyof WidgetConfig;
      const config = widgetsConfig[widgetType] || { default: { w: 3, h: 6 }, min: { w: 2, h: 3 }, max: { w: 12, h: 12 } };

      const newId = `w-${widgetType}-${uuidv4()}`;

      const resolvedLayout = layout.map((l) => {
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
        return { ...l };
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
        accessLevel: 'Personal' as const,
        backgroundColor: widgetType === 'section_divider' ? '#ffffff' : (widgetType === 'landing_page' ? '#f0f0f0' : undefined)
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
    } finally {
      setTimeout(() => {
        isProcessingDropRef.current = false;
      }, 100);
    }
  }, [draggedWidgetTemplate, currentBreakpoint, dispatch]);

  const onBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  const onDropDragOver = useCallback(() => {
    const type = draggedWidgetTemplate?.type as keyof WidgetConfig;
    const config = (type && widgetsConfig[type]) ? widgetsConfig[type] : { default: { w: 3, h: 6 } };
    return { w: config.default.w, h: config.default.h };
  }, [draggedWidgetTemplate]);

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
          onDropDragOver={onDropDragOver}
          onBreakpointChange={onBreakpointChange}
          onDragStart={() => { isInteractingRef.current = true; }}
          onDragStop={() => { isInteractingRef.current = false; }}
          onResizeStart={() => { isInteractingRef.current = true; }}
          onResizeStop={() => { isInteractingRef.current = false; }}
          style={{ minHeight: '80vh' }}
        >
          {widgetIds.map((id) => (
            <div key={id}>
              <WidgetWrapper widgetId={id} />
            </div>
          ))}
        </Responsive>
      )}
    </Box>
  );
};

export default React.memo(Canvas);
