import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import { useDispatch } from 'react-redux';
import { clearDashboard } from '../../store/dashboardSlice';

const DRAWER_WIDTH = 240;
const MINI_DRAWER_WIDTH = 64;

const NavigationDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleNewDashboard = () => {
    dispatch(clearDashboard());
    navigate('/dashboard/default/edit');
    if (open) setOpen(false);
  };

  const menuItems = [
    { text: 'My Dashboards', icon: <DashboardIcon />, onClick: () => navigate('/') },
    { text: 'New Dashboard', icon: <AddIcon />, onClick: handleNewDashboard },
    { text: 'Reports', icon: <AssessmentIcon />, onClick: () => {} },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
            transition: (theme) =>
              theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: 'hidden',
            backgroundColor: '#1e1e2d',
            color: '#ffffff',
            borderRight: 'none',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'flex-end' : 'center',
            padding: (theme) => theme.spacing(0, 1),
            minHeight: '64px',
          }}
        >
          {open && (
            <Typography variant="h6" sx={{ flexGrow: 1, ml: 2, fontWeight: 'bold', color: '#3699ff' }}>
              RGL Demo
            </Typography>
          )}
          <IconButton onClick={toggleDrawer} sx={{ color: '#ffffff' }}>
            {open ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
        <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
        <List>
          {menuItems.map((item) => (
            <Tooltip
              key={item.text}
              title={!open ? item.text : ''}
              placement="right"
            >
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  onClick={item.onClick}
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname.includes('edit') && item.text === 'New Dashboard' ? '#3699ff' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: open ? 1 : 0 }}
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
        <Box sx={{ mt: 'auto', mb: 2 }}>
          <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />
          <ListItem disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 3 : 'auto',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                sx={{ opacity: open ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Drawer>
    </Box>
  );
};

export default NavigationDrawer;
