import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import DashboardEditor from './components/DashboardEditor/DashboardEditor';
import DashboardViewer from './components/DashboardViewer/DashboardViewer';
import DashboardList from './components/DashboardList/DashboardList';
import NavigationDrawer from './components/Navigation/NavigationDrawer';

function App() {
  return (
    <Box sx={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <NavigationDrawer />
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <Routes>
          <Route path="/" element={<DashboardList />} />
          <Route path="/dashboard/:id" element={<DashboardViewer />} />
          <Route path="/dashboard/:id/edit" element={<DashboardEditor />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;
