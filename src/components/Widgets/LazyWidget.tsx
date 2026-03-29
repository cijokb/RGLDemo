import React, { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import WidgetRenderer from './WidgetRenderer';
import WidgetSkeleton from './WidgetSkeleton';
import type { RootState } from '../../store/store';
import { setWidgetLoading, setWidgetData } from '../../store/dashboardSlice';
import { fetchWidgetData } from '../../services/mockApi';

interface LazyWidgetProps {
  widgetId: string;
  widgetType: string;
}

const LazyWidget: React.FC<LazyWidgetProps> = ({ widgetId, widgetType }) => {
  console.log(`Rendering LazyWidget: ${widgetId}`);
  const dispatch = useDispatch();
  const widget = useSelector((state: RootState) => state.dashboard.widgets[widgetId]);
  const widgetState = useSelector((state: RootState) => state.dashboard.widgetData[widgetId]);
  
  const isNonReport = widgetType === 'section_divider' || widgetType === 'landing_page';

  // rootMargin is 1200px: Content is MOUNTED if within 1200px of viewport
  // This ensures smooth scrolling even at high speeds and prevents skeletons from appearing too soon.
  const { ref, inView } = useInView({
    triggerOnce: false, 
    rootMargin: '1200px 0px',
  });

  // Stagger chart rendering so 20 Highcharts instances don't freeze the router transition
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    // Non-report widgets don't need data fetching
    if (isNonReport) return;

    if (inView) {
      // Small timeout allows the browser to paint the skeleton frame first so router transitions feel instant
      const deferTimer = setTimeout(() => {
        setIsChartReady(true);
      }, 50 + (Math.random() * 200)); 

      return () => clearTimeout(deferTimer);
    } else {
      setIsChartReady(false);
    }
  }, [inView, isNonReport]);

  useEffect(() => {
    if (isNonReport) return;

    // Only fetch if chart is conceptually ready to be viewed and data wasn't requested
    if (isChartReady && !widgetState) {
      const loadData = async () => {
        dispatch(setWidgetLoading(widgetId));
        try {
          const data = await fetchWidgetData(widgetId, widgetType, widget?.name);
          dispatch(setWidgetData({ id: widgetId, data }));
        } catch (error) {
          console.error(`Failed to fetch data for widget ${widgetId}:`, error);
        }
      };
      loadData();
    }
  }, [isChartReady, widgetId, widgetType, widgetState, dispatch, isNonReport, widget?.name]);

  return (
    <Box ref={ref} sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {isNonReport ? (
        <WidgetRenderer
          widgetId={widgetId}
          type={widgetType}
          backgroundColor={widget?.backgroundColor}
          backgroundImage={widget?.backgroundImage}
        />
      ) : isChartReady ? (
        <WidgetRenderer
          widgetId={widgetId}
          type={widgetType}
          loading={widgetState?.loading}
          data={widgetState?.data}
        />
      ) : (
        <WidgetSkeleton 
          type={widgetType} 
          isStatic={!!widgetState?.data} 
        />
      )}
    </Box>
  );
};

export default React.memo(LazyWidget);
