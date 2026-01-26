import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Badge, Select, HStack, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure, NumberInput, NumberInputField, Text } from '@chakra-ui/react';
import api from '../../api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('');
  const [cookies, setCookies] = useState([]);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editItems, setEditItems] = useState({});
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const load = () => {
    const url = filter ? `/orders?status=${filter}` : '/orders';
    api.get(url).then(res => setOrders(res.data));
    api.get('/cookies').then(res => setCookies(res.data));
  };
  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    load();
    toast({ title: `Order ${status}`, status: 'success', duration: 2000 });
  };

  const deleteOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      await api.delete(`/orders/${id}`);
      load();
      toast({ title: 'Order deleted', status: 'success', duration: 2000 });
    }
  };

  const openEditModal = (order) => {
    setEditingOrder(order);
    const items = {};
    order.line_items?.forEach(item => {
      const cookie = cookies.find(c => c.name === item.cookie_name);
      if (cookie) items[cookie.id] = item.quantity;
    });
    setEditItems(items);
    onOpen();
  };

  const saveEdit = async () => {
    const items = Object.entries(editItems)
      .filter(([_, qty]) => qty > 0)
      .map(([cookie_variety_id, quantity]) => ({
        cookie_variety_id: Number(cookie_variety_id),
        quantity
      }));
    await api.put(`/orders/${editingOrder.id}`, { items });
    onClose();
    load();
    toast({ title: 'Order updated', status: 'success', duration: 2000 });
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
          <Thead><Tr><Th>ID</Th><Th>Family</Th><Th>Cookies</Th><Th>Date</Th><Th isNumeric>Amount</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {orders.map(o => (
              <Tr key={o.id}>
                <Td>{o.id}</Td>
                <Td>{o.family_name}</Td>
                <Td>{o.line_items?.map(item => `${item.cookie_name} (${item.quantity})`).join(', ') || '-'}</Td>
                <Td>{new Date(o.created_at).toLocaleDateString()}</Td>
                <Td isNumeric>${(o.amount_owed || 0).toFixed(2)}</Td>
                <Td><Badge colorScheme={statusColors[o.status]}>{o.status.replace(/_/g, ' ')}</Badge></Td>
                <Td>
                  <HStack>
                    {o.status === 'pending' && <Button size="xs" colorScheme="blue" onClick={() => updateStatus(o.id, 'approved')}>Approve</Button>}
                    {o.status === 'approved' && <Button size="xs" colorScheme="purple" onClick={() => updateStatus(o.id, 'ready_for_pickup')}>Ready</Button>}
                    {o.status === 'ready_for_pickup' && <Button size="xs" colorScheme="teal" onClick={() => updateStatus(o.id, 'picked_up')}>Picked Up</Button>}
                    <Button size="xs" onClick={() => openEditModal(o)}>Edit</Button>
                    <Button size="xs" colorScheme="red" onClick={() => deleteOrder(o.id)}>Delete</Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Order #{editingOrder?.id} - {editingOrder?.family_name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Table size="sm">
              <Thead>
                <Tr><Th>Cookie</Th><Th isNumeric>Quantity</Th></Tr>
              </Thead>
              <Tbody>
                {cookies.map(cookie => (
                  <Tr key={cookie.id}>
                    <Td>{cookie.name}</Td>
                    <Td isNumeric>
                      <NumberInput
                        size="sm"
                        maxW={20}
                        min={0}
                        value={editItems[cookie.id] || 0}
                        onChange={(_, val) => setEditItems({ ...editItems, [cookie.id]: val || 0 })}
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancel</Button>
            <Button colorScheme="blue" onClick={saveEdit}>Save Changes</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
