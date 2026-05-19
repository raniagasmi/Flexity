import { addDays, format, isSameDay, startOfWeek } from 'date-fns';
import { EmployeeMetrics } from '../types/analytics';
import { Task, TaskPriority, TaskStatus } from '../types/task';

export const WORKDAY_START_MINUTES = 9 * 60;
export const WORKDAY_CAPACITY_MINUTES = 8 * 60;

export const priorityDurationMinutes: Record<TaskPriority, number> = {
  LOW: 60,
  MEDIUM: 90,
  HIGH: 120,
};

export const toValidDate = (value?: Date | string | null) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const hasExplicitTime = (date: Date) =>
  date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0 || date.getMilliseconds() !== 0;

export const estimateDuration = (task: Task) =>
  priorityDurationMinutes[task.priority] ?? priorityDurationMinutes.MEDIUM;

export const dayKey = (date: Date) => format(date, 'yyyy-MM-dd');

export type ScheduledTask = Task & { dueDate: Date };

export type DaySchedule = {
  key: string;
  day: Date;
  tasks: ScheduledTask[];
  assignedMinutes: number;
};

export type HeatmapCell = {
  employeeId: string;
  dayKey: string;
  day: Date;
  tasks: Task[];
  assignedMinutes: number;
  loadPercent: number;
};

export type EmployeeWeekRow = {
  employee: EmployeeMetrics;
  cells: HeatmapCell[];
  weekTotalMinutes: number;
  overflowTasks: Task[];
};

export const getWeekDays = (weekStart?: Date) => {
  const monday = weekStart ?? startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
};

export const getLoadColor = (loadPercent: number) => {
  if (loadPercent > 100) {
    return { bg: 'red.50', border: 'red.300', scheme: 'red' as const };
  }
  if (loadPercent >= 85) {
    return { bg: 'orange.50', border: 'orange.200', scheme: 'orange' as const };
  }
  if (loadPercent >= 50) {
    return { bg: 'yellow.50', border: 'yellow.200', scheme: 'yellow' as const };
  }
  return { bg: 'green.50', border: 'green.200', scheme: 'green' as const };
};

export const buildWeekSchedules = (tasks: Task[], weekDays: Date[]): DaySchedule[] => {
  const buckets = new Map<string, Task[]>();

  weekDays.forEach((day) => {
    buckets.set(dayKey(day), []);
  });

  tasks.forEach((task) => {
    const baseDate = toValidDate(task.dueDate ?? task.createdAt);

    if (!baseDate) {
      return;
    }

    const matchedDay = weekDays.find((day) => isSameDay(day, baseDate));
    if (!matchedDay) {
      return;
    }

    buckets.get(dayKey(matchedDay))?.push(task);
  });

  return weekDays.map((day) => {
    const tasksForDay = (buckets.get(dayKey(day)) ?? []).slice().sort((left, right) => {
      const leftDate = toValidDate(left.dueDate ?? left.createdAt)?.getTime() ?? 0;
      const rightDate = toValidDate(right.dueDate ?? right.createdAt)?.getTime() ?? 0;

      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }

      if (left.order !== right.order) {
        return left.order - right.order;
      }

      return estimateDuration(right) - estimateDuration(left);
    });

    let cursor = WORKDAY_START_MINUTES;
    const scheduledTasks = tasksForDay.map((task) => {
      const existingDate = toValidDate(task.dueDate);
      const useExplicitTime = existingDate ? hasExplicitTime(existingDate) : false;
      const displayMinutes =
        useExplicitTime && existingDate ? existingDate.getHours() * 60 + existingDate.getMinutes() : cursor;
      const scheduledAt = new Date(day);
      scheduledAt.setHours(Math.floor(displayMinutes / 60), displayMinutes % 60, 0, 0);

      const durationMinutes = estimateDuration(task);
      cursor = Math.max(cursor, displayMinutes + durationMinutes);

      return {
        ...task,
        dueDate: scheduledAt,
      } as ScheduledTask;
    });

    return {
      key: dayKey(day),
      day,
      tasks: scheduledTasks,
      assignedMinutes: tasksForDay.reduce((sum, task) => sum + estimateDuration(task), 0),
    };
  });
};

export const getOverflowTasks = (tasks: Task[], weekDays: Date[]) =>
  tasks.filter((task) => {
    const baseDate = toValidDate(task.dueDate ?? task.createdAt);
    return !baseDate || !weekDays.some((day) => isSameDay(day, baseDate));
  });

export const computeScheduleDateForDay = (
  targetDay: Date,
  tasksOnTargetDay: Task[],
  movingTaskId: string,
  movingTask: Task
) => {
  const taskDuration = estimateDuration(movingTask);
  const otherTasks = tasksOnTargetDay.filter((task) => task.id !== movingTaskId);
  const occupiedMinutes = otherTasks.reduce((sum, task) => sum + estimateDuration(task), 0);
  const nextStartMinutes = Math.min(
    WORKDAY_START_MINUTES + occupiedMinutes,
    WORKDAY_START_MINUTES + WORKDAY_CAPACITY_MINUTES - taskDuration
  );

  const nextDate = new Date(targetDay);
  nextDate.setHours(Math.floor(nextStartMinutes / 60), nextStartMinutes % 60, 0, 0);
  return nextDate;
};

export const buildTeamWeekGrid = ({
  employees,
  tasks,
  weekStart,
}: {
  employees: EmployeeMetrics[];
  tasks: Task[];
  weekStart?: Date;
}): EmployeeWeekRow[] => {
  const weekDays = getWeekDays(weekStart);

  return employees.map((employee) => {
    const employeeTasks = tasks.filter(
      (task) => task.assignedTo === employee.userId && task.status !== TaskStatus.DONE
    );

    const cells: HeatmapCell[] = weekDays.map((day) => {
      const key = dayKey(day);
      const tasksForDay = employeeTasks.filter((task) => {
        const baseDate = toValidDate(task.dueDate ?? task.createdAt);
        return baseDate && isSameDay(baseDate, day);
      });
      const assignedMinutes = tasksForDay.reduce((sum, task) => sum + estimateDuration(task), 0);
      const loadPercent = (assignedMinutes / WORKDAY_CAPACITY_MINUTES) * 100;

      return {
        employeeId: employee.userId,
        dayKey: key,
        day,
        tasks: tasksForDay,
        assignedMinutes,
        loadPercent,
      };
    });

    const overflowTasks = employeeTasks.filter((task) => {
      const baseDate = toValidDate(task.dueDate ?? task.createdAt);
      return !baseDate || !weekDays.some((day) => isSameDay(day, baseDate));
    });

    const weekTotalMinutes = cells.reduce((sum, cell) => sum + cell.assignedMinutes, 0);

    return {
      employee,
      cells,
      weekTotalMinutes,
      overflowTasks,
    };
  });
};

export const parseHeatmapDropTarget = (overId: string) => {
  if (overId.startsWith('cell:')) {
    const [, employeeId, dayKeyValue] = overId.split(':');
    return { employeeId, dayKey: dayKeyValue, reassignOnly: false };
  }

  if (overId.startsWith('row:')) {
    const [, employeeId] = overId.split(':');
    return { employeeId, dayKey: undefined, reassignOnly: true };
  }

  return null;
};

export const taskDragId = (taskId: string) => `task:${taskId}`;

export const parseTaskDragId = (id: string) => (id.startsWith('task:') ? id.slice(5) : id);
