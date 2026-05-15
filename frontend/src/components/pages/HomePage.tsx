import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import {
  Flex,
  Box,
  Spinner,
  Center,
} from '@chakra-ui/react';
import ThemeSelector from '../selectors/ThemeSelector';
import SideNavbar from '../layout/SideNavbar';
import MobileSidebarDrawer from '../layout/MobileSidebarDrawer';
import { AdminDashboard } from '../admin/AdminDashboard';
import { UserRole } from '../../types/user';
import { EmployeeDashboard, type EmployeeDashboardSection } from '../employee/EmployeeDashboard';
import { TaskReminderToasts } from '../notifications/TaskReminderToasts';

const isEmployeeDashboardSection = (value: string | null): value is EmployeeDashboardSection => {
  return value === 'tasks' || value === 'projects' || value === 'calendar';
};

type AdminDashboardSection = 'dashboard' | 'team-analytics' | 'tasks';
type AdminTaskTab = 'employees' | 'projects' | 'alerts' | 'board';
type EmployeeTaskView = 'board' | 'alerts';

const isAdminDashboardSection = (value: string | null): value is AdminDashboardSection => {
  return value === 'dashboard' || value === 'team-analytics' || value === 'tasks';
};

const isAdminTaskTab = (value: string | null): value is AdminTaskTab => {
  return value === 'employees' || value === 'projects' || value === 'alerts' || value === 'board';
};

const isEmployeeTaskView = (value: string | null): value is EmployeeTaskView => {
  return value === 'board' || value === 'alerts';
};

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const user = await userService.getCurrentUser();
        setUserRole(user.role);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        authService.logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    validateSession();
  }, [navigate]);

  const isAdmin = userRole === UserRole.ADMIN;
  const section = new URLSearchParams(location.search).get('section');
  const view = new URLSearchParams(location.search).get('view');
  const tab = new URLSearchParams(location.search).get('tab');
  const panel = new URLSearchParams(location.search).get('panel');
  const focusBoard = view === 'board';
  const adminSection: AdminDashboardSection =
    focusBoard ? 'tasks' : (isAdminDashboardSection(section) ? section : 'dashboard');
  const adminTaskTab: AdminTaskTab =
    focusBoard ? 'board' : (isAdminTaskTab(tab) ? tab : 'employees');
  const initialSection = isEmployeeDashboardSection(section) ? section : 'tasks';
  const initialTaskView: EmployeeTaskView =
    focusBoard ? 'board' : (isEmployeeTaskView(panel) ? panel : 'board');

  useEffect(() => {
    if (loading || section !== 'alerts' || !userRole) {
      return;
    }

    navigate(
      isAdmin ? '/app?section=tasks&tab=alerts' : '/app?section=tasks&panel=alerts',
      { replace: true },
    );
  }, [isAdmin, loading, navigate, section, userRole]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Center w="100vw" h="100vh" bg="var(--light-color)">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Flex bg="var(--light-color)" w="100vw" minH="100vh">
      <Box display={{ base: 'none', md: 'block' }}>
        <SideNavbar onLogoutClick={handleLogout} />
      </Box>
      <Flex flex={1} direction="column">
        <Box flex={1} p={{ base: 4, md: 20 }} overflowY="auto">
          {isAdmin ? (
            <AdminDashboard
              isAdmin={true}
              section={adminSection}
              initialTaskTab={adminTaskTab}
              focusBoard={focusBoard}
              mobileNavTrigger={<MobileSidebarDrawer onLogoutClick={handleLogout} />}
            />
          ) : (
            <EmployeeDashboard
              initialSection={initialSection}
              initialTaskView={initialTaskView}
              focusBoard={focusBoard}
              mobileNavTrigger={<MobileSidebarDrawer onLogoutClick={handleLogout} />}
            />
          )}
        </Box>
      </Flex>
      <TaskReminderToasts />
      <ThemeSelector />
    </Flex>
  );
};

export default HomePage;
