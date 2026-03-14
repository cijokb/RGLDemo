import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Button, 
  IconButton, 
  Tooltip,
  Paper,
  Divider,
  Container
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import { useDispatch } from 'react-redux';
import { clearDashboard } from '../../store/dashboardSlice';

interface SavedDashboard {
  id: string;
  name: string;
  description: string;
  lastModified: number;
}

const DashboardList: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [dashboards, setDashboards] = useState<SavedDashboard[]>([]);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = () => {
    const saved: SavedDashboard[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('dashboardData_')) {
        try {
          const id = key.replace('dashboardData_', '');
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          saved.push({
            id,
            name: data.name || `Dashboard ${id}`,
            description: data.description || 'No description provided.',
            lastModified: 0 // LocalStorage doesn't store mtime, we'd need to add it to the schema
          });
        } catch (e) {
          console.error(`Failed to parse dashboard ${key}`, e);
        }
      }
    }
    setDashboards(saved.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      localStorage.removeItem(`dashboardData_${id}`);
      loadDashboards();
    }
  };

  const handleCreateNew = () => {
    dispatch(clearDashboard());
    navigate('/dashboard/default/edit');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="primary">My Dashboards</Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and view your saved dashboard layouts
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={handleCreateNew}
          sx={{ borderRadius: 2, px: 3, py: 1 }}
        >
          New Dashboard
        </Button>
      </Box>

      {dashboards.length === 0 ? (
        <Paper 
          sx={{ 
            p: 8, 
            textAlign: 'center', 
            borderRadius: 4, 
            bgcolor: 'action.hover',
            border: '2px dashed',
            borderColor: 'divider'
          }}
        >
          <DashboardIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No dashboards found</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Get started by creating your first personalized dashboard.
          </Typography>
          <Button variant="outlined" onClick={handleCreateNew}>Create First Dashboard</Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {dashboards.map((dash) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dash.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <DashboardIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6" component="div" fontWeight="bold" noWrap>
                      {dash.name}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    minHeight: '4.5em'
                  }}>
                    {dash.description}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', p: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary" 
                      startIcon={<VisibilityIcon />}
                      onClick={() => navigate(`/dashboard/${dash.id}`)}
                    >
                      View
                    </Button>
                    <Button 
                      size="small" 
                      variant="outlined" 
                      startIcon={<EditIcon />}
                      onClick={() => navigate(`/dashboard/${dash.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </Box>
                  <Tooltip title="Delete Dashboard">
                    <IconButton size="small" color="error" onClick={(e) => handleDelete(dash.id, e)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default DashboardList;
