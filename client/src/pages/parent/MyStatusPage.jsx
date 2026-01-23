import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td,
  Badge, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function MyStatusPage() {
  const { selectedFamily } = useFamily();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [balance, setBalance] = useState({ owed: 0, paid: 0, balance: 0 });

  useEffect(() => {
    api.get(`/orders/family/${selectedFamily.id}`).then(res => setOrders(res.data));
    api.get(`/inventory/family/${selectedFamily.id}`).then(res => setInventory(res.data));
    api.get(`/families/${selectedFamily.id}/balance`).then(res => setBalance(res.data));
  }, [selectedFamily.id]);

  const statusColors = {
    pending: 'yellow',
    approved: 'blue',
    ready_for_pickup: 'purple',
    picked_up: 'teal',
    paid: 'green'
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>My Status - {selectedFamily.name}</Heading>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
          <Stat borderWidth={1} borderRadius="lg" p={4}>
            <StatLabel>Amount Owed</StatLabel>
            <StatNumber>${balance.owed.toFixed(2)}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4}>
            <StatLabel>Amount Paid</StatLabel>
            <StatNumber>${balance.paid.toFixed(2)}</StatNumber>
          </Stat>
          <Stat borderWidth={1} borderRadius="lg" p={4} bg={balance.balance > 0 ? 'red.50' : 'green.50'}>
            <StatLabel>Balance</StatLabel>
            <StatNumber color={balance.balance > 0 ? 'red.500' : 'green.500'}>
              ${Math.abs(balance.balance).toFixed(2)}
            </StatNumber>
            <StatHelpText>
              {balance.balance > 0 ? 'Due' : balance.balance < 0 ? 'Credit' : 'Paid in full'}
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        <Box>
          <Heading size="md" mb={3}>My Inventory</Heading>
          {inventory.length === 0 ? (
            <Box p={4} bg="gray.50" borderRadius="md">No cookies in inventory</Box>
          ) : (
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th>Cookie</Th>
                  <Th isNumeric>Quantity</Th>
                </Tr>
              </Thead>
              <Tbody>
                {inventory.map(item => (
                  <Tr key={item.id}>
                    <Td>{item.cookie_name}</Td>
                    <Td isNumeric>{item.quantity}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Box>

        <Box>
          <Heading size="md" mb={3}>My Orders</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Order #</Th>
                <Th>Date</Th>
                <Th isNumeric>Amount</Th>
                <Th isNumeric>Paid</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {orders.map(order => (
                <Tr key={order.id}>
                  <Td>{order.id}</Td>
                  <Td>{new Date(order.created_at).toLocaleDateString()}</Td>
                  <Td isNumeric>${(order.amount_owed || 0).toFixed(2)}</Td>
                  <Td isNumeric>${order.amount_paid.toFixed(2)}</Td>
                  <Td>
                    <Badge colorScheme={statusColors[order.status]}>
                      {order.status.replace(/_/g, ' ')}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Box>
  );
}
