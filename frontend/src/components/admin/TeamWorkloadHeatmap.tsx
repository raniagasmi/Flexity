import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tooltip,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { EmployeeMetrics } from '../../types/analytics';
import { Task, TaskPriority } from '../../types/task';
import { taskService } from '../../services/task.service';
import {
  buildTeamWeekGrid,
  computeScheduleDateForDay,
  getLoadColor,
  getWeekDays,
  parseHeatmapDropTarget,
  parseTaskDragId,
  taskDragId,
} from '../../utils/workload';

interface TeamWorkloadHeatmapProps {
  employees: EmployeeMetrics[];
  tasks: Task[];
  isLoading: boolean;
  onTaskReassigned?: () => void;
}

const priorityColors: Record<TaskPriority, string> = {
  LOW: 'green',
  MEDIUM: 'yellow',
  HIGH: 'red',
};

const getWorkloadBadge = (employee: EmployeeMetrics) => {
  if (employee.isOverloaded) {
    return { label: 'Overloaded', colorScheme: 'red' as const };
  }
  if (employee.isUnderutilized) {
    return { label: 'Underutilized', colorScheme: 'orange' as const };
  }
  return { label: 'Balanced', colorScheme: 'green' as const };
};

interface TaskChipProps {
  task: Task;
}

const TaskChip = ({ task }: TaskChipProps) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: taskDragId(task.id),
    data: { task },
  });

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      px={2}
      py={1}
      borderRadius="md"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      boxShadow="sm"
      fontSize="xs"
      cursor="grab"
      opacity={isDragging ? 0.4 : 1}
      _hover={{ borderColor: 'blue.300', shadow: 'md' }}
      maxW="full"
      overflow="hidden"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
    >
      <HStack spacing={1}>
        <Badge colorScheme={priorityColors[task.priority]} fontSize="2xs" px={1}>
          {task.priority[0]}
        </Badge>
        <Text noOfLines={1}>{task.title}</Text>
      </HStack>
    </Box>
  );
};

interface HeatmapCellDropProps {
  employeeId: string;
  dayKey: string;
  loadPercent: number;
  assignedMinutes: number;
  tasks: Task[];
}

const HeatmapCellDrop = ({ employeeId, dayKey, loadPercent, assignedMinutes, tasks }: HeatmapCellDropProps) => {
  const dropId = `cell:${employeeId}:${dayKey}`;
  const { setNodeRef, isOver } = useDroppable({ id: dropId });
  const colors = getLoadColor(loadPercent);
  const hoursLabel = `${(assignedMinutes / 60).toFixed(1)}h`;
  const displayPercent = Math.round(loadPercent);

  return (
    <Tooltip
      label={`${hoursLabel} · ${tasks.length} task${tasks.length === 1 ? '' : 's'}${loadPercent > 100 ? ' (over capacity)' : ''}`}
      placement="top"
    >
      <Box
        ref={setNodeRef}
        minH="72px"
        minW="88px"
        p={1.5}
        borderRadius="md"
        borderWidth="1px"
        borderColor={isOver ? 'blue.400' : colors.border}
        bg={isOver ? 'blue.50' : colors.bg}
        transition="all 0.15s ease"
        outline={isOver ? '2px solid' : undefined}
        outlineColor={isOver ? 'blue.400' : undefined}
      >
        <Stack spacing={1}>
          <Text fontSize="2xs" fontWeight="semibold" color="gray.600" textAlign="center">
            {displayPercent}%
          </Text>
          <Stack spacing={0.5} maxH="120px" overflowY="auto">
            {tasks.map((task) => (
              <TaskChip key={task.id} task={task} />
            ))}
          </Stack>
        </Stack>
      </Box>
    </Tooltip>
  );
};

interface EmployeeRowDropProps {
  employeeId: string;
  children: React.ReactNode;
}

const EmployeeRowDrop = ({ employeeId, children }: EmployeeRowDropProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: `row:${employeeId}` });

  return (
    <Tr ref={setNodeRef} bg={isOver ? 'blue.50' : undefined}>
      {children}
    </Tr>
  );
};

export const TeamWorkloadHeatmap: React.FC<TeamWorkloadHeatmapProps> = ({
  employees,
  tasks: initialTasks,
  isLoading,
  onTaskReassigned,
}) => {
  const toast = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const gridRows = useMemo(
    () => buildTeamWeekGrid({ employees, tasks: localTasks, weekStart }),
    [employees, localTasks, weekStart]
  );

  const allOverflowTasks = useMemo(
    () => gridRows.flatMap((row) => row.overflowTasks),
    [gridRows]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = parseTaskDragId(String(event.active.id));
    const task = localTasks.find((item) => item.id === taskId) ?? null;
    setActiveTask(task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) {
      return;
    }

    const taskId = parseTaskDragId(String(active.id));
    const sourceTask = localTasks.find((task) => task.id === taskId);

    if (!sourceTask) {
      return;
    }

    const dropTarget = parseHeatmapDropTarget(String(over.id));
    if (!dropTarget) {
      return;
    }

    const { employeeId: targetEmployeeId, dayKey: targetDayKey, reassignOnly } = dropTarget;

    if (targetEmployeeId === sourceTask.assignedTo && reassignOnly) {
      return;
    }

    const targetRow = gridRows.find((row) => row.employee.userId === targetEmployeeId);
    const targetCell = targetDayKey
      ? targetRow?.cells.find((cell) => cell.dayKey === targetDayKey)
      : undefined;

    let nextDueDate = sourceTask.dueDate ? new Date(sourceTask.dueDate) : undefined;

    if (targetDayKey && targetCell) {
      nextDueDate = computeScheduleDateForDay(
        targetCell.day,
        targetCell.tasks,
        taskId,
        sourceTask
      );
    }

    const previousTasks = localTasks;
    const updatedTask: Task = {
      ...sourceTask,
      assignedTo: targetEmployeeId,
      ...(nextDueDate ? { dueDate: nextDueDate } : {}),
    };

    setLocalTasks((current) =>
      current.map((task) => (task.id === taskId ? updatedTask : task))
    );

    try {
      await taskService.updateTask(taskId, { assignedTo: targetEmployeeId });

      if (targetDayKey && nextDueDate) {
        await taskService.updateTaskSchedule(taskId, nextDueDate);
      }

      const targetName = targetRow?.employee.userName ?? 'team member';
      toast({
        title: 'Task reassigned',
        description: reassignOnly
          ? `${sourceTask.title} assigned to ${targetName}`
          : `${sourceTask.title} assigned to ${targetName} on ${format(nextDueDate!, 'EEE, MMM d')}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onTaskReassigned?.();
    } catch (error) {
      setLocalTasks(previousTasks);
      toast({
        title: 'Failed to reassign task',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const weekLabel = `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`;

  return (
    <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
      <Flex justify="space-between" align="flex-start" mb={4} gap={3} flexWrap="wrap">
        <VStack align="start" spacing={0}>
          <Text fontWeight="bold" fontSize="lg">
            Team workload heatmap
          </Text>
          <Text fontSize="sm" color="gray.600">
            Drag tasks from overloaded cells to available teammates. Drop on a day to reschedule.
          </Text>
        </VStack>
        <HStack spacing={2}>
          <IconButton
            aria-label="Previous week"
            icon={<ChevronLeftIcon />}
            size="sm"
            variant="outline"
            onClick={() => setWeekStart((current) => subWeeks(current, 1))}
          />
          <Text fontSize="sm" fontWeight="medium" minW="140px" textAlign="center">
            {weekLabel}
          </Text>
          <IconButton
            aria-label="Next week"
            icon={<ChevronRightIcon />}
            size="sm"
            variant="outline"
            onClick={() => setWeekStart((current) => addWeeks(current, 1))}
          />
          <Button size="sm" variant="ghost" onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}>
            Today
          </Button>
        </HStack>
      </Flex>

      <HStack spacing={3} mb={4} flexWrap="wrap" fontSize="xs" color="gray.600">
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bg="green.100" border="1px solid" borderColor="green.200" />
          <Text>Light load</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bg="yellow.100" border="1px solid" borderColor="yellow.200" />
          <Text>Moderate</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bg="orange.100" border="1px solid" borderColor="orange.200" />
          <Text>Heavy</Text>
        </HStack>
        <HStack>
          <Box w={3} h={3} borderRadius="sm" bg="red.100" border="1px solid" borderColor="red.300" />
          <Text>Over capacity</Text>
        </HStack>
      </HStack>

      {isLoading ? (
        <Stack spacing={3}>
          <Skeleton height="40px" />
          <Skeleton height="200px" />
        </Stack>
      ) : employees.length === 0 ? (
        <Text color="gray.500" textAlign="center" py={8}>
          No employees to display.
        </Text>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={(event) => void handleDragEnd(event)}
        >
          <Box overflowX="auto" pb={2}>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th
                    position="sticky"
                    left={0}
                    bg="white"
                    zIndex={2}
                    minW="200px"
                    borderRightWidth="1px"
                  >
                    Employee
                  </Th>
                  {weekDays.map((day) => (
                    <Th key={format(day, 'yyyy-MM-dd')} textAlign="center" minW="96px">
                      <VStack spacing={0}>
                        <Text fontSize="xs" textTransform="uppercase">
                          {format(day, 'EEE')}
                        </Text>
                        <Text>{format(day, 'MMM d')}</Text>
                      </VStack>
                    </Th>
                  ))}
                  <Th textAlign="center" minW="72px">
                    Week
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {gridRows.map((row) => {
                  const badge = getWorkloadBadge(row.employee);
                  const weekHours = (row.weekTotalMinutes / 60).toFixed(1);

                  return (
                    <EmployeeRowDrop key={row.employee.userId} employeeId={row.employee.userId}>
                      <Td
                        position="sticky"
                        left={0}
                        bg="white"
                        zIndex={1}
                        borderRightWidth="1px"
                        verticalAlign="top"
                      >
                        <HStack spacing={2} align="start">
                          <Avatar
                            name={row.employee.userName}
                            src={row.employee.avatarUrl}
                            size="sm"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>
                              {row.employee.userName}
                            </Text>
                            <Badge colorScheme={badge.colorScheme} fontSize="2xs">
                              {badge.label}
                            </Badge>
                          </VStack>
                        </HStack>
                      </Td>
                      {row.cells.map((cell) => (
                        <Td key={cell.dayKey} p={1} verticalAlign="top">
                          <HeatmapCellDrop
                            employeeId={cell.employeeId}
                            dayKey={cell.dayKey}
                            loadPercent={cell.loadPercent}
                            assignedMinutes={cell.assignedMinutes}
                            tasks={cell.tasks}
                          />
                        </Td>
                      ))}
                      <Td textAlign="center" verticalAlign="middle">
                        <Text fontSize="sm" fontWeight="semibold">
                          {weekHours}h
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          {row.employee.taskCount} tasks
                        </Text>
                      </Td>
                    </EmployeeRowDrop>
                  );
                })}
              </Tbody>
            </Table>
          </Box>

          {allOverflowTasks.length > 0 && (
            <Box mt={4} p={3} borderRadius="md" borderWidth="1px" borderColor="gray.200" bg="gray.50">
              <Text fontSize="sm" fontWeight="semibold" mb={2}>
                Outside this week ({allOverflowTasks.length})
              </Text>
              <Text fontSize="xs" color="gray.600" mb={2}>
                Drag onto a day cell to assign and schedule.
              </Text>
              <Flex gap={2} flexWrap="wrap">
                {allOverflowTasks.map((task) => (
                  <Box key={task.id} maxW="200px">
                    <TaskChip task={task} />
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          <DragOverlay>
            {activeTask ? (
              <Box
                px={3}
                py={2}
                borderRadius="md"
                bg="white"
                borderWidth="2px"
                borderColor="blue.400"
                boxShadow="lg"
                fontSize="sm"
                fontWeight="medium"
                maxW="220px"
              >
                {activeTask.title}
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </Box>
  );
};
