import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface WidgetSkeletonProps {
  type: string;
}

/**
 * Chart Skeleton — rectangular block mimicking a chart area with axis-label lines.
 */
const ChartSkeleton: React.FC = () => (
  <Box sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
    {/* Chart area */}
    <Skeleton
      variant="rectangular"
      animation="wave"
      sx={{ flexGrow: 1, borderRadius: 1, minHeight: 80 }}
    />
    {/* Axis labels */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
      <Skeleton variant="text" width={30} height={16} animation="wave" />
      <Skeleton variant="text" width={30} height={16} animation="wave" />
      <Skeleton variant="text" width={30} height={16} animation="wave" />
      <Skeleton variant="text" width={30} height={16} animation="wave" />
    </Box>
    {/* Legend line */}
    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5 }}>
      <Skeleton variant="circular" width={12} height={12} animation="wave" />
      <Skeleton variant="text" width={60} height={14} animation="wave" />
    </Box>
  </Box>
);

/**
 * Table Skeleton — header row + several data rows.
 */
const TableSkeleton: React.FC = () => (
  <Box sx={{ p: 1.5, height: '100%', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
    {/* Header row */}
    <Box sx={{ display: 'flex', gap: 1, mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="text" width="40%" height={20} animation="wave" />
      <Skeleton variant="text" width="25%" height={20} animation="wave" />
      <Skeleton variant="text" width="25%" height={20} animation="wave" />
    </Box>
    {/* Data rows */}
    {[0, 1, 2, 3, 4].map((i) => (
      <Box key={i} sx={{ display: 'flex', gap: 1, py: 0.5 }}>
        <Skeleton variant="text" width="40%" height={18} animation="wave" />
        <Skeleton variant="text" width="25%" height={18} animation="wave" />
        <Skeleton variant="text" width="25%" height={18} animation="wave" />
      </Box>
    ))}
  </Box>
);

/**
 * Metric Skeleton — centered big number + label.
 */
const MetricSkeleton: React.FC = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      gap: 1.5,
    }}
  >
    <Skeleton variant="rounded" width={140} height={48} animation="wave" />
    <Skeleton variant="text" width={180} height={20} animation="wave" />
  </Box>
);

/**
 * WidgetSkeleton — picks the appropriate skeleton layout for the widget type.
 */
const WidgetSkeleton: React.FC<WidgetSkeletonProps> = ({ type }) => {
  if (type === 'metric') return <MetricSkeleton />;
  if (type === 'table') return <TableSkeleton />;
  return <ChartSkeleton />;
};

export default WidgetSkeleton;
