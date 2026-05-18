import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Fade,
  Flex,
  Heading,
  HStack,
  IconButton,
  Link,
  SimpleGrid,
  Skeleton,
  SkeletonText,
  Stack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Tooltip,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { useNavigate } from 'react-router-dom';
import { useAdminDashboard, useTimeTracking } from '../../hooks/useAdminMetrics';
import { EmployeeMetricsGrid } from './EmployeeMetricsCard';
import { AlertsPanel } from './AlertsPanel';
import {
  AlertVolumeChart,
  ProjectBurndownChart,
  TaskCompletionTrendChart,
} from './AdminCharts';
import { ProjectMetricsView } from './ProjectMetricsView';
import { EmployeeMetrics, AdminDashboardData } from '../../types/analytics';
import { authService } from '../../services/auth.service';
import { Board } from '../tasks/Board';

interface AdminDashboardProps {
  isAdmin: boolean;
  section?: 'dashboard' | 'team-analytics' | 'tasks';
  initialTaskTab?: keyof typeof TAB_INDEX;
  focusBoard?: boolean;
  mobileNavTrigger?: React.ReactNode;
}

const TAB_INDEX = {
  employees: 0,
  projects: 1,
  alerts: 2,
  board: 3,
} as const;

const EmployeeDetailContent: React.FC<{ employee: EmployeeMetrics }> = ({ employee }) => (
  <Stack spacing={4}>
    <Box>
      <Text fontSize="sm" color="gray.600">
        Last Active
      </Text>
      <Text fontWeight="bold">{new Date(employee.lastActiveAt).toLocaleTimeString()}</Text>
    </Box>
    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3} fontSize="sm">
      <Box>
        <Text color="gray.600">Average Completion Time</Text>
        <Text fontWeight="bold">{employee.avgCompletionTime} hours</Text>
      </Box>
      <Box>
        <Text color="gray.600">Deadline Adherence</Text>
        <Text fontWeight="bold">{employee.deadlineAdherenceRate}%</Text>
      </Box>
      <Box>
        <Text color="gray.600">Focus Score</Text>
        <Text fontWeight="bold">
          {employee.dailyFocusTime} minutes ({Math.round((employee.dailyFocusTime / 480) * 100)}%)
        </Text>
      </Box>
      <Box>
        <Text color="gray.600">Task Risk Count</Text>
        <Text fontWeight="bold">{employee.tasksAtRisk}</Text>
      </Box>
    </SimpleGrid>
    <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3} fontSize="sm">
      <Box bg="gray.50" p={3} borderRadius="md">
        <Text color="gray.600">Completed</Text>
        <Text fontWeight="bold">{employee.tasksCompleted}</Text>
      </Box>
      <Box bg="gray.50" p={3} borderRadius="md">
        <Text color="gray.600">Pending</Text>
        <Text fontWeight="bold">{employee.tasksPending}</Text>
      </Box>
      <Box bg="gray.50" p={3} borderRadius="md">
        <Text color="gray.600">Weighted Load</Text>
        <Text fontWeight="bold">{employee.weightedLoad} pts</Text>
      </Box>
    </SimpleGrid>
  </Stack>
);

const getWorkloadBadge = (employee: EmployeeMetrics) => {
  if (employee.isOverloaded) {
    return { label: 'Overloaded', colorScheme: 'red' as const };
  }

  if (employee.isUnderutilized) {
    return { label: 'Underutilized', colorScheme: 'orange' as const };
  }

  return { label: 'Balanced', colorScheme: 'green' as const };
};

/**
 * Dashboard overview stats
 */
const DashboardOverview: React.FC<{ dashboardData: AdminDashboardData | null; isLoading: boolean }> = ({
  dashboardData,
  isLoading,
}) => {
  if (!dashboardData && !isLoading) {
    return null;
  }

  const totalEmployees = dashboardData?.employees.length ?? 0;
  const avgPerformance =
    totalEmployees > 0
      ? Math.round(
          (dashboardData?.employees ?? []).reduce((sum, e) => sum + e.performanceScore, 0) / totalEmployees
        )
      : 0;

  const totalTasks = dashboardData?.taskBehaviors.length ?? 0;
  const overloadedCount = dashboardData?.employees.filter((e) => e.isOverloaded).length ?? 0;
  const activeAlerts = dashboardData?.alerts.filter((a) => !a.isResolved).length ?? 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
      {[
        {
          label: 'Team Performance',
          value: `${avgPerformance}%`,
          helpText: `${totalEmployees} employees`,
        },
        {
          label: 'Total Tasks',
          value: totalTasks,
          helpText: `${dashboardData?.projects.length ?? 0} projects`,
        },
        {
          label: 'Workload Issues',
          value: overloadedCount,
          helpText: 'overloaded employees',
        },
        {
          label: 'Active Alerts',
          value: activeAlerts,
          helpText: 'requires attention',
        },
      ].map((stat) => (
        <Box key={stat.label} bg="white" p={4} borderRadius="lg" boxShadow="sm" minH="124px">
          <Stat>
            {isLoading ? (
              <Stack spacing={3}>
                <SkeletonText noOfLines={1} width="60%" />
                <Skeleton height="40px" width="80px" />
                <SkeletonText noOfLines={1} width="50%" />
              </Stack>
            ) : (
              <>
                <StatLabel>{stat.label}</StatLabel>
                <StatNumber>{stat.value}</StatNumber>
                <StatHelpText>{stat.helpText}</StatHelpText>
              </>
            )}
          </Stat>
        </Box>
      ))}
    </SimpleGrid>
  );
};

/**
 * Main admin dashboard
 */
export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isAdmin,
  section = 'dashboard',
  initialTaskTab = 'employees',
  focusBoard = false,
  mobileNavTrigger,
}) => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const { dashboardData, isLoading, error } = useAdminDashboard(isAdmin, refreshKey);
  const { currentStatus, togglePause } = useTimeTracking(
    authService.getCurrentUser()?.id
  );
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeMetrics | null>(null);
  const [tabIndex, setTabIndex] = useState(TAB_INDEX[focusBoard ? 'board' : initialTaskTab]);
  const boardSectionRef = useRef<HTMLDivElement | null>(null);
  const { isOpen: isEmployeeDrawerOpen, onOpen: onEmployeeDrawerOpen, onClose: onEmployeeDrawerClose } = useDisclosure();
  const toast = useToast();

  const unresolvedAlerts = useMemo(
    () => dashboardData?.alerts.filter((alert) => !alert.isResolved) ?? [],
    [dashboardData]
  );

  const topEmployees = useMemo(() => {
    if (!dashboardData) {
      return [];
    }

    return [...dashboardData.employees]
      .sort((a, b) => {
        if (a.isOverloaded !== b.isOverloaded) {
          return a.isOverloaded ? -1 : 1;
        }

        if (b.taskCount !== a.taskCount) {
          return b.taskCount - a.taskCount;
        }

        return b.weightedLoad - a.weightedLoad;
      })
      .slice(0, 3);
  }, [dashboardData]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResolveAlert = (alertId: string) => {
    toast({
      title: 'Alert marked as resolved',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    // TODO: Persist to backend
  };

  const handleRefresh = () => {
    setRefreshKey((current) => current + 1);
  };

  const tabKeyByIndex = Object.entries(TAB_INDEX).reduce<Record<number, keyof typeof TAB_INDEX>>((acc, [key, value]) => {
    acc[value] = key as keyof typeof TAB_INDEX;
    return acc;
  }, {});

  const openTasksSection = (view: keyof typeof TAB_INDEX) => {
    setTabIndex(TAB_INDEX[view]);
    navigate(`/app?section=tasks&tab=${view}`);
  };

  const handleTaskTabChange = (nextIndex: number) => {
    setTabIndex(nextIndex);
    const nextTab = tabKeyByIndex[nextIndex];
    if (nextTab) {
      navigate(`/app?section=tasks&tab=${nextTab}`);
    }
  };

  const handleEmployeeSelect = (employee: EmployeeMetrics) => {
    setSelectedEmployee(employee);
    onEmployeeDrawerOpen();
  };

  useEffect(() => {
    setTabIndex(TAB_INDEX[focusBoard ? 'board' : initialTaskTab]);
  }, [focusBoard, initialTaskTab]);

  useEffect(() => {
    if (section !== 'tasks' || tabIndex !== TAB_INDEX.board) {
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      boardSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    return () => window.cancelAnimationFrame(raf);
  }, [section, tabIndex]);

  if (!isAdmin) {
    return (
      <Box textAlign="center" py={8}>
        <Text color="red.500">Access denied. Admin only.</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="red.50" p={4} borderRadius="md">
        <Text color="red.700">Failed to load dashboard: {error}</Text>
        <Button mt={2} colorScheme="red" size="sm" onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  const pageTitle =
    section === 'team-analytics'
      ? 'Team analytics'
      : section === 'tasks'
        ? 'Tasks'
        : 'Admin Intelligence Dashboard';

  const pageDescription =
    section === 'team-analytics'
      ? 'Snapshot charts for delivery, alerts, and burndown trends'
      : section === 'tasks'
        ? 'Employees, projects, alerts, and task board in one admin workspace'
        : 'Real-time team analytics and workload management';

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack align="start" spacing={3}>
          {mobileNavTrigger}
          <VStack align="start" spacing={1}>
            <Heading size="lg">{pageTitle}</Heading>
            <Text fontSize="sm" color="gray.600">
              {pageDescription}
            </Text>
          </VStack>
        </HStack>
        <HStack spacing={2}>
          <Tooltip label={`Status: ${currentStatus}`}>
            <Button
              size="sm"
              colorScheme={currentStatus === 'ONLINE' ? 'green' : 'orange'}
              onClick={togglePause}
            >
              {currentStatus === 'PAUSE' ? (
                <>
                  <span role="img" aria-label="Resume time tracking">▶️</span> Resume
                </>
              ) : (
                <>
                  <span role="img" aria-label="Pause time tracking">⏸️</span> Pause
                </>
              )}
            </Button>
          </Tooltip>
          <IconButton
            aria-label="Refresh admin dashboard"
            icon={<RepeatIcon />}
            size="sm"
            onClick={handleRefresh}
            isLoading={isLoading}
          />
        </HStack>
      </Flex>

      {section === 'dashboard' ? (
        <>
          <DashboardOverview dashboardData={dashboardData} isLoading={isLoading} />

          <SimpleGrid columns={{ base: 1 }} spacing={6} mb={6}>
            <Skeleton isLoaded={!isLoading} borderRadius="lg">
              <Box bg="white" borderRadius="lg" p={4} boxShadow="sm" minH="260px">
                <Flex justify="space-between" align="center" mb={4}>
                  <VStack align="start" spacing={0}>
                    <Heading size="md">Team Load Watchlist</Heading>
                    <Text fontSize="sm" color="gray.600">
                      Highest current task pressure across the team
                    </Text>
                  </VStack>
                  <Button size="sm" variant="ghost" colorScheme="blue" onClick={() => openTasksSection('employees')}>
                    View all employees
                  </Button>
                </Flex>

                <Stack spacing={3}>
                  {topEmployees.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                      No employee load data available yet.
                    </Text>
                  ) : (
                    topEmployees.map((employee) => {
                      const workloadBadge = getWorkloadBadge(employee);

                      return (
                        <Flex
                          key={employee.userId}
                          p={3}
                          borderWidth="1px"
                          borderColor="gray.200"
                          borderRadius="md"
                          align="center"
                          justify="space-between"
                          gap={3}
                          cursor="pointer"
                          _hover={{ borderColor: 'blue.300', shadow: 'sm' }}
                          onClick={() => handleEmployeeSelect(employee)}
                        >
                          <HStack spacing={3}>
                            <Avatar name={employee.userName} src={employee.avatarUrl} size="sm" />
                            <VStack align="start" spacing={0}>
                              <Text fontWeight="semibold">{employee.userName}</Text>
                              <Text fontSize="sm" color="gray.600">
                                {employee.taskCount} active tasks
                              </Text>
                            </VStack>
                          </HStack>
                          <Badge colorScheme={workloadBadge.colorScheme} px={2} py={1} borderRadius="full">
                            {workloadBadge.label}
                          </Badge>
                        </Flex>
                      );
                    })
                  )}
                </Stack>

                <HStack spacing={3} mt={6} flexWrap="wrap">
                  <Button colorScheme="blue" variant="outline" onClick={() => openTasksSection('projects')}>
                    View all projects
                  </Button>
                  <Button colorScheme="blue" onClick={() => openTasksSection('board')}>
                    Open board
                  </Button>
                </HStack>
              </Box>
            </Skeleton>
          </SimpleGrid>
        </>
      ) : null}

      {section === 'tasks' ? (
        <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
          <Tabs colorScheme="blue" isLazy index={tabIndex} onChange={handleTaskTabChange}>
            <Flex justify="space-between" align="center" mb={4} gap={3} flexWrap="wrap">
              <TabList>
                <Tab>Employees</Tab>
                <Tab>Projects</Tab>
                <Tab>
                  Alerts
                  {unresolvedAlerts.length > 0 && (
                    <Badge ml={2} colorScheme="red">
                      {unresolvedAlerts.length}
                    </Badge>
                  )}
                </Tab>
                <Tab>Task Board</Tab>
              </TabList>
              <Link color="blue.500" fontWeight="medium" onClick={() => navigate('/app')}>
                Back to dashboard
              </Link>
            </Flex>

            <TabPanels>
              <TabPanel px={0}>
                <Fade in={true}>
                  {dashboardData?.employees ? (
                    <Stack spacing={4}>
                      <Text fontSize="sm" color="gray.600">
                        Click on an employee to see detailed metrics
                      </Text>
                      <EmployeeMetricsGrid
                        employees={dashboardData.employees}
                        onSelect={handleEmployeeSelect}
                        selectedEmployeeId={selectedEmployee?.userId}
                      />
                    </Stack>
                  ) : null}
                </Fade>
              </TabPanel>

              <TabPanel px={0}>
                <Fade in={true}>
                  {dashboardData?.projects ? <ProjectMetricsView projects={dashboardData.projects} isLoading={isLoading} /> : null}
                </Fade>
              </TabPanel>

              <TabPanel px={0}>
                <Fade in={true}>
                  {dashboardData?.alerts ? (
                    <AlertsPanel
                      alerts={dashboardData.alerts}
                      onResolve={(alert) => handleResolveAlert(alert.id)}
                    />
                  ) : null}
                </Fade>
              </TabPanel>

              <TabPanel px={0}>
                <Fade in={true}>
                  <Box ref={boardSectionRef}>
                    <Board showControls={false} showTaskActionPanel={false} />
                  </Box>
                </Fade>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      ) : null}

      {section === 'team-analytics' ? (
        <Box mt={6}>
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
            <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                Task completion - last 7 days
              </Text>
              <TaskCompletionTrendChart />
            </Box>

            <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                Alert volume - last 14 days
              </Text>
              <AlertVolumeChart />
            </Box>

            <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
              <Text fontSize="sm" fontWeight="medium" color="gray.600" mb={3}>
                Project burndown - last 4 weeks
              </Text>
              <ProjectBurndownChart />
            </Box>
          </SimpleGrid>
        </Box>
      ) : null}

      <Drawer isOpen={isEmployeeDrawerOpen} placement="right" onClose={onEmployeeDrawerClose} size="md">
        <DrawerOverlay />
        <DrawerContent borderTopLeftRadius="2xl" borderBottomLeftRadius="2xl">
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            {selectedEmployee ? `Employee Detail: ${selectedEmployee.userName}` : 'Employee Detail'}
          </DrawerHeader>
          <DrawerBody py={5}>
            {selectedEmployee ? <EmployeeDetailContent employee={selectedEmployee} /> : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};
