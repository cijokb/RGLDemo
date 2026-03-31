import React, { useState } from 'react';
import { Box, Tabs, Tab, TextField, InputAdornment, Typography, Paper, Menu, MenuItem, Checkbox, FormControlLabel, IconButton } from '@mui/material';
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
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import WebIcon from '@mui/icons-material/Web';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import type { RootState } from '../../store/store';
import { setDraggedWidgetTemplate } from '../../store/dashboardSlice';
import widgetsConfig from '../../widgetsConfig.json';

const getIcon = (type: string) => {
  if (type.startsWith('metric')) return <NumbersIcon />;
  if (type.startsWith('table')) return <TableChartIcon />;
  switch (type) {
    case 'bar': return <BarChartIcon />;
    case 'pie': return <PieChartIcon />;
    case 'line': return <ShowChartIcon />;
    case 'scatter': return <BubbleChartIcon />;
    case 'heat': return <FilterTiltShiftIcon />;
    case 'area': return <AreaChartIcon />;
    case 'radar': return <RadarIcon />;
    case 'funnel': return <FilterTiltShiftIcon />;
    case 'section_divider': return <HorizontalRuleIcon />;
    case 'landing_page': return <WebIcon />;
    default: return <DataObjectIcon />;
  }
};

type WidgetConfigEntry = { name: string; category: string };
const typedWidgetsConfig = widgetsConfig as Record<string, WidgetConfigEntry>;

const availableWidgets = Object.keys(typedWidgetsConfig).map(key => ({
  id: `w-${key}`,
  type: key,
  name: typedWidgetsConfig[key].name,
  category: typedWidgetsConfig[key].category,
  icon: getIcon(key)
}));

const WidgetsSidebar: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['charts', 'tables', 'metrics', 'other']);
  
  const dispatch = useDispatch();
  const usedWidgetTypes = useSelector((state: RootState) => {
    const types = new Set<string>();
    Object.values(state.dashboard.widgets).forEach((w) => types.add(w.type));
    return Array.from(types).sort();
  }, shallowEqual);

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const isWidgetInUse = (type: string) => {
    // Non-report widgets can usually be used multiple times
    if (type === 'section_divider' || type === 'landing_page') return false;
    return usedWidgetTypes.includes(type);
  };
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widget: { type: string; name: string }) => {
    e.dataTransfer.setData('text/plain', ''); 
    e.dataTransfer.effectAllowed = 'copy';
    dispatch(setDraggedWidgetTemplate({ type: widget.type, name: widget.name }));
  };

  const handleDragEnd = () => {
    dispatch(setDraggedWidgetTemplate(null));
  };

  const getWidgetGroup = (type: string) => {
    if (type.startsWith('metric')) return 'metrics';
    if (type.startsWith('table')) return 'tables';
    if (['bar', 'pie', 'line', 'area', 'scatter', 'heat', 'radar', 'funnel'].includes(type)) return 'charts';
    return 'other';
  };

  const filteredWidgets = availableWidgets.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tabIndex === 0 ? w.category === 'report' : w.category === 'non-report';
    const matchesType = selectedTypes.includes(getWidgetGroup(w.type));
    return matchesSearch && matchesTab && matchesType;
  });

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
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleFilterClick}>
                  <FilterListIcon color={selectedTypes.length < 4 ? "primary" : "inherit"} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
        PaperProps={{ sx: { width: 200 } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2" fontWeight="bold">Filter by Type</Typography>
        </Box>
        <MenuItem onClick={() => toggleType('charts')}>
          <FormControlLabel
            control={<Checkbox size="small" checked={selectedTypes.includes('charts')} />}
            label="Charts"
          />
        </MenuItem>
        <MenuItem onClick={() => toggleType('tables')}>
          <FormControlLabel
            control={<Checkbox size="small" checked={selectedTypes.includes('tables')} />}
            label="Tables"
          />
        </MenuItem>
        <MenuItem onClick={() => toggleType('metrics')}>
          <FormControlLabel
            control={<Checkbox size="small" checked={selectedTypes.includes('metrics')} />}
            label="Metrics"
          />
        </MenuItem>
        <MenuItem onClick={() => toggleType('other')}>
          <FormControlLabel
            control={<Checkbox size="small" checked={selectedTypes.includes('other')} />}
            label="Other"
          />
        </MenuItem>
      </Menu>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredWidgets.length > 0 ? filteredWidgets.map((widget) => {
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
        }) : (
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
            No widgets found.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default React.memo(WidgetsSidebar);
