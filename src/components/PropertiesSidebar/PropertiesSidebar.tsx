import React from 'react';
import { Box, Typography, TextField, Divider } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { updateWidgetProperties, updateDashboardMetadata } from '../../store/dashboardSlice';

const PropertiesSidebar: React.FC = () => {

  const dispatch = useDispatch();
  const activeWidgetId = useSelector((state: RootState) => state.dashboard.activeWidgetId);
  const widget = useSelector((state: RootState) => activeWidgetId ? state.dashboard.widgets[activeWidgetId] : null);
  const name = useSelector((state: RootState) => state.dashboard.name);
  const description = useSelector((state: RootState) => state.dashboard.description);

  if (!activeWidgetId || !widget) {
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

  const isDivider = widget.type === 'section_divider';
  const isLandingPage = widget.type === 'landing_page';
  const isNonReport = isDivider || isLandingPage;

  const handleChange = (field: string, value: string | boolean) => {
    dispatch(updateWidgetProperties({ id: activeWidgetId, properties: { [field]: value } }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Typography variant="subtitle2" color="primary" fontWeight="bold">
        {widget.type.toUpperCase().replace('_', ' ')} COMPONENTS
      </Typography>

      <TextField
        label={isNonReport ? "Title (Optional)" : "Name"}
        size="small"
        fullWidth
        value={widget.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      {isLandingPage && (
        <TextField
          label="Background Image URL"
          size="small"
          fullWidth
          value={widget.backgroundImage || ''}
          onChange={(e) => handleChange('backgroundImage', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
      )}

      {isDivider && (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Background Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <input 
                type="color" 
                value={widget.backgroundColor || '#ffffff'} 
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              />
              <TextField
                size="small"
                value={widget.backgroundColor || '#ffffff'}
                onChange={(e) => handleChange('backgroundColor', e.target.value)}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="caption" color="text.secondary">Title Color</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <input 
                type="color" 
                value={widget.titleColor || '#000000'} 
                onChange={(e) => handleChange('titleColor', e.target.value)}
                style={{ width: '40px', height: '40px', padding: 0, border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
              />
              <TextField
                size="small"
                value={widget.titleColor || '#000000'}
                onChange={(e) => handleChange('titleColor', e.target.value)}
                sx={{ flexGrow: 1 }}
              />
            </Box>
          </Box>
        </>
      )}

      {!isNonReport && (
        <>
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
        </>
      )}
    </Box>
  );
};

export default React.memo(PropertiesSidebar);
