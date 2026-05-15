import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  IconButton,
  useDisclosure,
} from '@chakra-ui/react';
import { IconMenu2 } from '@tabler/icons-react';
import SideNavbar from './SideNavbar';

interface MobileSidebarDrawerProps {
  onLogoutClick?: () => void;
}

const MobileSidebarDrawer = ({ onLogoutClick }: MobileSidebarDrawerProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton
        aria-label="Open navigation menu"
        icon={<IconMenu2 size={20} />}
        variant="outline"
        colorScheme="teal"
        display={{ base: 'inline-flex', md: 'none' }}
        onClick={onOpen}
      />

      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent maxW="280px">
          <DrawerBody p={0}>
            <SideNavbar onLogoutClick={onLogoutClick} onNavigate={onClose} isInDrawer />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default MobileSidebarDrawer;
