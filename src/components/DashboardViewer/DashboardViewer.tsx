import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, IconButton, Paper, Tooltip, CircularProgress } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import type { RootState } from '../../store/store';
import { loadDashboard, setExporting } from '../../store/dashboardSlice';
import LazyWidget from '../Widgets/LazyWidget';
import { exportDashboardToPDF } from '../../utils/exportDashboard';

const DashboardViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = id || 'default';

  const dispatch = useDispatch();
  const { layouts, widgets, name, isExporting } = useSelector((state: RootState) => state.dashboard);
  
  const { width, containerRef, mounted } = useContainerWidth();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Lock all layout items to prevent drag and resize in preview mode
  const staticLayouts = useMemo(() => {
    const result: typeof layouts = {};
    for (const [bp, items] of Object.entries(layouts)) {
      result[bp] = items.map((item) => ({
        ...item,
        static: true,
        isDraggable: false,
        isResizable: false,
      }));
    }
    return result;
  }, [layouts]);

  useEffect(() => {
    dispatch(loadDashboard(dashboardId));
  }, [dashboardId, dispatch]);

  const goToEdit = () => {
    navigate(`/dashboard/${dashboardId}/edit`);
  };

  const handleExport = useCallback(async () => {
    if (!canvasRef.current || isExporting) return;

    // Step 1: Enable export mode — forces all lazy widgets to render
    dispatch(setExporting(true));

    // Step 2: Wait for all charts to render (give Highcharts time to initialize)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Step 3: Capture and generate PDF
    try {
      await exportDashboardToPDF(canvasRef.current, name || 'Dashboard');
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Export failed. Please try again.');
    }

    // Step 4: Disable export mode — restore virtualization
    dispatch(setExporting(false));
  }, [dispatch, name, isExporting]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: 1, borderColor: 'divider', minHeight: '48px' }}>
        <Typography variant="h6" fontWeight="bold">{name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title="Export to PDF">
            <IconButton 
              size="small" 
              onClick={handleExport} 
              color="primary"
              disabled={isExporting}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Dashboard">
            <IconButton size="small" onClick={goToEdit} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Export loading overlay — OUTSIDE the canvas ref so html2canvas doesn't capture it */}
      {isExporting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(255,255,255,0.85)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={48} />
          <Typography variant="h6" color="text.secondary">
            Preparing PDF export...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Rendering all widgets. Please wait.
          </Typography>
        </Box>
      )}

      {/* Canvas Area */}
      <Box 
        sx={{ flexGrow: 1, p: 2, overflowY: isExporting ? 'visible' : 'auto', position: 'relative' }} 
        ref={containerRef}
      >
        <div ref={canvasRef}>
        {mounted && (
          <Responsive
            className="layout"
            width={width}
            layouts={staticLayouts}
            breakpoints={{ lg: 0 }}
            cols={{ lg: 12 }}
            rowHeight={45}
            margin={[16, 16]}
            dragConfig={{ enabled: false }}
            resizeConfig={{ enabled: false }}
          >
            {Object.values(widgets).map((widget) => {
              const isNonReport = widget.type === 'section_divider' || widget.type === 'landing_page';

              return (
                <div key={widget.id}>
                  <Paper
                    elevation={isNonReport ? 0 : 1}
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      overflow: 'hidden', 
                      border: isNonReport ? 'none' : '1px solid #e0e0e0', 
                      borderRadius: isNonReport ? 0 : 2,
                      bgcolor: isNonReport ? 'transparent' : '#ffffff',
                      position: 'relative'
                    }}
                  >
                    {isNonReport ? (
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
                    ) : (
                      <>
                        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{widget.alias || widget.name}</Typography>
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
                </div>
              );
            })}
          </Responsive>
        )}
        </div>
      </Box>
    </Box>
  );
};

export default DashboardViewer;
