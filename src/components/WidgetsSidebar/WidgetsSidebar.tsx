import React, { useState } from 'react';
import { Box, Tabs, Tab, TextField, InputAdornment, Typography, Paper } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import BarChartIcon from '@mui/icons-material/BarChart';
import TableChartIcon from '@mui/icons-material/TableChart';
import DataObjectIcon from '@mui/icons-material/DataObject';
import NumbersIcon from '@mui/icons-material/Numbers';
import PieChartIcon from '@mui/icons-material/PieChart';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import AreaChartIcon from '@mui/icons-material/AreaChart';
import RadarIcon from '@mui/icons-material/Radar';
import FilterTiltShiftIcon from '@mui/icons-material/FilterTiltShift';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import { setDraggedWidgetTemplate } from '../../store/dashboardSlice';
import widgetsConfig from '../../widgetsConfig.json';

const getIcon = (type: string) => {
  switch (type) {
    case 'bar': return <BarChartIcon />;
    case 'table': return <TableChartIcon />;
    case 'pie': return <PieChartIcon />;
    case 'line': return <ShowChartIcon />;
    case 'scatter': return <BubbleChartIcon />;
    case 'heat': return <FilterTiltShiftIcon />;
    case 'metric': return <NumbersIcon />;
    case 'area': return <AreaChartIcon />;
    case 'radar': return <RadarIcon />;
    case 'funnel': return <FilterTiltShiftIcon />;
    default: return <DataObjectIcon />;
  }
};

const availableWidgets = Object.keys(widgetsConfig).map(key => ({
  id: `w-${key}`,
  type: key,
  name: widgetsConfig[key as keyof typeof widgetsConfig].name,
  icon: getIcon(key)
}));

const WidgetsSidebar: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  
  const dispatch = useDispatch();
  const dashboardWidgets = useSelector((state: RootState) => state.dashboard.widgets);

  const isWidgetInUse = (type: string) => {
    return Object.values(dashboardWidgets).some(w => w.type === type);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: any) => {
    e.dataTransfer.setData('text/plain', ''); 
    e.dataTransfer.effectAllowed = 'copy';
    dispatch(setDraggedWidgetTemplate({ type: widget.type, name: widget.name }));
  };

  const handleDragEnd = () => {
    dispatch(setDraggedWidgetTemplate(null));
  };

  const filteredWidgets = availableWidgets.filter(w => w.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Report" />
        <Tab label="Non-Report" />
      </Tabs>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            endAdornment: <InputAdornment position="end"><FilterListIcon sx={{ cursor: 'pointer' }} /></InputAdornment>,
          }}
        />
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tabIndex === 0 && filteredWidgets.map((widget) => {
          const inUse = isWidgetInUse(widget.type);
          return (
            <div
              key={widget.id}
              className="droppable-element"
              draggable={!inUse}
              unselectable="on"
              onDragStart={(e) => handleDragStart(e, widget)}
              onDragEnd={handleDragEnd}
              style={{
                cursor: inUse ? 'not-allowed' : 'grab',
                opacity: inUse ? 0.5 : 1,
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    borderColor: inUse ? '#e0e0e0' : 'primary.main',
                  }
                }}
              >
              <Box sx={{ color: 'primary.main', display: 'flex' }}>
                {widget.icon}
              </Box>
              <Box>
                <Typography variant="body2" fontWeight="bold">{widget.name}</Typography>
                <Typography variant="caption" color="text.secondary">Basic {widget.type}</Typography>
              </Box>
            </Paper>
            </div>
          );
        })}
        {tabIndex === 1 && (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No non-report widgets available.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default WidgetsSidebar;
