import React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const axisProps = {
  fontSize: 12,
  stroke: '#718096',
};

const formatDayLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
  }).format(date);

const formatMonthDayLabel = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);

const getRecentDayLabels = (count: number, formatter: (date: Date) => string) => {
  const today = new Date();

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - index - 1));
    return formatter(date);
  });
};

const last7Days = getRecentDayLabels(7, formatDayLabel);
const last14Days = getRecentDayLabels(14, formatMonthDayLabel);

// TODO: replace with real API data.
const taskCompletionTrendData = [
  { day: last7Days[0], completed: 8, 'in-progress': 6, blocked: 2 },
  { day: last7Days[1], completed: 10, 'in-progress': 7, blocked: 1 },
  { day: last7Days[2], completed: 9, 'in-progress': 8, blocked: 2 },
  { day: last7Days[3], completed: 13, 'in-progress': 5, blocked: 1 },
  { day: last7Days[4], completed: 12, 'in-progress': 6, blocked: 3 },
  { day: last7Days[5], completed: 15, 'in-progress': 4, blocked: 2 },
  { day: last7Days[6], completed: 14, 'in-progress': 5, blocked: 1 },
];

// TODO: replace with real API data.
const alertVolumeData = [
  { day: last14Days[0], info: 3, warning: 1, critical: 0 },
  { day: last14Days[1], info: 2, warning: 2, critical: 1 },
  { day: last14Days[2], info: 4, warning: 2, critical: 0 },
  { day: last14Days[3], info: 3, warning: 3, critical: 1 },
  { day: last14Days[4], info: 5, warning: 2, critical: 1 },
  { day: last14Days[5], info: 2, warning: 2, critical: 0 },
  { day: last14Days[6], info: 4, warning: 1, critical: 0 },
  { day: last14Days[7], info: 3, warning: 2, critical: 1 },
  { day: last14Days[8], info: 5, warning: 2, critical: 1 },
  { day: last14Days[9], info: 4, warning: 3, critical: 0 },
  { day: last14Days[10], info: 3, warning: 2, critical: 1 },
  { day: last14Days[11], info: 4, warning: 1, critical: 0 },
  { day: last14Days[12], info: 2, warning: 2, critical: 1 },
  { day: last14Days[13], info: 3, warning: 1, critical: 0 },
];

// TODO: replace with real API data.
const hiringFunnelData = [
  { stage: 'Applied', value: 96 },
  { stage: 'Screened', value: 64 },
  { stage: 'Interviewed', value: 31 },
  { stage: 'Offered', value: 12 },
  { stage: 'Accepted', value: 7 },
];

// TODO: replace with real API data.
const projectBurndownData = [
  { week: 'Week 1', Atlas: 48, Nova: 36, Orion: 27, Helix: 18 },
  { week: 'Week 2', Atlas: 39, Nova: 29, Orion: 21, Helix: 15 },
  { week: 'Week 3', Atlas: 28, Nova: 22, Orion: 16, Helix: 10 },
  { week: 'Week 4', Atlas: 16, Nova: 14, Orion: 9, Helix: 5 },
];

export const TaskCompletionTrendChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={220}>
    <LineChart data={taskCompletionTrendData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="day" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="completed" stroke="#38A169" strokeWidth={2} dot={{ r: 3 }} />
      <Line type="monotone" dataKey="in-progress" stroke="#3182CE" strokeWidth={2} dot={{ r: 3 }} />
      <Line type="monotone" dataKey="blocked" stroke="#E53E3E" strokeWidth={2} dot={{ r: 3 }} />
    </LineChart>
  </ResponsiveContainer>
);

export const AlertVolumeChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={alertVolumeData}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="day" {...axisProps} minTickGap={12} />
      <YAxis {...axisProps} />
      <Tooltip />
      <Legend />
      <Bar dataKey="info" stackId="alerts" fill="#3182CE" radius={[4, 4, 0, 0]} />
      <Bar dataKey="warning" stackId="alerts" fill="#D69E2E" radius={[4, 4, 0, 0]} />
      <Bar dataKey="critical" stackId="alerts" fill="#E53E3E" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const HiringFunnelChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={220}>
    <BarChart data={hiringFunnelData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
      <XAxis type="number" {...axisProps} />
      <YAxis type="category" dataKey="stage" width={88} {...axisProps} />
      <Tooltip />
      <Bar dataKey="value" fill="#319795" radius={[0, 4, 4, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export const ProjectBurndownChart: React.FC = () => (
  <ResponsiveContainer width="100%" height={220}>
    <AreaChart data={projectBurndownData}>
      <defs>
        <linearGradient id="atlasFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2B6CB0" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#2B6CB0" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="novaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2F855A" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#2F855A" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="orionFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#D69E2E" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#D69E2E" stopOpacity={0.05} />
        </linearGradient>
        <linearGradient id="helixFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#805AD5" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#805AD5" stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
      <XAxis dataKey="week" {...axisProps} />
      <YAxis {...axisProps} />
      <Tooltip />
      <Legend />
      <Area type="monotone" dataKey="Atlas" stroke="#2B6CB0" fill="url(#atlasFill)" strokeWidth={2} />
      <Area type="monotone" dataKey="Nova" stroke="#2F855A" fill="url(#novaFill)" strokeWidth={2} />
      <Area type="monotone" dataKey="Orion" stroke="#D69E2E" fill="url(#orionFill)" strokeWidth={2} />
      <Area type="monotone" dataKey="Helix" stroke="#805AD5" fill="url(#helixFill)" strokeWidth={2} />
    </AreaChart>
  </ResponsiveContainer>
);
