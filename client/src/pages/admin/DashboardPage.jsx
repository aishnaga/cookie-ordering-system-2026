import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, VStack } from '@chakra-ui/react';
import api from '../../api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, owed: 0, collected: 0 });

  useEffect(() => {
    Promise.all([
      api.get('/orders'),
      api.get('/orders?status=pending')
    ]).then(([all, pending]) => {
      const totalOwed = all.data.reduce((sum, o) => sum + (o.amount_owed || 0), 0);
      const totalPaid = all.data.reduce((sum, o) => sum + o.amount_paid, 0);
      setStats({
        orders: all.data.length,
        pending: pending.data.length,
        owed: totalOwed,
        collected: totalPaid
      });
    });
  }, []);

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Coordinator Dashboard</Heading>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg="white">
            <StatLabel>Total Orders</StatLabel>
            <StatNumber>{stats.orders}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg="yellow.50">
            <StatLabel>Pending Orders</StatLabel>
            <StatNumber>{stats.pending}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg="white">
            <StatLabel>Total Owed</StatLabel>
            <StatNumber>${stats.owed.toFixed(2)}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg="green.50">
            <StatLabel>Total Collected</StatLabel>
            <StatNumber>${stats.collected.toFixed(2)}</StatNumber>
          </Stat>
        </SimpleGrid>
      </VStack>
    </Box>
  );
}
