import { Box, Typography, IconButton, Button, Tooltip } from '@mui/material';
import IosShareIcon from '@mui/icons-material/IosShare';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Canvas from './components/Canvas/Canvas';
import WidgetsSidebar from './components/WidgetsSidebar/WidgetsSidebar';
import PropertiesSidebar from './components/PropertiesSidebar/PropertiesSidebar';
import type { RootState } from './store/store';
import { resetDashboard } from './store/dashboardSlice';

function App() {
  const [isPreview, setIsPreview] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  
  const dispatch = useDispatch();
  const dashboard = useSelector((state: RootState) => state.dashboard);

  const handleSave = () => {
    localStorage.setItem('dashboardData', JSON.stringify(dashboard));
    alert('Dashboard saved successfully!');
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard all unsaved changes?')) {
      dispatch(resetDashboard());
    }
  };

  // Calculate widths based on open sidebars
  const getCanvasWidth = () => {
    if (isPreview) return '100%';
    
    // In collapsed mode, we keep a 48px strip
    const leftPx = leftOpen ? '20%' : '48px';
    const rightPx = rightOpen ? '20%' : '48px';
    
    return `calc(100% - ${leftPx} - ${rightPx})`;
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: '#f4f6f8' }}>
      {/* Left Sidebar */}
      {!isPreview && (
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
      )}

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
          <Typography variant="h6" fontWeight="bold">Audit Executive</Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {!isPreview && (
              <>
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
              </>
            )}
            
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1, borderLeft: 1, borderColor: 'divider', pl: 2 }}>
              <Tooltip title="Preview Mode">
                <IconButton size="small" onClick={() => setIsPreview(!isPreview)} color={isPreview ? "primary" : "default"}>
                  {isPreview ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </Tooltip>
              
              <IconButton size="small" title="Share/Export">
                <IosShareIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto' }}>
          <Canvas isPreview={isPreview} />
        </Box>
      </Box>

      {/* Right Sidebar */}
      {!isPreview && (
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
      )}
    </Box>
  );
}

export default App;
