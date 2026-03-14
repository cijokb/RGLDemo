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
import WidgetRenderer from '../Widgets/WidgetRenderer';

const DashboardViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = id || 'default';

  const dispatch = useDispatch();
  const { layouts, widgets, widgetData, name } = useSelector((state: RootState) => state.dashboard);
  
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
            {Object.values(widgets).map((widget) => (
              <div key={widget.id}>
                <Paper
                  elevation={1}
                  sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e0e0e0', borderRadius: 2 }}
                >
                  <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider', bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{widget.alias || widget.name}</Typography>
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
            ))}
          </Responsive>
        )}
      </Box>
    </Box>
  );
};

export default DashboardViewer;
