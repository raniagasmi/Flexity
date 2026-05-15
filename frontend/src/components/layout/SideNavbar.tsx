import { useLocation, useNavigate } from 'react-router-dom';
import { Badge, Box, Button, Flex, Image, Stack } from '@chakra-ui/react';
import {
  IconBell,
  IconBriefcase,
  IconCalendar,
  IconFolder,
  IconLayoutDashboard,
  IconMessages,
  IconUserCircle,
  IconUserShield as IconShieldPerson,
  IconUsersGroup,
  type TablerIcon,
} from '@tabler/icons-react';
import { authService } from '../../services/auth.service';
import { UserRole } from '../../types/user';
import logoImage from '../../assets/images/logo.png';

interface SideNavbarProps {
  onLogoutClick?: () => void;
  onNavigate?: () => void;
  isInDrawer?: boolean;
}

interface NavItem {
  label: string;
  icon: TablerIcon;
  isActive: boolean;
  onClick: () => void;
  count?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const SideNavbar = ({ onLogoutClick, onNavigate, isInDrawer = false }: SideNavbarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.role?.toLowerCase() === UserRole.ADMIN;
  const currentSection = new URLSearchParams(location.search).get('section');

  const navigateTo = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  const employeeNavGroups: NavGroup[] = [
    {
      label: 'Work',
      items: [
        {
          label: 'Tasks',
          icon: IconLayoutDashboard,
          isActive: location.pathname === '/app' && (!currentSection || currentSection === 'tasks'),
          onClick: () => navigateTo('/app'),
        },
        {
          label: 'Projects',
          icon: IconFolder,
          isActive: location.pathname === '/app' && currentSection === 'projects',
          onClick: () => navigateTo('/app?section=projects'),
        },
        {
          label: 'Calendar',
          icon: IconCalendar,
          isActive: location.pathname === '/app' && currentSection === 'calendar',
          onClick: () => navigateTo('/app?section=calendar'),
        },
      ],
    },
    {
      label: 'Team',
      items: [
        {
          label: 'Collaboration',
          icon: IconMessages,
          isActive: location.pathname === '/collaboration',
          onClick: () => navigateTo('/collaboration'),
        },
      ],
    },
  ];

  const adminNavGroups: NavGroup[] = [
    {
      label: 'Overview',
      items: [
        {
          label: 'Dashboard',
          icon: IconLayoutDashboard,
          isActive: location.pathname === '/app' && (!currentSection || currentSection === 'dashboard'),
          onClick: () => navigateTo('/app'),
        },
      ],
    },
    {
      label: 'Team',
      items: [
        {
          label: 'Tasks',
          icon: IconBell,
          isActive: location.pathname === '/app' && currentSection === 'tasks',
          onClick: () => navigateTo('/app?section=tasks'),
        },
        {
          label: 'Team analytics',
          icon: IconFolder,
          isActive: location.pathname === '/app' && currentSection === 'team-analytics',
          onClick: () => navigateTo('/app?section=team-analytics'),
        },
        {
          label: 'Collaboration',
          icon: IconMessages,
          isActive: location.pathname === '/collaboration',
          onClick: () => navigateTo('/collaboration'),
        },
      ],
    },
    {
      label: 'Hiring',
      items: [
        {
          label: 'Job studio',
          icon: IconBriefcase,
          isActive: location.pathname === '/recruitment',
          onClick: () => navigateTo('/recruitment'),
        },
        {
          label: 'Hiring pipeline',
          icon: IconUsersGroup,
          isActive: location.pathname === '/admin/recruitment',
          onClick: () => navigateTo('/admin/recruitment'),
        },
      ],
    },
    {
      label: 'System',
      items: [
        {
          label: 'Users & roles',
          icon: IconShieldPerson,
          isActive: location.pathname === '/admin',
          onClick: () => navigateTo('/admin'),
        },
      ],
    },
  ];

  const renderNavButton = (item: NavItem) => (
    <Button
      key={item.label}
      onClick={item.onClick}
      variant="ghost"
      justifyContent="flex-start"
      px={3}
      py={2}
      h="auto"
      borderRadius="md"
      fontSize="0.95rem"
      fontWeight={600}
      letterSpacing="0.02em"
      color={item.isActive ? '#7ee8d6' : 'var(--font-color)'}
      bg={item.isActive ? 'rgba(126, 232, 214, 0.16)' : 'transparent'}
      w="full"
      _hover={{
        color: '#7ee8d6',
        bg: 'rgba(126, 232, 214, 0.12)',
      }}
    >
      <Flex as="span" align="center" justify="space-between" gap="10px" w="full">
        <Flex as="span" align="center" gap="10px" minW={0}>
          <item.icon size={18} aria-hidden="true" />
          <Box as="span" textAlign="left">
            {item.label}
          </Box>
        </Flex>
        {item.count !== undefined && item.count > 0 && (
          <Badge colorScheme="red" borderRadius="full" px={2} py={0.5} fontSize="0.7rem">
            {item.count}
          </Badge>
        )}
      </Flex>
    </Button>
  );

  const renderNavGroup = (group: NavGroup) => (
    <Stack key={group.label} spacing={2}>
      <Box
        fontSize="11px"
        letterSpacing="0.08em"
        color="gray.400"
        textTransform="uppercase"
        fontWeight={700}
        px={3}
      >
        {group.label}
      </Box>
      {group.items.map(renderNavButton)}
    </Stack>
  );

  return (
    <Flex
      as="aside"
      w={isInDrawer ? 'full' : { base: '200px', md: '240px' }}
      h={isInDrawer ? 'full' : '100vh'}
      position={isInDrawer ? 'relative' : 'sticky'}
      top={isInDrawer ? 'auto' : 0}
      flexShrink={0}
      px={4}
      py={6}
      direction="column"
      justify="space-between"
      bg="var(--dark-color)"
      borderRight="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Box>
        <Image src={logoImage} alt="Task Manager logo" maxW="150px" mb={6} />

        <Stack spacing={5}>
          {(isAdmin ? adminNavGroups : employeeNavGroups).map(renderNavGroup)}
        </Stack>
      </Box>

      <Stack spacing={3}>
        <Badge colorScheme={isAdmin ? 'purple' : 'teal'} borderRadius="full" px={3} py={1} textTransform="capitalize" alignSelf="flex-start">
          {currentUser?.role || 'guest'}
        </Badge>

        <Button
          onClick={() => navigateTo('/profile')}
          colorScheme="teal"
          variant="outline"
          size="sm"
          w="full"
          justifyContent="center"
        >
          <Flex as="span" align="center" gap="10px">
            <IconUserCircle size={18} aria-hidden="true" />
            <Box as="span">View Profile</Box>
          </Flex>
        </Button>

        {onLogoutClick && (
          <Button
            onClick={() => {
              onLogoutClick();
              onNavigate?.();
            }}
            colorScheme="red"
            variant="outline"
            size="sm"
            w="full"
            justifyContent="center"
            borderRadius="md"
            transition="all 0.2s ease"
            _hover={{
              bg: 'red.500',
              color: 'white',
              borderColor: 'red.500',
              transform: 'translateY(-1px)',
              boxShadow: '0 10px 20px rgba(239, 68, 68, 0.24)',
            }}
          >
            Logout
          </Button>
        )}
      </Stack>
    </Flex>
  );
};

export default SideNavbar;
