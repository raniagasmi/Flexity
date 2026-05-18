import {
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  SimpleGrid,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ArrowForwardIcon, CalendarIcon, CheckCircleIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { ClipboardCheck, MessageSquareText, Users } from 'lucide-react';
import { authService } from '../../services/auth.service';
import logoImage from '../../assets/images/logo.png';

const metrics = [
  { value: '38%', label: 'faster task handoffs after teams connect execution and collaboration in one flow' },
  { value: '2.4x', label: 'quicker project planning turnaround with collaborative AI-assisted drafting' },
  { value: '94%', label: 'weekly active usage across operations, delivery, and team leads' },
];

const logos = ['Northstar Labs', 'Atlas Retail', 'PeopleDock', 'Verve Health', 'Buildlane', 'CraftOps'];

const useCases = [
  {
    title: 'Delivery teams',
    copy: 'Run the task board, reminders, and team collaboration without context switching into separate project tools.',
    icon: ClipboardCheck,
  },
  {
    title: 'Project teams',
    copy: 'Plan milestones, track ownership, and align stakeholders from the same workspace your tasks live in.',
    icon: MessageSquareText,
  },
  {
    title: 'Cross-functional managers',
    copy: 'Keep projects, priorities, and ownership visible in one operating system instead of scattered tools.',
    icon: Users,
  },
];

const testimonials = [
  {
    quote: 'We stopped losing project context in Slack and task updates in email. The team finally works from one source of truth.',
    author: 'Salma B.',
    role: 'Operations Director, Atlas Retail',
  },
  {
    quote: 'The collaboration workspace saves our leads time, but the bigger win is that everyone can review and react without leaving the board.',
    author: 'Youssef K.',
    role: 'Head of Delivery, Northstar Labs',
  },
  {
    quote: 'The product feels like task execution and team collaboration were designed together from day one.',
    author: 'Nour A.',
    role: 'Program Lead, Verve Health',
  },
];

const plans = [
  {
    name: 'Team plan',
    price: '$19',
    audience: 'For delivery teams who need execution clarity first.',
    accent: 'teal',
    features: ['Task board and reminders', 'Collaboration workspace', 'Role-based employee views', 'Up to 25 users'],
  },
  {
    name: 'Business plan',
    price: '$39',
    audience: 'For teams coordinating projects and cross-functional delivery.',
    accent: 'orange',
    features: ['Everything in Team', 'Advanced project views', 'Team analytics', 'Priority collaboration workflows'],
  },
  {
    name: 'Scale plan',
    price: 'Custom',
    audience: 'For larger orgs needing governance and rollout support.',
    accent: 'blue',
    features: ['Everything in Business', 'Advanced admin controls', 'Priority onboarding', 'Department rollouts and support'],
  },
];

const tourSteps = [
  {
    label: 'Task board',
    title: 'Track execution with visible ownership',
    description: 'Move work across priority lanes, trigger reminders, and keep momentum visible without manual follow-up.',
  },
  {
    label: 'Collaboration',
    title: 'Discuss work where the decisions happen',
    description: 'Use a shared conversation space to align teammates, review AI-generated task proposals, and approve next actions.',
  },
];

const MarketingLandingPage = () => {
  const isAuthenticated = authService.isAuthenticated();
  const primaryHref = isAuthenticated ? '/app' : '/register';

  return (
    <Box bg="#f6f4ee" minH="100vh" color="#14213d">
      <Box
        position="sticky"
        top={0}
        zIndex={30}
        borderBottom="1px solid rgba(20,33,61,0.08)"
        bg="rgba(246,244,238,0.88)"
        backdropFilter="blur(14px)"
      >
        <Container maxW="1280px" py={4}>
          <Flex align="center" justify="space-between" gap={4} wrap="wrap">
            <HStack spacing={3}>
              <Image src={logoImage} alt="Task management workspace logo" h="40px" objectFit="contain" />
            </HStack>

            <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
              <Link href="#proof" fontWeight="600" color="#52607a">Proof</Link>
              <Link href="#tour" fontWeight="600" color="#52607a">Product Tour</Link>
              <Link href="#pricing" fontWeight="600" color="#52607a">Plans</Link>
            </HStack>

            <HStack spacing={3}>
              <Button
                as={Link}
                href="#book-demo"
                variant="outline"
                borderColor="#319795"
                color="#216e6d"
                leftIcon={<CalendarIcon />}
                borderRadius="full"
              >
                Book demo
              </Button>
              <Button
                as={RouterLink}
                to={primaryHref}
                bg="#319795"
                color="white"
                _hover={{ bg: '#216e6d' }}
                rightIcon={<ArrowForwardIcon />}
                borderRadius="full"
              >
                {isAuthenticated ? 'Open workspace' : 'Sign up free'}
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="1280px" py={{ base: 10, md: 16 }}>
        <Grid templateColumns={{ base: '1fr', xl: '1.1fr 0.9fr' }} gap={10} alignItems="center">
          <Stack spacing={7}>
            <Badge
              alignSelf="flex-start"
              px={4}
              py={1.5}
              borderRadius="full"
              bg="#d9f3f0"
              color="#216e6d"
              fontWeight="700"
              letterSpacing="0.02em"
            >
              Built for teams running tasks and collaboration together
            </Badge>

            <Heading
              fontSize={{ base: '3rem', md: '4.5rem' }}
              lineHeight="0.95"
              letterSpacing="-0.06em"
              maxW="12ch"
            >
              Task execution + team collaboration in one workspace.
            </Heading>

            <Text fontSize={{ base: 'lg', md: 'xl' }} color="#52607a" maxW="34ch">
              Align projects, people, and delivery priorities in one operating system so work keeps moving and context never gets lost.
            </Text>

            <HStack spacing={4} wrap="wrap">
              <Button
                as={RouterLink}
                to={primaryHref}
                size="lg"
              bg="#319795"
              color="white"
              _hover={{ bg: '#216e6d' }}
              rightIcon={<ArrowForwardIcon />}
              borderRadius="full"
            >
                {isAuthenticated ? 'Go to app' : 'Start free'}
              </Button>
              <Button
                as={Link}
                href="#book-demo"
                size="lg"
                variant="ghost"
                color="#216e6d"
                leftIcon={<CalendarIcon />}
              >
                Book a demo
              </Button>
            </HStack>

            <HStack spacing={6} wrap="wrap" color="#52607a">
              <Text fontWeight="700">Shared task board</Text>
              <Text fontWeight="700">AI collaboration</Text>
              <Text fontWeight="700">Project visibility</Text>
            </HStack>
          </Stack>

          <Box position="relative">
            <Box
              position="absolute"
              inset="-24px auto auto -24px"
              w="200px"
              h="200px"
              borderRadius="full"
              bg="rgba(49,151,149,0.18)"
              filter="blur(22px)"
            />

            <Stack spacing={4} position="relative">
              <Box
                bg="#184e4d"
                color="white"
                borderRadius="32px"
                p={5}
                boxShadow="0 35px 80px rgba(20,33,61,0.22)"
              >
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontWeight="800" letterSpacing="-0.03em">
                    Delivery board
                  </Text>
                  <Badge bg="rgba(255,255,255,0.12)" color="white" borderRadius="full">
                    live
                  </Badge>
                </Flex>

                <SimpleGrid columns={3} gap={3}>
                  {[
                    { title: 'Ready', items: ['Finalize sprint goals', 'Review backlog priorities'] },
                    { title: 'In Progress', items: ['API handoff', 'Stakeholder sync'] },
                    { title: 'Done', items: ['Publish release notes', 'Ship reminder flow'] },
                  ].map((column) => (
                    <Box key={column.title} bg="rgba(255,255,255,0.08)" borderRadius="24px" p={3}>
                      <Text fontSize="sm" fontWeight="700" mb={3}>
                        {column.title}
                      </Text>
                      <VStack align="stretch" spacing={2}>
                        {column.items.map((item) => (
                          <Box key={item} bg="rgba(255,255,255,0.12)" borderRadius="18px" px={3} py={2}>
                            <Text fontSize="xs">{item}</Text>
                          </Box>
                        ))}
                      </VStack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>

              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <Box bg="white" borderRadius="28px" p={5} boxShadow="0 24px 50px rgba(20,33,61,0.12)">
                  <HStack justify="space-between" mb={4}>
                    <HStack>
                      <Icon as={MessageSquareText} boxSize={4} color="#319795" />
                      <Text fontWeight="800">Collaboration</Text>
                    </HStack>
                    <Badge colorScheme="teal" borderRadius="full">AI proposals</Badge>
                  </HStack>
                  <Stack spacing={3}>
                    <Box borderLeft="4px solid #0f8b8d" pl={3}>
                      <Text fontSize="sm" fontWeight="700">Product lead</Text>
                      <Text fontSize="sm" color="#52607a">Break the launch into owner-ready tasks.</Text>
                    </Box>
                    <Box borderLeft="4px solid #ff7a59" pl={3}>
                      <Text fontSize="sm" fontWeight="700">AI</Text>
                      <Text fontSize="sm" color="#52607a">Drafted execution plan and assignee suggestions.</Text>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Stack>
          </Box>
        </Grid>
      </Container>

      <Box id="proof" bg="#184e4d" color="white" py={{ base: 12, md: 16 }}>
        <Container maxW="1280px">
          <Stack spacing={10}>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
              {metrics.map((metric) => (
                <Box key={metric.value} borderTop="1px solid rgba(255,255,255,0.2)" pt={5}>
                  <Heading fontSize={{ base: '3xl', md: '4xl' }} letterSpacing="-0.05em">
                    {metric.value}
                  </Heading>
                  <Text mt={3} color="rgba(255,255,255,0.72)">
                    {metric.label}
                  </Text>
                </Box>
              ))}
            </SimpleGrid>

            <Divider borderColor="rgba(255,255,255,0.12)" />

            <Stack spacing={4}>
              <Text fontSize="sm" textTransform="uppercase" letterSpacing="0.12em" color="rgba(255,255,255,0.6)">
                Trusted by product, operations, and delivery teams
              </Text>
              <SimpleGrid columns={{ base: 2, md: 6 }} gap={4}>
                {logos.map((logo) => (
                  <Box key={logo} borderRadius="20px" bg="rgba(255,255,255,0.06)" px={4} py={5} textAlign="center">
                    <Text fontWeight="700" color="rgba(255,255,255,0.88)">{logo}</Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Container maxW="1280px" py={{ base: 12, md: 16 }}>
        <Stack spacing={8}>
          <Badge alignSelf="flex-start" px={4} py={1.5} borderRadius="full" bg="#dff5ef" color="#216e6d">
            Use cases
          </Badge>
          <Heading fontSize={{ base: '2xl', md: '4xl' }} letterSpacing="-0.05em" maxW="14ch">
            One workspace, different teams, one shared operating rhythm.
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {useCases.map((card) => (
              <Box key={card.title} bg="white" borderRadius="28px" p={6} boxShadow="0 18px 40px rgba(20,33,61,0.08)">
                <Box w="48px" h="48px" borderRadius="18px" bg="#d9f3f0" display="grid" placeItems="center" mb={5}>
                  <Icon as={card.icon} boxSize={5} color="#216e6d" />
                </Box>
                <Heading size="md" mb={3}>{card.title}</Heading>
                <Text color="#52607a">{card.copy}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box id="tour" bg="#fffaf2" py={{ base: 12, md: 16 }}>
        <Container maxW="1280px">
          <Grid templateColumns={{ base: '1fr', xl: '0.9fr 1.1fr' }} gap={10} alignItems="start">
            <Stack spacing={6}>
              <Badge alignSelf="flex-start" px={4} py={1.5} borderRadius="full" bg="#319795" color="white">
                Product tour
              </Badge>
              <Heading fontSize={{ base: '2xl', md: '4xl' }} letterSpacing="-0.05em">
                A short walkthrough from task movement to team alignment.
              </Heading>
              <Text color="#52607a" fontSize="lg">
                The workflow is designed so execution and collaboration support each other instead of living in separate systems.
              </Text>
              <VStack align="stretch" spacing={4}>
                {tourSteps.map((step, index) => (
                  <Box key={step.label} bg="white" borderRadius="24px" p={5} boxShadow="0 16px 32px rgba(20,33,61,0.08)">
                    <HStack mb={3} spacing={3}>
                      <Box w="32px" h="32px" borderRadius="full" bg="#319795" color="white" display="grid" placeItems="center" fontWeight="800">
                        {index + 1}
                      </Box>
                      <Badge colorScheme="orange" borderRadius="full">{step.label}</Badge>
                    </HStack>
                    <Text fontWeight="800" mb={2}>{step.title}</Text>
                    <Text color="#52607a">{step.description}</Text>
                  </Box>
                ))}
              </VStack>
            </Stack>

            <Stack spacing={4}>
              <Box bg="#184e4d" color="white" borderRadius="32px" p={6}>
                <HStack justify="space-between" mb={5}>
                  <Text fontWeight="800">Workspace timeline</Text>
                  <Badge bg="rgba(255,255,255,0.12)" color="white">week 18</Badge>
                </HStack>
                <VStack align="stretch" spacing={4}>
                  <Box bg="rgba(255,255,255,0.08)" borderRadius="24px" p={4}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="700">Tasks board</Text>
                      <Badge colorScheme="teal" borderRadius="full">12 active</Badge>
                    </HStack>
                    <Text color="rgba(255,255,255,0.72)" fontSize="sm">
                      Priority work, deadlines, reminders, and ownership stay visible for the full team.
                    </Text>
                  </Box>
                  <Box bg="rgba(255,255,255,0.08)" borderRadius="24px" p={4}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="700">Collaboration thread</Text>
                      <Badge colorScheme="purple" borderRadius="full">AI draft</Badge>
                    </HStack>
                    <Text color="rgba(255,255,255,0.72)" fontSize="sm">
                      Team members review generated proposals, approve next steps, and keep decisions documented.
                    </Text>
                  </Box>
                  <Box bg="rgba(255,255,255,0.08)" borderRadius="24px" p={4}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="700">Project planning</Text>
                      <Badge bg="#dff5f3" color="#216e6d" borderRadius="full">on track</Badge>
                    </HStack>
                    <Text color="rgba(255,255,255,0.72)" fontSize="sm">
                      Teams align milestones, owners, and next steps without leaving the workspace timeline.
                    </Text>
                  </Box>
                </VStack>
              </Box>
            </Stack>
          </Grid>
        </Container>
      </Box>

      <Container maxW="1280px" py={{ base: 12, md: 16 }}>
        <Stack spacing={8}>
          <Badge alignSelf="flex-start" px={4} py={1.5} borderRadius="full" bg="#e2ecff" color="#2855a3">
            Testimonials
          </Badge>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            {testimonials.map((item) => (
              <Box key={item.author} bg="white" borderRadius="28px" p={6} boxShadow="0 18px 40px rgba(20,33,61,0.08)">
                <Text fontSize="lg" lineHeight="1.7" mb={6}>
                  "{item.quote}"
                </Text>
                <Text fontWeight="800">{item.author}</Text>
                <Text color="#52607a">{item.role}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Box id="pricing" bg="#184e4d" color="white" py={{ base: 12, md: 16 }}>
        <Container maxW="1280px">
          <Stack spacing={8}>
            <Badge alignSelf="flex-start" px={4} py={1.5} borderRadius="full" bg="rgba(255,255,255,0.12)" color="white">
              Plans
            </Badge>
            <Heading fontSize={{ base: '2xl', md: '4xl' }} letterSpacing="-0.05em" maxW="12ch">
              Choose the plan that matches how your team executes and collaborates.
            </Heading>
            <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
              {plans.map((plan) => (
                <Box
                  key={plan.name}
                  bg={plan.name === 'Business plan' ? '#dff5f3' : 'rgba(255,255,255,0.06)'}
                  color={plan.name === 'Business plan' ? '#14213d' : 'white'}
                  borderRadius="30px"
                  p={6}
                  boxShadow={plan.name === 'Business plan' ? '0 24px 50px rgba(0,0,0,0.18)' : 'none'}
                >
                  <HStack justify="space-between" mb={4}>
                    <Badge colorScheme={plan.accent as 'teal' | 'orange' | 'blue'} borderRadius="full">
                      {plan.name}
                    </Badge>
                    {plan.name === 'Business plan' && (
                      <Badge bg="#216e6d" color="white" borderRadius="full">Most popular</Badge>
                    )}
                  </HStack>
                  <Heading size="lg" mb={2}>{plan.price}</Heading>
                  <Text mb={5} color={plan.name === 'Business plan' ? '#52607a' : 'rgba(255,255,255,0.72)'}>
                    {plan.audience}
                  </Text>
                  <VStack align="stretch" spacing={3}>
                    {plan.features.map((feature) => (
                      <HStack key={feature} align="flex-start">
                        <CheckCircleIcon mt="2px" color={plan.name === 'Business plan' ? '#216e6d' : '#7ee8d6'} />
                        <Text>{feature}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </Stack>
        </Container>
      </Box>

      <Box id="book-demo" bg="#f6f4ee" py={{ base: 12, md: 16 }}>
        <Container maxW="1280px">
          <Box borderRadius="36px" bg="#319795" color="white" p={{ base: 8, md: 12 }} boxShadow="0 30px 80px rgba(49,151,149,0.28)">
            <Grid templateColumns={{ base: '1fr', lg: '1.2fr 0.8fr' }} gap={8} alignItems="center">
              <Stack spacing={4}>
                <Badge alignSelf="flex-start" bg="rgba(255,255,255,0.16)" color="white" borderRadius="full">
                  Conversion path
                </Badge>
                <Heading fontSize={{ base: '2xl', md: '4xl' }} letterSpacing="-0.05em">
                  Bring task execution and team collaboration into one command center.
                </Heading>
                <Text fontSize="lg" color="rgba(255,255,255,0.88)" maxW="38ch">
                  Start with a self-serve workspace or book a walkthrough to see how delivery, project, and leadership teams use the platform together.
                </Text>
              </Stack>

              <Stack spacing={4}>
                <Button
                  as={RouterLink}
                  to={primaryHref}
                  size="lg"
                  bg="#184e4d"
                  color="white"
                  _hover={{ bg: '#216e6d' }}
                  rightIcon={<ArrowForwardIcon />}
                  borderRadius="full"
                >
                  {isAuthenticated ? 'Open workspace' : 'Create account'}
                </Button>
                <Button
                  as={Link}
                  href="mailto:demo@taskflowworkspace.com?subject=Book%20a%20TaskFlow%20demo"
                  size="lg"
                  variant="outline"
                  borderColor="white"
                  color="white"
                  _hover={{ bg: 'rgba(255,255,255,0.08)' }}
                  leftIcon={<CalendarIcon />}
                  borderRadius="full"
                >
                  Book demo by email
                </Button>
              </Stack>
            </Grid>
          </Box>
        </Container>
      </Box>

      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        zIndex={25}
        display={{ base: 'block', md: 'none' }}
        bg="rgba(20,33,61,0.94)"
        color="white"
        borderTop="1px solid rgba(255,255,255,0.08)"
        px={4}
        py={3}
      >
        <HStack justify="space-between" spacing={3}>
          <Text fontSize="sm" fontWeight="700">
            Sign up or book a demo
          </Text>
          <HStack spacing={2}>
            <Button as={Link} href="#book-demo" size="sm" variant="ghost" color="white">
              Demo
            </Button>
            <Button as={RouterLink} to={primaryHref} size="sm" bg="#319795" color="white" _hover={{ bg: '#216e6d' }}>
              {isAuthenticated ? 'Open app' : 'Sign up'}
            </Button>
          </HStack>
        </HStack>
      </Box>
    </Box>
  );
};

export default MarketingLandingPage;
