import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, ButtonGroup, Flex, Spinner, Text } from '@chakra-ui/react';
import Gantt from 'frappe-gantt';
import 'frappe-gantt/dist/frappe-gantt.css';
import {
  CollaborationGanttItem,
  collaborationService,
} from '../../services/collaboration.service';

import './GanttChart.css';

type ViewMode = 'Day' | 'Week' | 'Month';

interface GanttChartProps {
  conversationId: string;
  isAdmin: boolean;
  hasProposals: boolean;
}

const MS_PER_DAY = 86_400_000;

const statusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'approved') {
    return '#22c55e';
  }
  if (normalized === 'rejected') {
    return '#ef4444';
  }
  return '#9ca3af';
};

const statusClass = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === 'approved') {
    return 'gantt-approved';
  }
  if (normalized === 'rejected') {
    return 'gantt-rejected';
  }
  return 'gantt-draft';
};

const GanttChart = ({ conversationId, isAdmin, hasProposals }: GanttChartProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ganttRef = useRef<Gantt | null>(null);
  const epochRef = useRef<Date>(new Date());
  const metaRef = useRef<Map<string, CollaborationGanttItem>>(new Map());
  const pendingScheduleRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [items, setItems] = useState<CollaborationGanttItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('Week');
  const [error, setError] = useState('');

  const loadGantt = useCallback(async () => {
    if (!conversationId || !hasProposals) {
      setItems([]);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await collaborationService.getConversationGantt(conversationId);
      setItems(data);
    } catch (loadError) {
      console.error('Failed to load Gantt chart:', loadError);
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Gantt chart');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [conversationId, hasProposals]);

  useEffect(() => {
    void loadGantt();
  }, [loadGantt]);

  const dayToDate = useCallback((day: number) => {
    const date = new Date(epochRef.current);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + day);
    return date;
  }, []);

  const dateToSchedule = useCallback((start: Date, end: Date) => {
    const epoch = epochRef.current;
    epoch.setHours(0, 0, 0, 0);
    const startDay = Math.max(0, Math.round((start.getTime() - epoch.getTime()) / MS_PER_DAY));
    const estimatedDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / MS_PER_DAY));
    return { startDay, estimatedDays };
  }, []);

  const persistSchedule = useCallback(
  (proposalId: string, schedule: { startDay: number; estimatedDays: number }) => {
    if (!isAdmin || !conversationId) {
      return;
    }

    const existing = pendingScheduleRef.current.get(proposalId);
    if (existing) {
      clearTimeout(existing);
    }

    pendingScheduleRef.current.set(
      proposalId,
      setTimeout(() => {
        void collaborationService
          .updateProposalSchedule(proposalId, conversationId, schedule)
          .catch((updateError) => {
            console.error('Failed to update proposal schedule:', updateError);
            void loadGantt();
          });
        pendingScheduleRef.current.delete(proposalId);
      }, 300),
    );
  },
  [conversationId, isAdmin, loadGantt],
  );

  const frappeTasks = useMemo(() => {
    metaRef.current = new Map(items.map((item) => [item.id, item]));

    return items.map((item) => {
      const start = dayToDate(item.startDay);
      const end = dayToDate(item.startDay + item.estimatedDays);
      return {
        id: item.id,
        name: item.title,
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
        progress: 0,
        dependencies: item.dependsOn ?? [],
        custom_class: statusClass(item.status),
        color: statusColor(item.status),
      };
    });
  }, [items, dayToDate]);

  useEffect(() => {
    if (!containerRef.current || frappeTasks.length === 0) {
      ganttRef.current?.clear();
      ganttRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    containerRef.current.innerHTML = '';

    const chart = new Gantt(containerRef.current, frappeTasks as ConstructorParameters<typeof Gantt>[1], {
      view_mode: viewMode,
      bar_height: 28,
      padding: 16,
      readonly_dates: !isAdmin,
      readonly_progress: true,
      popup_on: 'click',
      popup: ({ task, set_title, set_subtitle, set_details }) => {
        const meta = metaRef.current.get(String(task.id));
        if (!meta) {
          return false;
        }

        set_title(meta.title);
        set_subtitle(meta.assignee);
        set_details(
          `Status: ${meta.status}\nEstimated days: ${meta.estimatedDays}`,
        );
      },
      on_date_change: (task, start, end) => {
        if (!isAdmin) {
          return;
        }

        const proposalId = String(task.id);
        const schedule = dateToSchedule(start, end);
        setItems((prev) =>
          prev.map((item) =>
            item.id === proposalId ? { ...item, ...schedule } : item,
          ),
        );
        persistSchedule(proposalId, schedule);
      },
    });

    ganttRef.current = chart;

    return () => {
      chart.clear();
      ganttRef.current = null;
    };
  }, [frappeTasks, viewMode, isAdmin, dateToSchedule, persistSchedule]);

  useEffect(
    () => () => {
      pendingScheduleRef.current.forEach((timer) => clearTimeout(timer));
      pendingScheduleRef.current.clear();
    },
    [],
  );

  if (!hasProposals) {
    return (
      <Flex align="center" justify="center" h="100%" minH="320px" px={6}>
        <Text color="gray.500" textAlign="center">
          Generate tasks first to see the Gantt view
        </Text>
      </Flex>
    );
  }

  if (loading) {
    return (
      <Flex align="center" justify="center" h="100%" minH="320px">
        <Spinner color="teal.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex align="center" justify="center" h="100%" minH="320px" px={6}>
        <Text color="red.500" textAlign="center">
          {error}
        </Text>
      </Flex>
    );
  }

  if (items.length === 0) {
    return (
      <Flex align="center" justify="center" h="100%" minH="320px" px={6}>
        <Text color="gray.500" textAlign="center">
          Generate tasks first to see the Gantt view
        </Text>
      </Flex>
    );
  }

  return (
    <Box h="100%" display="flex" flexDirection="column" minH={0}>
      <Flex justify="flex-end" px={4} py={3} borderBottom="1px solid" borderColor="gray.100">
        <ButtonGroup size="sm" isAttached variant="outline">
          {(['Day', 'Week', 'Month'] as ViewMode[]).map((mode) => (
            <Button
              key={mode}
              colorScheme={viewMode === mode ? 'teal' : 'gray'}
              variant={viewMode === mode ? 'solid' : 'outline'}
              onClick={() => setViewMode(mode)}
            >
              {mode}
            </Button>
          ))}
        </ButtonGroup>
      </Flex>
      <Box ref={containerRef} flex={1} minH="360px" overflow="auto" px={2} py={2} className="collaboration-gantt" />
    </Box>
  );
};

export default GanttChart;
