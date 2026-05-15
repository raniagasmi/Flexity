import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Flex, Heading, HStack, Text, Tooltip, VStack } from '@chakra-ui/react';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { User } from '../../types/user';
import { Profile } from '../profile/Profile';
import Breezycherryblossoms from '../design/Breezycherrybossoms';
import Particles from '../design/particles';
import Pattern from '../design/Pattern';
import Hexagon from '../design/Hexagon';
import ThemeSelector from '../selectors/ThemeSelector';
import BannerSelector from '../selectors/BannerSelector';
import SideNavbar from '../layout/SideNavbar';
import MobileSidebarDrawer from '../layout/MobileSidebarDrawer';

type BannerType = 'Breezy' | 'Particles' | 'Pattern' | 'Hexagon';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState<BannerType>('Particles');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await userService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        authService.logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    const storedBanner = localStorage.getItem('Banner') as BannerType;
    setBanner(storedBanner || 'Particles');
  }, [navigate]);

  const handleProfileSave = async (updatedUser: User) => {
    setUser(updatedUser);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const fullName =
    user?.name ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.email ||
    '';

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Flex bg="var(--light-color)" minH="100vh">
      <Box display={{ base: 'none', md: 'block' }}>
        <SideNavbar onLogoutClick={handleLogout} />
      </Box>
      <Box flex={1} p={{ base: 6, md: 10 }} overflowY="auto">
        <VStack gap={6} align="stretch">
          <Box
            borderRadius="3xl"
            overflow="hidden"
            bg="white"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            boxShadow="0 24px 50px rgba(15, 23, 42, 0.12)"
          >
            <Box w="100%" minH={{ base: '320px', md: '360px' }} position="relative" bg="var(--dark-color)">
            <Box position="absolute" top={4} left={4} zIndex={2}>
              <MobileSidebarDrawer onLogoutClick={handleLogout} />
            </Box>
            <BannerSelector setBanner={setBanner} />
            {banner === 'Breezy' && <Breezycherryblossoms />}
            {banner === 'Particles' && <Particles />}
            {banner === 'Pattern' && <Pattern />}
            {banner === 'Hexagon' && <Hexagon />}
            <Box
              position="absolute"
              inset={0}
              bg="linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.68) 100%)"
            />
            <Box
              position="absolute"
              left={{ base: 5, md: 8 }}
              right={{ base: 5, md: 8 }}
              bottom={{ base: 5, md: 8 }}
              zIndex={2}
            >
              <Flex
                direction={{ base: 'column', md: 'row' }}
                align={{ base: 'flex-start', md: 'flex-end' }}
                justify="space-between"
                gap={6}
              >
                <HStack spacing={5} align="flex-end">
                  <Box bg="white" p={2} borderRadius="full" boxShadow="0 18px 40px rgba(15, 23, 42, 0.18)">
                    <Tooltip label={fullName} hasArrow>
                      <Avatar size="2xl" src={user?.avatarUrl || undefined} name={fullName} />
                    </Tooltip>
                  </Box>
                  <Box color="white" pb={{ base: 0, md: 2 }}>
                    <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.12em" opacity={0.78}>
                      Personal workspace
                    </Text>
                    <Heading size="lg" mt={1}>
                      {fullName}
                    </Heading>
                    <Text mt={2} opacity={0.88}>
                      Manage your account details, password, and profile picture from one place.
                    </Text>
                  </Box>
                </HStack>
              </Flex>
            </Box>
          </Box>
          <Box p={{ base: 5, md: 8 }}>
            {user && <Profile user={user} onSave={handleProfileSave} />}
          </Box>
          </Box>
        </VStack>
      </Box>
      <ThemeSelector />
    </Flex>
  );
};

export default ProfilePage;
