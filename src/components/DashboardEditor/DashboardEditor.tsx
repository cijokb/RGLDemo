import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import Canvas from '../Canvas/Canvas';
import WidgetsSidebar from '../WidgetsSidebar/WidgetsSidebar';
import PropertiesSidebar from '../PropertiesSidebar/PropertiesSidebar';
import type { RootState } from '../../store/store';
import { loadDashboard, sanitizeLayouts } from '../../store/dashboardSlice';

const DashboardEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dashboardId = id || 'default';

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const dispatch = useDispatch();
  const dashboard = useSelector((state: RootState) => state.dashboard);

  // Load dashboard data when the ID changes
  useEffect(() => {
    dispatch(loadDashboard(dashboardId));
  }, [dashboardId, dispatch]);

  const goToViewer = () => {
    navigate(`/dashboard/${dashboardId}`);
  };

  const handleSave = () => {
    // Only save layouts and widgets to avoid saving transient state like activeWidgetId
    const dataToSave = {
      layouts: sanitizeLayouts(dashboard.layouts),
      widgets: dashboard.widgets,
      name: dashboard.name,
      description: dashboard.description,
    };

    let targetId = dashboardId;
    // If saving the default template, generate a new unique ID
    if (dashboardId === 'default') {
      targetId = uuidv4().split('-')[0]; // Use a short UUID for cleaner URLs
    }

    localStorage.setItem(`dashboardData_${targetId}`, JSON.stringify(dataToSave));
    
    if (targetId !== dashboardId) {
      alert(`Dashboard saved! Created new unique URL for this layout.`);
      navigate(`/dashboard/${targetId}/edit`, { replace: true });
    } else {
      alert('Dashboard saved successfully!');
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes for this dashboard?')) {
      dispatch(loadDashboard(dashboardId));
    }
  };

  // Calculate widths based on open sidebars
  const getCanvasWidth = () => {
    // In collapsed mode, we keep a 48px strip
    const leftPx = leftOpen ? '20%' : '48px';
    const rightPx = rightOpen ? '20%' : '48px';

    return `calc(100% - ${leftPx} - ${rightPx})`;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f4f6f8' }}>
      {/* Left Sidebar */}
      <Box
          sx={{
            width: leftOpen ? '20%' : '48px',
            transition: 'width 0.3s ease',
            borderRight: 1,
            borderColor: 'divider',
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: leftOpen ? 'space-between' : 'center', borderBottom: 1, borderColor: 'divider', minHeight: '48px' }}>
            {leftOpen && <Typography variant="caption" sx={{ fontWeight: 'bold', ml: 1 }}>WIDGETS</Typography>}
            <IconButton size="small" onClick={() => setLeftOpen(!leftOpen)}>
              {leftOpen ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Box>
          {leftOpen && <WidgetsSidebar />}
        </Box>

      {/* Center Canvas */}
      <Box
        sx={{
          width: getCanvasWidth(),
          transition: 'width 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          height: '100%'
        }}
      >
        <Box sx={{ px: 3, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffffff', borderBottom: 1, borderColor: 'divider', minHeight: '48px' }}>
          <Typography variant="h6" fontWeight="bold">{dashboard.name}</Typography>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<RestartAltIcon />}
              onClick={handleDiscard}
              sx={{ mr: 1 }}
            >
              Discard
            </Button>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
            >
              Save
            </Button>

            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
              <Tooltip title="View Dashboard">
                <IconButton size="small" onClick={goToViewer} color="default">
                  <VisibilityIcon />
                </IconButton>
              </Tooltip>

              <IconButton size="small" title="Share/Export">
                <IosShareIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          <Canvas />
        </Box>
      </Box>

      {/* Right Sidebar */}
      <Box
          sx={{
            width: rightOpen ? '20%' : '48px',
            transition: 'width 0.3s ease',
            borderLeft: 1,
            borderColor: 'divider',
            bgcolor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: rightOpen ? 'space-between' : 'center', borderBottom: 1, borderColor: 'divider', minHeight: '48px' }}>
            <IconButton size="small" onClick={() => setRightOpen(!rightOpen)}>
              {rightOpen ? <ChevronRightIcon /> : <SettingsIcon />}
            </IconButton>
            {rightOpen && <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>PROPERTIES</Typography>}
          </Box>
          {rightOpen && (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              <PropertiesSidebar />
            </Box>
          )}
        </Box>
    </Box>
  );
};

export default DashboardEditor;
