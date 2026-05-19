import { useEffect, useMemo, useState } from 'react';
import {
  Badge,
  Box,
  Flex,
  Heading,
  Progress,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { closestCorners, DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import Task from '../tasks/Task';
import { taskService } from '../../services/task.service';
import { Task as TaskType } from '../../types/task';
import {
  buildWeekSchedules,
  computeScheduleDateForDay,
  DaySchedule,
  getOverflowTasks,
  getWeekDays,
  toValidDate,
  WORKDAY_CAPACITY_MINUTES,
} from '../../utils/workload';

interface ScheduleColumnProps {
  schedule: DaySchedule;
  onTaskClick?: (task: TaskType) => void;
}

const ScheduleColumn = ({ schedule, onTaskClick }: ScheduleColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: schedule.key });
  const loadPercentage = Math.min((schedule.assignedMinutes / WORKDAY_CAPACITY_MINUTES) * 100, 100);
  const availableMinutes = Math.max(WORKDAY_CAPACITY_MINUTES - schedule.assignedMinutes, 0);
  const overCapacity = schedule.assignedMinutes > WORKDAY_CAPACITY_MINUTES;

  return (
    <Box
      ref={setNodeRef}
      minW="240px"
      flex="1"
      p={4}
      borderRadius="2xl"
      borderWidth="1px"
      borderColor={isOver ? 'teal.300' : 'gray.100'}
      bg={isOver ? 'rgba(15,118,110,0.06)' : 'white'}
      boxShadow={isOver ? '0 18px 32px rgba(15, 118, 110, 0.12)' : '0 12px 30px rgba(15, 23, 42, 0.06)'}
      transition="all 0.2s ease"
    >
      <Stack spacing={3} h="full">
        <Flex justify="space-between" align="start" gap={3}>
          <Box>
            <Text fontSize="sm" color="gray.500" textTransform="uppercase" letterSpacing="0.08em">
              {format(schedule.day, 'EEE')}
            </Text>
            <Heading size="sm" color="#0f172a">
              {format(schedule.day, 'MMM d')}
            </Heading>
          </Box>
          <Badge colorScheme={overCapacity ? 'red' : 'teal'} borderRadius="full" px={3} py={1}>
            {Math.round(loadPercentage)}%
          </Badge>
        </Flex>

        <Box>
          <Flex justify="space-between" fontSize="xs" color="gray.500" mb={2}>
            <Text>{Math.round(schedule.assignedMinutes / 60)}h assigned</Text>
            <Text>{Math.round(availableMinutes / 60)}h available</Text>
          </Flex>
          <Progress value={loadPercentage} borderRadius="full" size="sm" colorScheme={overCapacity ? 'red' : 'teal'} />
        </Box>

        <SortableContext items={schedule.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <Stack spacing={3} flex={1} minH="220px">
            {schedule.tasks.length === 0 ? (
              <Box
                borderWidth="1px"
                borderStyle="dashed"
                borderColor="gray.200"
                borderRadius="xl"
                p={4}
                bg="gray.50"
                minH="180px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="gray.500" fontSize="sm" textAlign="center">
                  Drop a task here to schedule it.
                </Text>
              </Box>
            ) : (
              schedule.tasks.map((task) => (
                <Box key={task.id}>
                  <Tooltip label={format(task.dueDate, 'PPP p')} placement="top-start">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      {format(task.dueDate, 'h:mm a')}
                    </Text>
                  </Tooltip>
                  <Task task={task} onEdit={onTaskClick ?? (() => undefined)} onDelete={() => undefined} />
                </Box>
              ))
            )}
          </Stack>
        </SortableContext>
      </Stack>
    </Box>
  );
};

interface MyWeekCalendarProps {
  tasks: TaskType[];
  onTaskSelect?: (task: TaskType) => void;
}

interface OverflowPoolProps {
  tasks: TaskType[];
  onTaskSelect?: (task: TaskType) => void;
}

const OverflowPool = ({ tasks, onTaskSelect }: OverflowPoolProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'overflow-pool' });

  return (
    <Box
      ref={setNodeRef}
      bg={isOver ? 'rgba(15, 23, 42, 0.05)' : 'white'}
      borderRadius="2xl"
      boxShadow="0 12px 30px rgba(15, 23, 42, 0.06)"
      p={5}
      borderWidth="1px"
      borderColor={isOver ? 'gray.400' : 'gray.100'}
      transition="all 0.2s ease"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Box>
          <Heading size="sm" color="#0f172a">
            Outside this week
          </Heading>
          <Text color="gray.500" fontSize="sm">
            Drag items into weekday columns to schedule them.
          </Text>
        </Box>
        <Badge colorScheme="gray" borderRadius="full" px={3} py={1}>
          {tasks.length}
        </Badge>
      </Flex>

      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} spacing={4}>
          {tasks.map((task) => {
            const displayDate = toValidDate(task.dueDate ?? task.createdAt) ?? new Date();

            return (
              <Box key={task.id}>
                <Text fontSize="xs" color="gray.500" mb={1}>
                  {format(displayDate, 'EEE, MMM d')}
                </Text>
                <Task task={task} onEdit={onTaskSelect ?? (() => undefined)} onDelete={() => undefined} />
              </Box>
            );
          })}
        </SimpleGrid>
      </SortableContext>
    </Box>
  );
};

const MyWeekCalendar = ({ tasks, onTaskSelect }: MyWeekCalendarProps) => {
  const toast = useToast();
  const [calendarTasks, setCalendarTasks] = useState<TaskType[]>(tasks);

  useEffect(() => {
    setCalendarTasks(tasks);
  }, [tasks]);

  const weekDays = useMemo(() => getWeekDays(), []);

  const schedules = useMemo<DaySchedule[]>(
    () => buildWeekSchedules(calendarTasks, weekDays),
    [calendarTasks, weekDays]
  );

  const overflowTasks = useMemo(
    () => getOverflowTasks(calendarTasks, weekDays),
    [calendarTasks, weekDays]
  );

  const moveTaskToDay = async (taskId: string, targetDayKey: string) => {
    const targetSchedule = schedules.find((schedule) => schedule.key === targetDayKey);
    const sourceTask = calendarTasks.find((task) => task.id === taskId);

    if (!targetSchedule || !sourceTask) {
      return;
    }

    const nextDate = computeScheduleDateForDay(
      targetSchedule.day,
      targetSchedule.tasks,
      taskId,
      sourceTask
    );

    const previousTasks = calendarTasks;
    setCalendarTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, dueDate: nextDate } : task))
    );

    try {
      await taskService.updateTaskSchedule(taskId, nextDate);
      toast({
        title: 'Task rescheduled',
        description: `${sourceTask.title} moved to ${format(nextDate, 'EEE, MMM d h:mm a')}`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
    } catch (error) {
      setCalendarTasks(previousTasks);
      toast({
        title: 'Failed to update schedule',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const taskId = String(active.id);
    const overId = String(over.id);
    const targetDay = schedules.find((schedule) => schedule.key === overId)
      ?? schedules.find((schedule) => schedule.tasks.some((task) => task.id === overId));

    if (!targetDay) {
      return;
    }

    void moveTaskToDay(taskId, targetDay.key);
  };

  return (
    <Stack spacing={5}>
      <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <Flex gap={4} align="stretch" overflowX="auto" pb={2}>
          {schedules.map((schedule) => (
            <ScheduleColumn key={schedule.key} schedule={schedule} onTaskClick={onTaskSelect} />
          ))}
        </Flex>

        {overflowTasks.length > 0 && <OverflowPool tasks={overflowTasks} onTaskSelect={onTaskSelect} />}
      </DndContext>
    </Stack>
  );
};

export default MyWeekCalendar;
