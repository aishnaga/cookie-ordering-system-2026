import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Badge, Select, HStack, useToast } from '@chakra-ui/react';
import api from '../../api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const toast = useToast();

  const load = () => {
    const url = filter ? `/orders?status=${filter}` : '/orders';
    api.get(url).then(res => setOrders(res.data));
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    load();
    toast({ title: `Order ${status}`, status: 'success', duration: 2000 });
  };

  const statusColors = { pending: 'yellow', approved: 'blue', ready_for_pickup: 'purple', picked_up: 'teal', paid: 'green' };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Orders</Heading>
        <HStack>
          <Select placeholder="All statuses" value={filter} onChange={e => setFilter(e.target.value)} w="200px">
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="picked_up">Picked Up</option>
            <option value="paid">Paid</option>
          </Select>
        </HStack>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>ID</Th><Th>Family</Th><Th>Date</Th><Th isNumeric>Amount</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {orders.map(o => (
              <Tr key={o.id}>
                <Td>{o.id}</Td>
                <Td>{o.family_name}</Td>
                <Td>{new Date(o.created_at).toLocaleDateString()}</Td>
                <Td isNumeric>${(o.amount_owed || 0).toFixed(2)}</Td>
                <Td><Badge colorScheme={statusColors[o.status]}>{o.status.replace(/_/g, ' ')}</Badge></Td>
                <Td>
                  <HStack>
                    {o.status === 'pending' && <Button size="xs" colorScheme="blue" onClick={() => updateStatus(o.id, 'approved')}>Approve</Button>}
                    {o.status === 'approved' && <Button size="xs" colorScheme="purple" onClick={() => updateStatus(o.id, 'ready_for_pickup')}>Ready</Button>}
                    {o.status === 'ready_for_pickup' && <Button size="xs" colorScheme="teal" onClick={() => updateStatus(o.id, 'picked_up')}>Picked Up</Button>}
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}
