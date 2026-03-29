import React, { Component, useMemo, useCallback } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import sankey from 'highcharts/modules/sankey';
import heatmap from 'highcharts/modules/heatmap';
import more from 'highcharts/highcharts-more';
import funnel from 'highcharts/modules/funnel';
import drilldown from 'highcharts/modules/drilldown';
import accessibility from 'highcharts/modules/accessibility';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import WidgetSkeleton from './WidgetSkeleton';
import type { RootState } from '../../store/store';
import { updateWidgetUIState } from '../../store/dashboardSlice';

// Helper to handle ESM/CJS module interop for Highcharts modules
function initializeHighchartsModule(mod: any, hc: typeof Highcharts) {
  const initializer = typeof mod === 'function' ? mod : (mod as any)?.default;
  if (initializer && typeof initializer === 'function') {
    initializer(hc);
  }
}

// Initialize Highcharts modules
if (typeof Highcharts === 'object') {
  initializeHighchartsModule(more, Highcharts);
  initializeHighchartsModule(sankey, Highcharts);
  initializeHighchartsModule(heatmap, Highcharts);
  initializeHighchartsModule(funnel, Highcharts);
  initializeHighchartsModule(drilldown, Highcharts);
  initializeHighchartsModule(accessibility, Highcharts);
}

// Vite ESM Interop for HighchartsReact
const HighchartsReactComponent = (HighchartsReact as any)?.default || HighchartsReact;

interface WidgetRendererProps {
  widgetId: string;
  type: string;
  loading?: boolean;
  data?: any;
  backgroundColor?: string;
  backgroundImage?: string;
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

// --- Fallback hardcoded data ---

const fallbackTableData = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  finding: `Fallback Finding #${i + 1}`,
  risk: i % 3 === 0 ? 'High' : (i % 2 === 0 ? 'Medium' : 'Low'),
  status: i % 4 === 0 ? 'Closed' : 'Open'
}));

const EMPTY_UI_STATE = {};

const WidgetContent: React.FC<WidgetRendererProps> = ({ widgetId, type, loading, data, backgroundColor, backgroundImage }) => {
  const dispatch = useDispatch();
  
  // Select ONLY the state for this specific widgetId
  const uiState = useSelector((state: RootState) => state.dashboard.widgetUIState[widgetId] || EMPTY_UI_STATE);
  
  // --- Pagination Hook (Always defined at top level) ---
  const handleChangePage = useCallback((_: any, newPage: number) => {
    dispatch(updateWidgetUIState({ id: widgetId, state: { page: newPage } }));
  }, [dispatch, widgetId]);

  // --- Highcharts Options Hook (Always defined at top level) ---
  const options: Highcharts.Options | null = useMemo(() => {
    // Only calculate options if it's not a table/divider/metric
    if (type.startsWith('table') || type === 'section_divider' || type.startsWith('metric') || type === 'landing_page') {
      return null;
    }

    let opt: Highcharts.Options = {
      credits: { enabled: false },
      chart: { animation: false },
      title: { text: undefined },
    };

    if (data) {
      const chartType = data.chartType || type;
      opt.chart = {
        ...opt.chart,
        type: (chartType === 'radar' ? 'line' : chartType) as any,
        ...(chartType === 'radar' ? { polar: true } : {}),
        ...(chartType === 'heatmap' ? { styledMode: false } : {}),
        events: {
          drilldown: (e: any) => {
            dispatch(updateWidgetUIState({ id: widgetId, state: { drilldownId: e.point.drilldown } }));
          },
          drillup: () => {
            dispatch(updateWidgetUIState({ id: widgetId, state: { drilldownId: null } }));
          }
        }
      };
      // Deep clone data from Redux to prevent "object is not extensible" errors from Highcharts mutations
      const safeData = JSON.parse(JSON.stringify(data));

      if (safeData.xAxis) opt.xAxis = safeData.xAxis;
      if (safeData.yAxis) opt.yAxis = safeData.yAxis;
      if (safeData.colorAxis) opt.colorAxis = safeData.colorAxis;
      if (safeData.drilldown) opt.drilldown = safeData.drilldown;
      opt.series = safeData.series;

      // Persistence: Restore drilldown state if it exists
      if (uiState.drilldownId && safeData.drilldown?.series) {
        const subSeries = safeData.drilldown.series.find((s: any) => s.id === uiState.drilldownId);
        if (subSeries) {
          opt.series = [subSeries];
        }
      }
    } else {
      // Hardcoded fallback logic
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
    return opt;
  }, [type, data, widgetId, dispatch, uiState.drilldownId]);

  const containerProps = useMemo(() => ({ 
    style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as React.CSSProperties 
  }), []);

  // --- Rendering Logic ---

  if (loading && !data) {
    return <WidgetSkeleton type={type} />;
  }

  if (type === 'landing_page') {
    return (
      <Box sx={{ 
        height: '100%', 
        width: '100%',
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        bgcolor: backgroundColor || '#f0f0f0',
        position: 'relative'
      }}>
        {/* Semi-transparent overlay to ensure text readability */}
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.4)',
          zIndex: 0
        }} />
      </Box>
    );
  }

  if (type === 'section_divider') {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', px: 2, bgcolor: backgroundColor || '#ffffff' }} />
    );
  }

  if (type.startsWith('metric')) {
    const metricValue = data?.value ?? '42,000';
    const metricLabel = data?.label ?? 'Total Audits Completed';
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Typography variant="h3" color="primary" fontWeight="bold">{metricValue}</Typography>
        <Typography variant="body2" color="text.secondary">{metricLabel}</Typography>
      </Box>
    );
  }

  if (type.startsWith('table')) {
    const rows = data?.rows ?? fallbackTableData;
    const page = uiState.page || 0;
    const rowsPerPage = 5;
    const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>Finding</TableCell>
                <TableCell sx={{ py: 0.5 }}>Risk</TableCell>
                <TableCell sx={{ py: 0.5 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row: any) => (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ py: 0.5 }}>{row.finding}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>{row.risk}</TableCell>
                  <TableCell sx={{ py: 0.5 }}>{row.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          size="small"
          sx={{ 
            flexShrink: 0,
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            '& .MuiTablePagination-toolbar': {
              justifyContent: 'center',
              minHeight: '36px',
              px: 1,
              pr: 4 // Space for resize handle
            },
            '& .MuiTablePagination-spacer': {
              display: 'none'
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-select': {
              display: 'none'
            }
          }}
        />
      </Box>
    );
  }

  if (!options) return null;

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
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
