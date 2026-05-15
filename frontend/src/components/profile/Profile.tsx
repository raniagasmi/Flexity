import React, { useEffect, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { CloseIcon, EditIcon } from '@chakra-ui/icons';
import { IconCamera, IconMail, IconShieldCheck, IconUser } from '@tabler/icons-react';
import { userService } from '../../services/user.service';
import { cloudinaryService } from '../../services/cloudinary.service';
import { User } from '../../types/user';

interface ProfileProps {
  user: User;
  onSave: (updatedUser: User) => void;
}

const acceptedImageTypes = ['image/png', 'image/jpeg', 'image/webp'];

export const Profile: React.FC<ProfileProps> = ({ user, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    avatarUrl: user.avatarUrl || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toast = useToast();

  useEffect(() => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  }, [user]);

  const fullName = [formData.firstName, formData.lastName].filter(Boolean).join(' ') || user.email;
  const hasCloudinaryConfig = cloudinaryService.isConfigured();

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      avatarUrl: user.avatarUrl || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!acceptedImageTypes.includes(file.type)) {
      toast({
        title: 'Unsupported image format',
        description: 'Use a PNG, JPG, or WebP image.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      event.target.value = '';
      return;
    }

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await cloudinaryService.uploadProfileImage(file);
      setFormData((current) => ({ ...current, avatarUrl: uploadedUrl }));
      toast({
        title: 'Profile picture uploaded',
        description: 'Save your profile to apply it across the platform.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Could not upload the image.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (formData.newPassword) {
        if (!formData.currentPassword) {
          toast({
            title: 'Current password required',
            description: 'Enter your current password before setting a new one.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
          toast({
            title: 'Passwords do not match',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          return;
        }

        await userService.updatePassword(formData.currentPassword, formData.newPassword);
      }

      const updatedUser = await userService.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        avatarUrl: formData.avatarUrl,
      });

      setIsEditing(false);
      setFormData((current) => ({
        ...current,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      onSave(updatedUser);
      toast({
        title: 'Profile updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Failed to update profile',
        description: error instanceof Error ? error.message : 'Please try again.',
        status: 'error',
        duration: 3500,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Stack spacing={8}>
      <Flex justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4} wrap="wrap">
        <Box>
          <Badge colorScheme="teal" borderRadius="full" px={3} py={1} textTransform="capitalize" mb={3}>
            {user.role}
          </Badge>
          <Heading size="lg" color="var(--font-color)" letterSpacing="-0.03em">
            Account settings
          </Heading>
          <Text mt={2} color="gray.500" maxW="2xl">
            Update your personal details here. Profile pictures can only be changed from this page and will be reused anywhere your avatar appears.
          </Text>
        </Box>

        <IconButton
          aria-label={isEditing ? 'Cancel Edit' : 'Edit Profile'}
          icon={isEditing ? <CloseIcon /> : <EditIcon />}
          onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
          colorScheme={isEditing ? 'red' : 'teal'}
          variant={isEditing ? 'outline' : 'solid'}
          borderRadius="full"
        />
      </Flex>

      <Grid templateColumns={{ base: '1fr', xl: '320px 1fr' }} gap={6}>
        <GridItem>
          <Box
            bg="white"
            borderRadius="3xl"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 45px rgba(15, 23, 42, 0.08)"
            p={6}
            position="relative"
            overflow="hidden"
          >
            <Box
              position="absolute"
              insetX={0}
              top={0}
              h="110px"
              bg="linear-gradient(135deg, rgba(13, 148, 136, 0.94), rgba(14, 116, 144, 0.92), rgba(15, 23, 42, 0.92))"
            />
            <Stack spacing={5} position="relative">
              <Flex justify="center" pt={10}>
                <Box position="relative">
                  <Avatar
                    size="2xl"
                    name={fullName}
                    src={formData.avatarUrl || undefined}
                    border="5px solid white"
                    boxShadow="0 14px 32px rgba(15, 23, 42, 0.18)"
                  />
                  {isEditing && (
                    <IconButton
                      aria-label="Upload profile picture"
                      icon={<Icon as={IconCamera} boxSize={4} />}
                      size="sm"
                      colorScheme="teal"
                      borderRadius="full"
                      position="absolute"
                      right={0}
                      bottom={0}
                      onClick={() => fileInputRef.current?.click()}
                      isLoading={isUploadingImage}
                    />
                  )}
                </Box>
              </Flex>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handleAvatarPick}
              />

              <Box textAlign="center">
                <Heading size="md" color="var(--font-color)">
                  {fullName}
                </Heading>
                <Text color="gray.500" mt={1}>
                  {user.email}
                </Text>
              </Box>

              <SimpleGrid columns={1} spacing={3}>
                <Box bg="gray.50" borderRadius="2xl" p={4}>
                  <HStack spacing={3} align="start">
                    <Icon as={IconUser} color="teal.500" boxSize={5} mt={0.5} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Display name</Text>
                      <Text fontWeight="600" color="gray.800">{fullName}</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box bg="gray.50" borderRadius="2xl" p={4}>
                  <HStack spacing={3} align="start">
                    <Icon as={IconMail} color="teal.500" boxSize={5} mt={0.5} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Email address</Text>
                      <Text fontWeight="600" color="gray.800">{user.email}</Text>
                    </Box>
                  </HStack>
                </Box>

                <Box bg="gray.50" borderRadius="2xl" p={4}>
                  <HStack spacing={3} align="start">
                    <Icon as={IconShieldCheck} color="teal.500" boxSize={5} mt={0.5} />
                    <Box>
                      <Text fontSize="sm" color="gray.500">Access role</Text>
                      <Text fontWeight="600" color="gray.800" textTransform="capitalize">{user.role}</Text>
                    </Box>
                  </HStack>
                </Box>
              </SimpleGrid>

              {isEditing && (
                <Text fontSize="sm" color={hasCloudinaryConfig ? 'gray.500' : 'orange.500'}>
                  {hasCloudinaryConfig
                    ? 'Upload a new profile picture here, then save your profile to publish it everywhere.'
                    : 'Cloudinary is not configured yet. Add the Vite Cloudinary variables before uploading images.'}
                </Text>
              )}
            </Stack>
          </Box>
        </GridItem>

        <GridItem>
          <Box
            as="form"
            onSubmit={handleSubmit}
            bg="white"
            borderRadius="3xl"
            borderWidth="1px"
            borderColor="blackAlpha.100"
            boxShadow="0 20px 45px rgba(15, 23, 42, 0.08)"
            p={{ base: 5, md: 8 }}
          >
            {isEditing ? (
              <Stack spacing={7}>
                <Box>
                  <Heading size="md" color="var(--font-color)">Personal information</Heading>
                  <Text color="gray.500" mt={2}>
                    Keep your name, email, and avatar current so the rest of the workspace stays in sync.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <FormControl color="var(--font-color)">
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      borderColor="teal.200"
                      focusBorderColor="teal.400"
                      bg="gray.50"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl color="var(--font-color)">
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      borderColor="teal.200"
                      focusBorderColor="teal.400"
                      bg="gray.50"
                      borderRadius="xl"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl color="var(--font-color)">
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    borderColor="teal.200"
                    focusBorderColor="teal.400"
                    bg="gray.50"
                    borderRadius="xl"
                  />
                </FormControl>

                <Divider />

                <Box>
                  <Heading size="md" color="var(--font-color)">Change password</Heading>
                  <Text color="gray.500" mt={2}>
                    Leave these fields empty if you only want to save your profile details.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                  <FormControl color="var(--font-color)">
                    <FormLabel>Current Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      borderColor="teal.200"
                      focusBorderColor="teal.400"
                      bg="gray.50"
                      borderRadius="xl"
                    />
                  </FormControl>

                  <FormControl color="var(--font-color)">
                    <FormLabel>New Password</FormLabel>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      borderColor="teal.200"
                      focusBorderColor="teal.400"
                      bg="gray.50"
                      borderRadius="xl"
                    />
                  </FormControl>
                </SimpleGrid>

                <FormControl color="var(--font-color)">
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    borderColor="teal.200"
                    focusBorderColor="teal.400"
                    bg="gray.50"
                    borderRadius="xl"
                  />
                  <FormHelperText>
                    Password changes are only submitted when a new password is provided.
                  </FormHelperText>
                </FormControl>

                <Flex justify="flex-end" gap={3} wrap="wrap">
                  <Button variant="ghost" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    colorScheme="teal"
                    borderRadius="full"
                    px={6}
                    isLoading={isSubmitting}
                    loadingText="Saving"
                    isDisabled={isUploadingImage}
                  >
                    Save Changes
                  </Button>
                </Flex>
              </Stack>
            ) : (
              <Stack spacing={6}>
                <Box>
                  <Heading size="md" color="var(--font-color)">Profile overview</Heading>
                  <Text color="gray.500" mt={2}>
                    Your saved profile details are shown below.
                  </Text>
                </Box>

                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                  <Box bg="gray.50" borderRadius="2xl" p={5}>
                    <Text fontSize="sm" color="gray.500">First Name</Text>
                    <Text color="gray.800" fontSize="lg" fontWeight="600" mt={1}>{user.firstName}</Text>
                  </Box>

                  <Box bg="gray.50" borderRadius="2xl" p={5}>
                    <Text fontSize="sm" color="gray.500">Last Name</Text>
                    <Text color="gray.800" fontSize="lg" fontWeight="600" mt={1}>{user.lastName}</Text>
                  </Box>

                  <Box bg="gray.50" borderRadius="2xl" p={5}>
                    <Text fontSize="sm" color="gray.500">Email</Text>
                    <Text color="gray.800" fontSize="lg" fontWeight="600" mt={1}>{user.email}</Text>
                  </Box>

                  <Box bg="gray.50" borderRadius="2xl" p={5}>
                    <Text fontSize="sm" color="gray.500">Profile Picture</Text>
                    <Text color="gray.800" fontSize="lg" fontWeight="600" mt={1}>
                      {user.avatarUrl ? 'Configured' : 'Using initials'}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Stack>
            )}
          </Box>
        </GridItem>
      </Grid>
    </Stack>
  );
};

export default Profile;
