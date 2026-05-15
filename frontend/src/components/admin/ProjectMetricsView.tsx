import React from 'react';
import {
  Badge,
  Box,
  Card,
  CardBody,
  Fade,
  Flex,
  Heading,
  Progress,
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
  Table,
  TableCaption,
  Tbody,
  Tabs,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react';
import { ProjectMetrics } from '../../types/analytics';

interface ProjectMetricsViewProps {
  projects: ProjectMetrics[];
  isLoading?: boolean;
}

const ProjectCard: React.FC<{ project: ProjectMetrics }> = ({ project }) => {
  const completionColor =
    project.completionPercentage >= 75
      ? 'green'
      : project.completionPercentage >= 50
        ? 'blue'
        : project.completionPercentage >= 25
          ? 'orange'
          : 'red';

  return (
    <Card>
      <CardBody>
        <Stack spacing={3}>
          <Heading size="sm">{project.name}</Heading>

          <Box>
            <Flex justify="space-between" mb={1}>
              <Text fontSize="sm" fontWeight="medium">
                Completion
              </Text>
              <Badge colorScheme={completionColor}>
                {project.completionPercentage}%
              </Badge>
            </Flex>
            <Progress
              value={project.completionPercentage}
              size="sm"
              colorScheme={completionColor}
              borderRadius="md"
            />
          </Box>

          <SimpleGrid columns={3} spacing={2} fontSize="xs">
            <Box>
              <Text color="gray.600">To Do</Text>
              <Text fontWeight="bold" color="gray.600">
                {project.tasksByStatus.TODO}
              </Text>
            </Box>
            <Box>
              <Text color="gray.600">In Progress</Text>
              <Text fontWeight="bold" color="blue.600">
                {project.tasksByStatus.IN_PROGRESS}
              </Text>
            </Box>
            <Box>
              <Text color="gray.600">Done</Text>
              <Text fontWeight="bold" color="green.600">
                {project.tasksByStatus.DONE}
              </Text>
            </Box>
          </SimpleGrid>

          <SimpleGrid columns={2} spacing={2} fontSize="xs">
            <Box>
              <Text color="gray.600">Avg Time</Text>
              <Text fontWeight="bold">{project.avgCompletionTime}h</Text>
            </Box>
            <Box>
              <Text color="gray.600">On Time</Text>
              <Text fontWeight="bold">{project.onTimeCompletionRate}%</Text>
            </Box>
          </SimpleGrid>

          {project.bottlenecks.length > 0 && (
            <Box p={2} bg="red.50" borderRadius="md">
              <Text fontSize="xs" fontWeight="bold" color="red.700">
                <span role="img" aria-label="Warning">⚠️</span> {project.bottlenecks.length} Bottleneck(s)
              </Text>
              <Text fontSize="xs" color="red.600">
                Tasks stuck in progress for 48+ hours
              </Text>
            </Box>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
};

const WorkloadDistributionTable: React.FC<{ project: ProjectMetrics }> = ({ project }) => (
  <Box overflowX="auto">
    <Table size="sm">
      <TableCaption placement="top">Workload distribution by employee for this project.</TableCaption>
      <Thead bg="gray.100">
        <Tr>
          <Th>Employee</Th>
          <Th isNumeric>Tasks</Th>
          <Th isNumeric>Load</Th>
          <Th>Status</Th>
        </Tr>
      </Thead>
      <Tbody>
        {project.workloadDistribution.map((item) => {
          const loadColor =
            item.load > 15
              ? 'red'
              : item.load > 8
                ? 'yellow'
                : item.load > 0
                  ? 'green'
                  : 'gray';

          return (
            <Tr key={item.employeeId}>
              <Td fontSize="sm">{item.employeeName}</Td>
              <Td isNumeric fontWeight="bold">
                {item.taskCount}
              </Td>
              <Td isNumeric>
                <Badge colorScheme={loadColor}>{item.load}</Badge>
              </Td>
              <Td>
                <Badge
                  colorScheme={
                    item.load > 15
                      ? 'red'
                      : item.load > 8
                        ? 'orange'
                        : 'green'
                  }
                  fontSize="xs"
                >
                  {item.load > 15
                    ? 'Overloaded'
                    : item.load > 8
                      ? 'High'
                      : item.load > 0
                        ? 'Normal'
                        : 'Idle'}
                </Badge>
              </Td>
            </Tr>
          );
        })}
      </Tbody>
    </Table>
  </Box>
);

export const ProjectMetricsView: React.FC<ProjectMetricsViewProps> = ({
  projects,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <Stack spacing={6}>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={`project-card-skeleton-${index}`} height="120px" borderRadius="md" />
          ))}
        </SimpleGrid>

        <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
          <Stack spacing={4}>
            <SkeletonText noOfLines={1} width="35%" />
            <Skeleton height="40px" />
            <Box overflowX="auto">
              <Table size="sm">
                <TableCaption placement="top">Loading project workload distribution.</TableCaption>
                <Thead bg="gray.100">
                  <Tr>
                    <Th>Employee</Th>
                    <Th isNumeric>Tasks</Th>
                    <Th isNumeric>Load</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Tr key={`project-table-skeleton-${index}`} h="48px">
                      <Td><Skeleton height="20px" /></Td>
                      <Td><Skeleton height="20px" /></Td>
                      <Td><Skeleton height="20px" /></Td>
                      <Td><Skeleton height="20px" /></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  }

  if (projects.length === 0) {
    return (
      <Box bg="white" borderRadius="lg" p={8} textAlign="center" boxShadow="sm">
        <Text color="gray.500">No projects yet. Create a conversation to start!</Text>
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {projects.map((project) => (
          <ProjectCard key={project.projectId} project={project} />
        ))}
      </SimpleGrid>

      <Box bg="white" borderRadius="lg" p={4} boxShadow="sm">
        <Heading size="md" mb={4}>
          Project Details
        </Heading>

        <Tabs>
          <TabList mb={4}>
            {projects.map((project) => (
              <Tab key={project.projectId}>{project.name}</Tab>
            ))}
          </TabList>

          <TabPanels>
            {projects.map((project) => (
              <TabPanel key={project.projectId}>
                <Fade in={true}>
                  <VStack align="start" spacing={4}>
                    <Stack w="full" spacing={3}>
                      <Stat>
                        <StatLabel>Completion Status</StatLabel>
                        <StatNumber>{project.completionPercentage}%</StatNumber>
                        <StatHelpText>
                          {project.tasksByStatus.DONE} of{' '}
                          {Object.values(project.tasksByStatus).reduce((a, b) => a + b, 0)} tasks done
                        </StatHelpText>
                      </Stat>

                      <Progress
                        value={project.completionPercentage}
                        colorScheme={
                          project.completionPercentage >= 75
                            ? 'green'
                            : project.completionPercentage >= 50
                              ? 'blue'
                              : 'orange'
                        }
                      />
                    </Stack>

                    <Box w="full">
                      <Heading size="sm" mb={3}>
                        Workload Distribution
                      </Heading>
                      <WorkloadDistributionTable project={project} />
                    </Box>

                    <Stack w="full" direction="row" spacing={4}>
                      <Stat flex={1}>
                        <StatLabel>Average Completion Time</StatLabel>
                        <StatNumber>{project.avgCompletionTime}h</StatNumber>
                      </Stat>
                      <Stat flex={1}>
                        <StatLabel>On-Time Completion Rate</StatLabel>
                        <StatNumber>{project.onTimeCompletionRate}%</StatNumber>
                      </Stat>
                    </Stack>
                  </VStack>
                </Fade>
              </TabPanel>
            ))}
          </TabPanels>
        </Tabs>
      </Box>
    </Stack>
  );
};
