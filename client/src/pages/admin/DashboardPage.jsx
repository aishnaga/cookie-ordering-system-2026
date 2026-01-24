import { useState, useEffect } from 'react';
import { Box, Heading, SimpleGrid, Stat, StatLabel, StatNumber, VStack, Button, useToast, HStack } from '@chakra-ui/react';
import api from '../../api';

export default function DashboardPage() {
  const [stats, setStats] = useState({ orders: 0, pending: 0, owed: 0, collected: 0 });
  const toast = useToast();

  const loadStats = () => {
    Promise.all([
      api.get('/orders'),
      api.get('/orders?status=pending')
    ]).then(([all, pending]) => {
      const totalOwed = all.data.reduce((sum, o) => sum + (o.amount_owed || 0), 0);
      const totalPaid = all.data.reduce((sum, o) => sum + (o.cash_paid || 0) + (o.check_paid || 0) + (o.credit_card_paid || 0), 0);
      setStats({
        orders: all.data.length,
        pending: pending.data.length,
        owed: totalOwed,
        collected: totalPaid
      });
    });
  };

  useEffect(() => {
    loadStats();
  }, []);

  const resetData = async () => {
    if (window.confirm('Are you sure you want to delete ALL orders, inventory, and payments? This cannot be undone.')) {
      await api.post('/admin/reset-data');
      toast({ title: 'All data cleared', status: 'success', duration: 2000 });
      loadStats();
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading>Coordinator Dashboard</Heading>
          <Button colorScheme="red" size="sm" onClick={resetData}>Reset All Data</Button>
        </HStack>
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
