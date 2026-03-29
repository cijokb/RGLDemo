import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, IconButton, Paper, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { Responsive, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import type { RootState } from '../../store/store';
import { loadDashboard } from '../../store/dashboardSlice';
import LazyWidget from '../Widgets/LazyWidget';

const DashboardViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = id || 'default';

  const dispatch = useDispatch();
  const { layouts, widgets, name } = useSelector((state: RootState) => state.dashboard);
  
  const { width, containerRef, mounted } = useContainerWidth();

  useEffect(() => {
    dispatch(loadDashboard(dashboardId));
  }, [dashboardId, dispatch]);

  const goToEdit = () => {
    navigate(`/dashboard/${dashboardId}/edit`);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: 1, borderColor: 'divider', minHeight: '48px' }}>
        <Typography variant="h6" fontWeight="bold">{name}</Typography>
        <Tooltip title="Edit Dashboard">
          <IconButton size="small" onClick={goToEdit} color="primary">
            <EditIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Canvas Area */}
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }} ref={containerRef}>
        {mounted && (
          <Responsive
            className="layout"
            width={width}
            layouts={layouts}
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
      </Box>
    </Box>
  );
};

export default DashboardViewer;
