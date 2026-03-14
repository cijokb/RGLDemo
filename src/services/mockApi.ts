/**
 * Mock API Service
 * Simulates server-side data fetching for dashboard widgets.
 * Each widget type returns realistic chart/table/metric data
 * after a randomized delay (1–3 seconds).
 */

// Randomize delay between min and max ms
const randomDelay = (min = 3000, max = 4000): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// --- Mock Data Generators ---

const generateBarData = () => ({
  chartType: 'column',
  series: [
    {
      type: 'column' as const,
      name: 'Audits',
      data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 5),
    },
  ],
  xAxis: { categories: ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'] },
});

const generatePieData = () => {
  const categories = ['Internal', 'External', 'Third Party', 'Regulatory', 'Advisory'];
  return {
    chartType: 'pie',
    series: [
      {
        type: 'pie' as const,
        name: 'Category',
        data: categories.map((name) => ({
          name,
          y: Math.floor(Math.random() * 50) + 10,
        })),
      },
    ],
  };
};

const generateLineData = () => ({
  chartType: 'line',
  series: [
    {
      type: 'line' as const,
      name: 'Trend',
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 35) + 5),
    },
  ],
  xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
});

const generateAreaData = () => ({
  chartType: 'area',
  series: [
    {
      type: 'area' as const,
      name: 'Coverage',
      data: Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 5),
    },
  ],
  xAxis: { categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'] },
});

const generateScatterData = () => ({
  chartType: 'scatter',
  series: [
    {
      type: 'scatter' as const,
      name: 'Observations',
      data: Array.from({ length: 10 }, () => [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
      ]),
    },
  ],
});

const generateHeatData = () => ({
  chartType: 'heatmap',
  colorAxis: { min: 0, minColor: '#FFFFFF', maxColor: '#1976d2' },
  series: [
    {
      type: 'heatmap' as const,
      data: [
        [0, 0, Math.floor(Math.random() * 80)],
        [0, 1, Math.floor(Math.random() * 80)],
        [0, 2, Math.floor(Math.random() * 80)],
        [1, 0, Math.floor(Math.random() * 80)],
        [1, 1, Math.floor(Math.random() * 80)],
        [1, 2, Math.floor(Math.random() * 80)],
      ],
      dataLabels: { enabled: true, color: '#000000' },
    },
  ],
});

const generateRadarData = () => ({
  chartType: 'radar',
  chart: { polar: true, type: 'line' },
  xAxis: {
    categories: ['Sales', 'Marketing', 'Development', 'Support', 'Admin'],
    tickmarkPlacement: 'on',
    lineWidth: 0,
  },
  yAxis: {
    gridLineInterpolation: 'polygon',
    lineWidth: 0,
    min: 0,
  },
  series: [
    {
      name: 'Budget',
      data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 60) + 10),
      pointPlacement: 'on',
    },
    {
      name: 'Spending',
      data: Array.from({ length: 5 }, () => Math.floor(Math.random() * 60) + 10),
      pointPlacement: 'on',
    },
  ],
});

const generateFunnelData = () => ({
  chartType: 'funnel',
  series: [
    {
      name: 'Leads',
      data: [
        ['Website Visits', Math.floor(Math.random() * 10000) + 10000],
        ['Downloads', Math.floor(Math.random() * 5000) + 3000],
        ['Contact Requests', Math.floor(Math.random() * 2000) + 1000],
        ['Demos', Math.floor(Math.random() * 1000) + 500],
        ['Sales', Math.floor(Math.random() * 500) + 100],
      ],
    },
  ],
});

const generateTableData = () => {
  const findings = [
    'User passwords not expiring',
    'Lack of MFA for admin accounts',
    'Outdated server software',
    'No firewall on development network',
    'Excessive user permissions',
    'Unpatched critical vulnerability',
    'Default credentials in production',
    'Missing encryption at rest',
  ];
  const risks = ['High', 'Medium', 'Low', 'Critical'];
  const statuses = ['Open', 'In Progress', 'Closed', 'Under Review'];

  const count = Math.floor(Math.random() * 4) + 4; // 4–7 rows
  return {
    dataType: 'table',
    rows: Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      finding: findings[Math.floor(Math.random() * findings.length)],
      risk: risks[Math.floor(Math.random() * risks.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
    })),
  };
};

const generateMetricData = () => {
  const labels = [
    'Total Audits Completed',
    'Open Findings',
    'Risk Score',
    'Compliance Rate',
    'Active Controls',
  ];
  const value = Math.floor(Math.random() * 50000) + 1000;
  return {
    dataType: 'metric',
    value: value.toLocaleString(),
    label: labels[Math.floor(Math.random() * labels.length)],
  };
};

// --- Generator Map ---

const dataGenerators: Record<string, () => any> = {
  bar: generateBarData,
  pie: generatePieData,
  line: generateLineData,
  area: generateAreaData,
  scatter: generateScatterData,
  heat: generateHeatData,
  radar: generateRadarData,
  funnel: generateFunnelData,
  table: generateTableData,
  metric: generateMetricData,
};

// --- Public API ---

/**
 * Fetches mock widget data for a given widget type.
 * Simulates a network call with a randomized 1–3 second delay.
 *
 * @param _widgetId - The unique widget instance ID (for future use / caching)
 * @param widgetType - The widget type key (e.g. 'bar', 'pie', 'table')
 * @returns Promise resolving to mock data appropriate for the widget type
 */
export const fetchWidgetData = (
  _widgetId: string,
  widgetType: string
): Promise<any> => {
  return new Promise((resolve) => {
    const delay = randomDelay();
    setTimeout(() => {
      const generator = dataGenerators[widgetType];
      if (generator) {
        resolve(generator());
      } else {
        // Fallback: return a bar chart
        resolve(generateBarData());
      }
    }, delay);
  });
};
