import React, { Component, useMemo } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import sankey from 'highcharts/modules/sankey';
import heatmap from 'highcharts/modules/heatmap';
import more from 'highcharts/highcharts-more';
import funnel from 'highcharts/modules/funnel';
import accessibility from 'highcharts/modules/accessibility';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import WidgetSkeleton from './WidgetSkeleton';

// Helper to handle ESM/CJS module interop for Highcharts modules
function initializeHighchartsModule(mod: any, hc: typeof Highcharts) {
  const initializer = typeof mod === 'function' ? mod : (mod as any)?.default;
  if (initializer && typeof initializer === 'function') {
    initializer(hc);
  }
}

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  initializeHighchartsModule(sankey, Highcharts);
  initializeHighchartsModule(heatmap, Highcharts);
  initializeHighchartsModule(more, Highcharts);
  initializeHighchartsModule(funnel, Highcharts);
  initializeHighchartsModule(accessibility, Highcharts);
}

// Vite ESM Interop for HighchartsReact
const HighchartsReactComponent = (HighchartsReact as any)?.default || HighchartsReact;

interface WidgetRendererProps {
  type: string;
  loading?: boolean;
  data?: any;
}

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: string}> {
  state = { hasError: false, error: '' };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("WidgetRenderer Error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return <Box sx={{ p: 2, color: 'error.main' }}>Error: {this.state.error}</Box>;
    }
    return this.props.children;
  }
}

// --- Fallback hardcoded data (used when no mock data has been fetched yet) ---

const fallbackTableData = [
  { id: 1, finding: 'User passwords not expiring', risk: 'High', status: 'Open' },
  { id: 2, finding: 'Lack of MFA for admin accounts', risk: 'High', status: 'In Progress' },
  { id: 3, finding: 'Outdated server software', risk: 'Medium', status: 'Open' },
  { id: 4, finding: 'No firewall on development network', risk: 'Low', status: 'Closed' },
  { id: 5, finding: 'Excessive user permissions', risk: 'Medium', status: 'Open' },
];

const WidgetContent: React.FC<WidgetRendererProps> = ({ type, loading, data }) => {
  // --- Loading state: show skeleton ---
  if (loading) {
    return <WidgetSkeleton type={type} />;
  }

  // --- Metric widget ---
  if (type === 'metric') {
    const metricValue = data?.value ?? '42,000';
    const metricLabel = data?.label ?? 'Total Audits Completed';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h3" color="primary" fontWeight="bold">{metricValue}</Typography>
        <Typography variant="body2" color="text.secondary">{metricLabel}</Typography>
      </Box>
    );
  }

  // --- Table widget ---
  if (type === 'table') {
    const rows = data?.rows ?? fallbackTableData;
    return (
      <TableContainer component={Paper} sx={{ height: '100%' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Finding</TableCell>
              <TableCell>Risk</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.finding}</TableCell>
                <TableCell>{row.risk}</TableCell>
                <TableCell>{row.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  // --- Chart widgets ---
  const options: Highcharts.Options | null = useMemo(() => {
    let opt: Highcharts.Options = {
      credits: { enabled: false },
      chart: { animation: false },
      title: { text: undefined },
    };

    // If we have fetched data from the mock API, use it
    if (data) {
      const chartType = data.chartType || type;
      opt.chart = {
        ...opt.chart,
        type: chartType === 'radar' ? 'line' : chartType,
        ...(chartType === 'radar' ? { polar: true } : {}),
        ...(chartType === 'heatmap' ? { styledMode: false } : {}),
      };
      if (data.xAxis) opt.xAxis = data.xAxis;
      if (data.yAxis) opt.yAxis = data.yAxis;
      if (data.colorAxis) opt.colorAxis = data.colorAxis;
      opt.series = data.series;
    } else {
      // Fallback: hardcoded data (for widgets added before this feature)
      if (type === 'bar') {
        opt = { ...opt, chart: { type: 'column' }, series: [{ type: 'column', name: 'Audits', data: [12, 23, 15, 30] }] };
      } else if (type === 'pie') {
        opt = { ...opt, chart: { type: 'pie' }, series: [{ type: 'pie', name: 'Category', data: [{ name: 'Internal', y: 45 }, { name: 'External', y: 25 }, { name: 'Third Party', y: 30 }] }] };
      } else if (type === 'line') {
        opt = { ...opt, chart: { type: 'line' }, xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] }, series: [{ type: 'line', name: 'Trend', data: [10, 15, 8, 25, 30] }] };
      } else if (type === 'area') {
        opt = { ...opt, chart: { type: 'area' }, xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May'] }, series: [{ type: 'area', name: 'Coverage', data: [5, 10, 20, 22, 28] }] };
      } else if (type === 'scatter') {
        opt = { ...opt, chart: { type: 'scatter' }, series: [{ type: 'scatter', name: 'Observations', data: [[1, 1], [2, 5], [3, 2], [4, 8], [5, 4]] }] };
      } else if (type === 'heat') {
        opt = { ...opt, chart: { type: 'heatmap', styledMode: false }, colorAxis: { min: 0, minColor: '#FFFFFF', maxColor: '#1976d2' }, series: [{ type: 'heatmap', data: [[0, 0, 10], [0, 1, 19], [0, 2, 8], [1, 0, 24], [1, 1, 67], [1, 2, 43]], dataLabels: { enabled: true, color: '#000000' } }] };
      } else if (type === 'sankey') {
        opt = { ...opt, series: [{ type: 'sankey', keys: ['from', 'to', 'weight'], data: [['Brazil', 'Portugal', 5], ['Brazil', 'France', 1], ['Brazil', 'Spain', 1]] }] };
      } else if (type === 'radar') {
        opt = { ...opt, chart: { polar: true, type: 'line' }, xAxis: { categories: ['Sales', 'Marketing', 'Development', 'Support', 'Admin'], tickmarkPlacement: 'on', lineWidth: 0 }, yAxis: { gridLineInterpolation: 'polygon', lineWidth: 0, min: 0 }, series: [{ name: 'Budget', data: [43, 19, 60, 35, 17], pointPlacement: 'on' }, { name: 'Spending', data: [50, 39, 42, 31, 26], pointPlacement: 'on' }] };
      } else if (type === 'funnel') {
        opt = { ...opt, chart: { type: 'funnel' }, series: [{ name: 'Leads', data: [['Website Visits', 15654], ['Downloads', 4064], ['Contact Requests', 1987], ['Demos', 976], ['Sales', 351]]}] };
      }
    }

    if (!opt.series) return null;

    // IMPORTANT: Highcharts modifies the options object internally.
    // If we pass an object from Redux/Immer, it's frozen, causing "not extensible" errors.
    // We deep-clone the final options object before handing it to Highcharts.
    return structuredClone(opt);
  }, [type, data]);

  const containerProps = useMemo(() => ({ 
    style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as React.CSSProperties 
  }), []);

  if (!options) return null;

  return (
    <Box sx={{ position: 'absolute', top: 8, bottom: 8, left: 0, right: 0 }}>
      <HighchartsReactComponent 
        highcharts={Highcharts} 
        options={options} 
        containerProps={containerProps} 
      />
    </Box>
  );
};

const WidgetRenderer: React.FC<WidgetRendererProps> = (props) => (
  <ErrorBoundary>
    <WidgetContent {...props} />
  </ErrorBoundary>
);

export default WidgetRenderer;
