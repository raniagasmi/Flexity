import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Fade,
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  IconButton,
  Progress,
  Skeleton,
  SkeletonText,
  SimpleGrid,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
  Tooltip,
  Avatar,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { IconBellOff, IconClipboardList, IconFolder } from '@tabler/icons-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { dashboardService } from '../../services/dashboard.service';
import type { EmployeeDashboardResponse } from '../../types/dashboard';
import { AlertsPanel } from '../admin/AlertsPanel';
import { Board } from '../tasks/Board';
import { authService } from '../../services/auth.service';
import { useTimeTracking } from '../../hooks/useAdminMetrics';
import MyWeekCalendar from './MyWeekCalendar';
import { collaborationService } from '../../services/collaboration.service';
import TaskActionPanel, { TaskActionComment, TaskDecision } from '../tasks/TaskActionPanel';
import { Task as TaskType } from '../../types/task';

export type EmployeeDashboardSection = 'tasks' | 'projects' | 'calendar';
export type EmployeeTaskView = 'board' | 'alerts';

interface EmployeeDashboardProps {
  initialSection?: EmployeeDashboardSection;
  initialTaskView?: EmployeeTaskView;
  focusBoard?: boolean;
  mobileNavTrigger?: React.ReactNode;
}

type EmptyStateProps = {
  icon: typeof IconClipboardList;
  title: string;
  buttonLabel?: string;
  onAction?: () => void;
};

const EmptyState = ({ icon: Icon, title, buttonLabel, onAction }: EmptyStateProps) => (
  <VStack
    spacing={3}
    py={12}
    px={6}
    borderWidth={1}
    borderStyle="dashed"
    borderColor="gray.200"
    borderRadius="xl"
    color="gray.500"
  >
    <Icon size={40} color="var(--chakra-colors-gray-300)" />
    <Text fontSize="md" color="gray.600">
      {title}
    </Text>
    {buttonLabel ? (
      <Button size="sm" colorScheme="teal" variant="outline" onClick={onAction}>
        {buttonLabel}
      </Button>
    ) : null}
  </VStack>
);

export const EmployeeDashboard = ({
  initialSection = 'tasks',
  initialTaskView = 'board',
  focusBoard = false,
  mobileNavTrigger,
}: EmployeeDashboardProps) => {
  const currentUserId = authService.getCurrentUser()?.id;
  const { currentStatus, focusTime, togglePause } = useTimeTracking(currentUserId);
  const toast = useToast();
  const actionPanel = useDisclosure();
  const boardSectionRef = useRef<HTMLDivElement | null>(null);

  const [data, setData] = useState<EmployeeDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentSection, setCurrentSection] = useState<EmployeeDashboardSection>(initialSection);
  const [currentTaskView, setCurrentTaskView] = useState<EmployeeTaskView>(initialTaskView);
  const [selectedTask, setSelectedTask] = useState<TaskType | null>(null);
  const [taskComments, setTaskComments] = useState<TaskActionComment[]>([]);
  const [taskDecision, setTaskDecision] = useState<TaskDecision | null>(null);

  const actionStorageKey = (taskId: string) => `task-action:${taskId}`;

  const loadTaskActionState = (taskId: string) => {
    if (typeof window === 'undefined') {
      return { comments: [] as TaskActionComment[], decision: null as TaskDecision | null };
    }

    try {
      const raw = window.localStorage.getItem(actionStorageKey(taskId));
      if (!raw) {
        return { comments: [] as TaskActionComment[], decision: null as TaskDecision | null };
      }

      const parsed = JSON.parse(raw) as { comments?: TaskActionComment[]; decision?: TaskDecision | null };
      return {
        comments: Array.isArray(parsed.comments) ? parsed.comments : [],
        decision: parsed.decision === 'accepted' || parsed.decision === 'declined' ? parsed.decision : null,
      };
    } catch {
      return { comments: [] as TaskActionComment[], decision: null as TaskDecision | null };
    }
  };

  const persistTaskActionState = (taskId: string, comments: TaskActionComment[], decision: TaskDecision | null) => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(actionStorageKey(taskId), JSON.stringify({ comments, decision }));
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await dashboardService.getMyDashboard();
      setData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  useEffect(() => {
    setCurrentSection(focusBoard ? 'tasks' : initialSection);
  }, [focusBoard, initialSection]);

  useEffect(() => {
    setCurrentTaskView(focusBoard ? 'board' : initialTaskView);
  }, [focusBoard, initialTaskView]);

  useEffect(() => {
    if (!focusBoard || currentSection !== 'tasks' || currentTaskView !== 'board' || !data) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      boardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [focusBoard, currentSection, currentTaskView, data]);

  const projectInsights = useMemo(() => {
    if (!data) {
      return [] as Array<{
        id: string;
        name: string;
        tasks: TaskType[];
        total: number;
        done: number;
        inProgress: number;
        todo: number;
        highPriority: number;
        completionRate: number;
        dueSoon: number;
        colleagues: Array<{ id: string; name: string; avatarUrl?: string }>;
      }>;
    }

    const normalizeId = (value?: string | null) => value?.trim() || null;
    const getTaskProjectKey = (task: TaskType) => normalizeId(task.projectId) ?? normalizeId(task.conversationId);
    const projects = data.projects ?? [];
    const tasksByProjectId = new Map<string, TaskType[]>();

    for (const task of data.tasks) {
      const key = getTaskProjectKey(task) ?? '__other__';
      const current = tasksByProjectId.get(key) ?? [];
      current.push(task);
      tasksByProjectId.set(key, current);
    }

    const buildProjectInsight = (id: string, name: string, tasks: TaskType[]) => {
      const total = tasks.length;
      const done = tasks.filter((task) => task.status === 'DONE').length;
      const inProgress = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
      const todo = tasks.filter((task) => task.status === 'TODO').length;
      const highPriority = tasks.filter((task) => task.priority === 'HIGH').length;

      const dueSoon = tasks.filter((task) => {
        if (!task.dueDate) {
          return false;
        }
        const due = new Date(task.dueDate).getTime();
        if (Number.isNaN(due)) {
          return false;
        }
        const now = Date.now();
        const inThreeDays = now + 3 * 24 * 60 * 60 * 1000;
        return due >= now && due <= inThreeDays;
      }).length;

      const colleagueIds = Array.from(new Set(tasks.map((task) => task.assignedTo).filter(Boolean)));
      const colleagues = data.employees
        .filter((employee) => colleagueIds.includes(employee.id))
        .map((employee) => ({
          id: employee.id,
          name: employee.name,
          avatarUrl: employee.avatarUrl,
        }));

      return {
        id,
        name,
        tasks,
        total,
        done,
        inProgress,
        todo,
        highPriority,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
        dueSoon,
        colleagues,
      };
    };

    const insights = projects.map((project) =>
      buildProjectInsight(project.id, project.name, tasksByProjectId.get(project.id) ?? []),
    );

    const otherTasks = tasksByProjectId.get('__other__') ?? [];
    if (otherTasks.length > 0) {
      insights.push(buildProjectInsight('__other__', 'Other work', otherTasks));
    }

    const knownProjectIds = new Set(projects.map((project) => project.id));
    for (const [projectId, tasks] of tasksByProjectId.entries()) {
      if (projectId === '__other__' || knownProjectIds.has(projectId)) {
        continue;
      }

      insights.push(buildProjectInsight(projectId, `Unknown project`, tasks));
    }

    return insights;
  }, [data]);

  const projectTotals = useMemo(() => {
    const totalTasks = projectInsights.reduce((sum, project) => sum + project.total, 0);
    const completedTasks = projectInsights.reduce((sum, project) => sum + project.done, 0);
    const dueSoonTasks = projectInsights.reduce((sum, project) => sum + project.dueSoon, 0);

    return {
      totalProjects: projectInsights.length,
      totalTasks,
      completedTasks,
      dueSoonTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [projectInsights]);

  const personalStats = useMemo(() => {
    const tasks = data?.tasks ?? [];
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const startOfWeek = new Date(startOfToday);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7;
    startOfWeek.setDate(startOfWeek.getDate() - diffToMonday);

    const startOfPreviousWeek = new Date(startOfWeek);
    startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
    const endOfPreviousWeek = new Date(startOfWeek);

    const sameDayLastWeekStart = new Date(startOfToday);
    sameDayLastWeekStart.setDate(sameDayLastWeekStart.getDate() - 7);
    const sameDayLastWeekEnd = new Date(endOfToday);
    sameDayLastWeekEnd.setDate(sameDayLastWeekEnd.getDate() - 7);

    const isWithinRange = (value: Date | string | undefined, start: Date, end: Date) => {
      if (!value) {
        return false;
      }

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        return false;
      }

      return date >= start && date < end;
    };

    const completedThisWeek = tasks.filter(
      (task) => task.status === 'DONE' && isWithinRange(task.updatedAt, startOfWeek, endOfToday),
    ).length;
    const completedLastWeek = tasks.filter(
      (task) => task.status === 'DONE' && isWithinRange(task.updatedAt, startOfPreviousWeek, endOfPreviousWeek),
    ).length;
    const dueToday = tasks.filter((task) => isWithinRange(task.dueDate, startOfToday, endOfToday)).length;
    const dueSameDayLastWeek = tasks.filter((task) =>
      isWithinRange(task.dueDate, sameDayLastWeekStart, sameDayLastWeekEnd),
    ).length;

    // TODO: replace with real API data.
    const focusHoursLogged = focusTime > 0 ? Number((focusTime / 60).toFixed(1)) : 12.5;
    // TODO: replace with real API data.
    const focusHoursLastWeek = 10.5;

    return [
      {
        label: 'Tasks completed this week',
        value: completedThisWeek,
        suffix: '',
        delta: completedThisWeek - completedLastWeek,
      },
      {
        label: 'Tasks due today',
        value: dueToday,
        suffix: '',
        delta: dueToday - dueSameDayLastWeek,
      },
      {
        label: 'Focus hours logged',
        value: focusHoursLogged,
        suffix: 'h',
        delta: Number((focusHoursLogged - focusHoursLastWeek).toFixed(1)),
      },
    ];
  }, [data, focusTime]);

  const completionSparklineData = useMemo(() => {
    // TODO: replace with real API data.
    return [
      { day: 'Sat', completed: 1 },
      { day: 'Sun', completed: 2 },
      { day: 'Mon', completed: 3 },
      { day: 'Tue', completed: 2 },
      { day: 'Wed', completed: 4 },
      { day: 'Thu', completed: 3 },
      { day: 'Fri', completed: 5 },
    ];
  }, []);

  const unresolvedAlertsCount = data?.alerts.filter((alert) => !alert.isResolved).length ?? 0;

  const handleTaskSelect = (task: TaskType) => {
    setSelectedTask(task);
    const nextState = loadTaskActionState(task.id);
    setTaskComments(nextState.comments);
    setTaskDecision(nextState.decision);
    actionPanel.onOpen();
  };

  const closeTaskActionPanel = () => {
    actionPanel.onClose();
    setSelectedTask(null);
    setTaskComments([]);
    setTaskDecision(null);
  };

  const sendLinkedConversationMessage = async (content: string) => {
    if (!selectedTask?.conversationId) {
      return;
    }

    try {
      await collaborationService.sendMessage(selectedTask.conversationId, content);
    } catch (error) {
      console.error('Failed to share task note to collaboration thread:', error);
      toast({
        title: 'Saved locally',
        description: 'The note could not be shared to the linked collaboration thread.',
        status: 'warning',
        duration: 3500,
        isClosable: true,
      });
    }
  };

  const handleAddComment = async (content: string) => {
    if (!selectedTask) {
      return;
    }

    const nextComments = [
      ...taskComments,
      {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${taskComments.length}`,
        content,
        createdAt: new Date().toISOString(),
      },
    ];

    setTaskComments(nextComments);
    persistTaskActionState(selectedTask.id, nextComments, taskDecision);
    await sendLinkedConversationMessage(`Task comment: ${content}`);
    toast({
      title: 'Comment added',
      status: 'success',
      duration: 2200,
      isClosable: true,
    });
  };

  const handleSetDecision = async (decision: TaskDecision) => {
    if (!selectedTask) {
      return;
    }

    setTaskDecision(decision);
    persistTaskActionState(selectedTask.id, taskComments, decision);
    await sendLinkedConversationMessage(
      decision === 'accepted'
        ? `Task accepted: ${selectedTask.title}`
        : `Task declined: ${selectedTask.title}`,
    );

    toast({
      title: decision === 'accepted' ? 'Task accepted' : 'Task declined',
      status: decision === 'accepted' ? 'success' : 'info',
      duration: 2200,
      isClosable: true,
    });
  };

  if (error) {
    return (
      <Box bg="red.50" p={4} borderRadius="md">
        <Text color="red.700">Failed to load dashboard: {error}</Text>
        <Button mt={2} colorScheme="red" size="sm" onClick={fetchData}>
          Retry
        </Button>
      </Box>
    );
  }

  const renderMetricCard = (key: string, label: string, value?: string | number, footer?: React.ReactNode) => (
    <Box key={key} borderWidth={1} borderColor="gray.100" borderRadius="xl" px={4} py={3} bg="gray.50">
      {isLoading ? (
        <Stack spacing={3}>
          <SkeletonText noOfLines={1} width="60%" />
          <Skeleton height="40px" width="80px" />
          {footer ? <SkeletonText noOfLines={1} width="50%" /> : null}
        </Stack>
      ) : (
        <>
          <Text fontSize="13px" color="gray.500" mb={2}>
            {label}
          </Text>
          <Text fontSize="28px" fontWeight="500" color="gray.900" lineHeight="1.1">
            {value}
          </Text>
          {footer}
        </>
      )}
    </Box>
  );

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <HStack align="start" spacing={3}>
          {mobileNavTrigger}
          <VStack align="start" spacing={1}>
            <Heading size="lg">My Dashboard</Heading>
            <Text fontSize="sm" color="gray.600">
              Projects, teammates, alerts, and tasks scoped to your assignments
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={2}>
          <Button
            size="sm"
            colorScheme={currentStatus === 'ONLINE' ? 'green' : 'orange'}
            onClick={togglePause}
          >
            {currentStatus === 'PAUSE' ? 'Resume' : 'Pause'}
          </Button>
          <IconButton
            aria-label="Refresh employee dashboard"
            icon={<RepeatIcon />}
            size="sm"
            onClick={fetchData}
            isLoading={isLoading}
          />
        </HStack>
      </Flex>

      {(isLoading || data) && (
        <Box bg="white" borderRadius="2xl" boxShadow="0 8px 24px rgba(0, 0, 0, 0.08)" overflow="hidden">
          {currentSection === 'tasks' && (
            <Box px={6} py={5} borderBottomWidth="1px" borderColor="gray.100">
              <SimpleGrid columns={{ base: 1, xl: 4 }} spacing={4} alignItems="stretch">
                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} gridColumn={{ xl: 'span 3' }}>
                  {personalStats.map((stat) => {
                    const isPositive = stat.delta >= 0;
                    const deltaLabel = `${isPositive ? '↑' : '↓'} ${Math.abs(stat.delta)} vs last week`;

                    return renderMetricCard(
                      stat.label,
                      stat.label,
                      `${stat.value}${stat.suffix}`,
                      <Text mt={2} fontSize="sm" color={isPositive ? 'green.500' : 'red.500'}>
                        {deltaLabel}
                      </Text>,
                    );
                  })}
                </SimpleGrid>

                <Box borderWidth={1} borderColor="gray.100" borderRadius="xl" px={4} py={3} bg="gray.50">
                  {isLoading ? (
                    <Stack spacing={3}>
                      <SkeletonText noOfLines={1} width="60%" />
                      <Skeleton height="80px" />
                    </Stack>
                  ) : (
                    <>
                      <Text fontSize="13px" color="gray.500" mb={2}>
                        Completion trend
                      </Text>
                      <ResponsiveContainer width="100%" height={80}>
                        <AreaChart data={completionSparklineData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="employeeCompletionSparkline" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#319795" stopOpacity={0.28} />
                              <stop offset="95%" stopColor="#319795" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <RechartsTooltip
                            cursor={false}
                            contentStyle={{ border: 'none', borderRadius: '12px', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)' }}
                          />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            stroke="#319795"
                            strokeWidth={2}
                            fill="url(#employeeCompletionSparkline)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </>
                  )}
                </Box>
              </SimpleGrid>
            </Box>
          )}

          {currentSection === 'tasks' && (
            <Box px={6} py={4} bg="linear-gradient(135deg, rgba(16, 185, 129, 0.02), rgba(59, 130, 246, 0.02))" borderBottomWidth="2px" borderColor="gray.100">
              <HStack spacing={4} align="center">
                <Button variant={currentTaskView === 'board' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setCurrentTaskView('board')}>
                  Tasks
                </Button>

                <Button variant={currentTaskView === 'alerts' ? 'solid' : 'ghost'} colorScheme="teal" onClick={() => setCurrentTaskView('alerts')}>
                  Alerts
                  {unresolvedAlertsCount > 0 && (
                    <Badge ml={2} colorScheme="red" borderRadius="full">
                      {unresolvedAlertsCount}
                    </Badge>
                  )}
                </Button>
              </HStack>
            </Box>
          )}

          <Box p={6}>
            {currentSection === 'tasks' && currentTaskView === 'board' && (
              <Fade in={true}>
                {isLoading ? (
                  <Stack spacing={4}>
                    <Skeleton height="120px" borderRadius="xl" />
                    <Skeleton height="120px" borderRadius="xl" />
                  </Stack>
                ) : (
                  <Stack spacing={4} ref={boardSectionRef}>
                    {data?.tasks.length === 0 && (
                      <Alert status="info" borderRadius="xl" bg="teal.50" borderWidth={1} borderColor="teal.100">
                        <AlertIcon color="teal.500" />
                        <Box>
                          <AlertTitle fontSize="sm">No tasks assigned yet</AlertTitle>
                          <AlertDescription fontSize="sm">
                            Use the + on any column to create a task, or wait for an admin to assign one to you.
                          </AlertDescription>
                        </Box>
                      </Alert>
                    )}
                    <Board
                      showControls={false}
                      showTaskActionPanel={false}
                      onTaskSelect={handleTaskSelect}
                      onTasksChanged={fetchData}
                    />
                  </Stack>
                )}
              </Fade>
            )}

            {currentSection === 'tasks' && currentTaskView === 'alerts' && (
              <Fade in={true}>
                <Box>
                  {isLoading ? (
                    <Stack spacing={4}>
                      <Skeleton height="96px" borderRadius="xl" />
                      <Skeleton height="96px" borderRadius="xl" />
                    </Stack>
                  ) : data?.alerts.length === 0 ? (
                    <EmptyState icon={IconBellOff} title="You're all caught up" />
                  ) : (
                    <AlertsPanel alerts={data.alerts} />
                  )}
                </Box>
              </Fade>
            )}

            {currentSection === 'calendar' && (
              <Fade in={true}>
                <Box bg="white" borderRadius="2xl" boxShadow="0 12px 30px rgba(15, 23, 42, 0.06)" p={6}>
                  <Heading size="md" color="#0f172a" mb={2} fontWeight="700">
                    My Week Calendar
                  </Heading>
                  <Text color="gray.600" mb={4}>
                    Calendar-based weekly planning. Drag tasks between days to rebalance workload and keep capacity under control.
                  </Text>
                  {isLoading ? <Skeleton height="360px" borderRadius="xl" /> : <MyWeekCalendar tasks={data?.tasks ?? []} onTaskSelect={handleTaskSelect} />}
                </Box>
              </Fade>
            )}

            {currentSection === 'projects' && (
              <Fade in={true}>
                <Box bg="white" borderRadius="2xl" boxShadow="0 12px 30px rgba(15, 23, 42, 0.06)" p={6}>
                  <Heading size="md" mb={2} color="#0f172a">My Projects</Heading>
                  <Text color="gray.600" mb={5}>
                    Portfolio overview with delivery health, workload, and team context.
                  </Text>

                  <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4} mb={5}>
                    {renderMetricCard('Projects', 'Projects', projectTotals.totalProjects)}
                    {renderMetricCard('Tracked Tasks', 'Tracked Tasks', projectTotals.totalTasks)}
                    {renderMetricCard('Completion', 'Completion', `${projectTotals.completionRate}%`)}
                    {renderMetricCard('Due Soon (3d)', 'Due Soon (3d)', projectTotals.dueSoonTasks)}
                  </SimpleGrid>

                  {isLoading ? (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                      {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={`project-card-skeleton-${index}`} height="120px" borderRadius="xl" />
                      ))}
                    </SimpleGrid>
                  ) : projectInsights.length === 0 ? (
                    <EmptyState
                      icon={IconFolder}
                      title="No projects assigned"
                      buttonLabel="Browse projects"
                      onAction={() => {}}
                    />
                  ) : (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
                      {projectInsights.map((project) => (
                        <Box key={project.id} borderWidth={1} borderColor="gray.100" borderRadius="xl" p={5}>
                          <Flex justify="space-between" align="center" mb={2}>
                            <Heading size="sm">{project.name}</Heading>
                            <Badge colorScheme={project.completionRate >= 75 ? 'green' : project.completionRate >= 40 ? 'yellow' : 'orange'}>
                              {project.completionRate}% complete
                            </Badge>
                          </Flex>

                          <Progress value={project.completionRate} size="sm" borderRadius="full" colorScheme="teal" mb={4} />

                          <SimpleGrid columns={4} spacing={3} mb={4}>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Total</Text>
                              <Text fontWeight="700">{project.total}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">Done</Text>
                              <Text fontWeight="700">{project.done}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">In Progress</Text>
                              <Text fontWeight="700">{project.inProgress}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" color="gray.500">To Do</Text>
                              <Text fontWeight="700">{project.todo}</Text>
                            </Box>
                          </SimpleGrid>

                          <HStack spacing={2} mb={3} wrap="wrap">
                            <Badge colorScheme={project.highPriority > 0 ? 'red' : 'gray'}>
                              High Priority: {project.highPriority}
                            </Badge>
                            <Badge colorScheme={project.dueSoon > 0 ? 'orange' : 'gray'}>
                              Due Soon: {project.dueSoon}
                            </Badge>
                          </HStack>

                          <Text fontSize="xs" color="gray.500" mb={2}>Teammates</Text>
                          {project.colleagues.length > 0 ? (
                            <Tooltip label={project.colleagues.map((colleague) => colleague.name).join(', ')} placement="top" hasArrow>
                              <Avatar
                                size="sm"
                                name={project.colleagues[0].name}
                                src={project.colleagues[0].avatarUrl}
                              />
                            </Tooltip>
                          ) : (
                            <Text fontSize="sm" color="gray.500">No teammates mapped</Text>
                          )}
                        </Box>
                      ))}
                    </SimpleGrid>
                  )}
                </Box>
              </Fade>
            )}
          </Box>
        </Box>

      )}

      <TaskActionPanel
        isOpen={actionPanel.isOpen}
        task={selectedTask}
        comments={taskComments}
        decision={taskDecision}
        onClose={closeTaskActionPanel}
        onAddComment={(content) => void handleAddComment(content)}
        onAccept={() => void handleSetDecision('accepted')}
        onDecline={() => void handleSetDecision('declined')}
      />
    </Box>
  );
};
