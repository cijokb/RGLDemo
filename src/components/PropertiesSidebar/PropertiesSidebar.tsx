import React from 'react';
import { Box, Typography, TextField, MenuItem, FormControlLabel, Switch, Radio, RadioGroup, Select, FormControl, InputLabel, Divider } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateWidgetProperties, updateDashboardMetadata } from '../../store/dashboardSlice';

const languages = ['EN', 'ES', 'FR', 'DE'];
const workspacesList = ['Global', 'Finance', 'HR', 'IT'];

const PropertiesSidebar: React.FC = () => {
  const dispatch = useDispatch();
  const { activeWidgetId, widgets, name, description } = useSelector((state: RootState) => state.dashboard);

  if (!activeWidgetId || !widgets[activeWidgetId]) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <Typography variant="subtitle2" color="primary" fontWeight="bold">
          DASHBOARD PROPERTIES
        </Typography>

        <TextField
          label="Dashboard Name"
          size="small"
          fullWidth
          value={name}
          onChange={(e) => dispatch(updateDashboardMetadata({ name: e.target.value }))}
          placeholder="Enter dashboard name..."
        />

        <TextField
          label="Dashboard Description"
          size="small"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => dispatch(updateDashboardMetadata({ description: e.target.value }))}
          placeholder="Briefly describe this dashboard..."
        />

        <Divider />
        
        <Box sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Tip: Click on a widget to see its specific properties. Click on the background again to come back here.
          </Typography>
        </Box>
      </Box>
    );
  }

  const widget = widgets[activeWidgetId];

  const handleChange = (field: string, value: any) => {
    dispatch(updateWidgetProperties({ id: activeWidgetId, properties: { [field]: value } }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="subtitle2" color="primary" fontWeight="bold">
        {widget.type.toUpperCase()} COMPONENTS
      </Typography>

      <TextField
        label="Name"
        size="small"
        fullWidth
        value={widget.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      <TextField
        label="Alias"
        size="small"
        fullWidth
        value={widget.alias}
        onChange={(e) => handleChange('alias', e.target.value)}
      />

      <TextField
        label="Description"
        size="small"
        fullWidth
        multiline
        rows={3}
        value={widget.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />

      <FormControl size="small" fullWidth>
        <InputLabel>Language</InputLabel>
        <Select
          value={widget.language}
          label="Language"
          onChange={(e) => handleChange('language', e.target.value)}
        >
          {languages.map(lang => <MenuItem key={lang} value={lang}>{lang}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl size="small" fullWidth>
        <InputLabel>Workspaces</InputLabel>
        <Select
          multiple
          value={widget.workspaces}
          label="Workspaces"
          onChange={(e) => handleChange('workspaces', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
        >
          {workspacesList.map(ws => <MenuItem key={ws} value={ws}>{ws}</MenuItem>)}
        </Select>
      </FormControl>

      <Divider />

      <FormControlLabel
        control={<Switch checked={widget.active} onChange={(e) => handleChange('active', e.target.checked)} />}
        label="Active"
      />

      <Box>
        <Typography variant="caption" color="text.secondary">Access Level</Typography>
        <RadioGroup
          row
          value={widget.accessLevel}
          onChange={(e) => handleChange('accessLevel', e.target.value)}
        >
          <FormControlLabel value="Personal" control={<Radio size="small" />} label="Personal" />
          <FormControlLabel value="Global" control={<Radio size="small" />} label="Global" />
        </RadioGroup>
      </Box>
    </Box>
  );
};

export default PropertiesSidebar;
