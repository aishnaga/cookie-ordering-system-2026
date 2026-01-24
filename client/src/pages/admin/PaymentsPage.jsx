import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, NumberInput, NumberInputField, Input, Text, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import api from '../../api';

export default function PaymentsPage() {
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadFamilies = () => {
    api.get('/families').then(res => {
      Promise.all(res.data.map(f => api.get(`/families/${f.id}/balance`).then(b => ({ ...f, ...b.data }))))
        .then(setFamilies);
    });
  };

  useEffect(() => {
    loadFamilies();
  }, []);

  const openPayment = async (family) => {
    setSelectedFamily(family);
    const res = await api.get(`/orders/family/${family.id}`);
    setOrders(res.data.filter(o => o.status !== 'pending'));
    setAmount('');
    setNotes('');
    onOpen();
  };

  const recordPayment = async (orderId) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Please enter a valid amount', status: 'error', duration: 2000 });
      return;
    }
    try {
      await api.post(`/orders/${orderId}/payment`, { amount: numAmount, notes });
      toast({ title: 'Payment recorded', status: 'success', duration: 2000 });
      onClose();
      loadFamilies();
    } catch (err) {
      toast({ title: 'Error recording payment', status: 'error', duration: 2000 });
    }
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Payments</Heading>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Family</Th><Th isNumeric>Owed</Th><Th isNumeric>Paid</Th><Th isNumeric>Balance</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {families.map(f => (
              <Tr key={f.id}>
                <Td>{f.name}</Td>
                <Td isNumeric>${(f.owed || 0).toFixed(2)}</Td>
                <Td isNumeric>${(f.paid || 0).toFixed(2)}</Td>
                <Td isNumeric color={(f.balance || 0) > 0 ? 'red.500' : 'green.500'}>${Math.abs(f.balance || 0).toFixed(2)}</Td>
                <Td><Button size="sm" colorScheme="green" onClick={() => openPayment(f)}>Record Payment</Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Record Payment - {selectedFamily?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <NumberInput min={0} value={amount} onChange={(v) => setAmount(v)} w="100%">
                <NumberInputField placeholder="Amount (e.g., 24.00)" />
              </NumberInput>
              <Input placeholder="Notes (e.g., Venmo, Cash)" value={notes} onChange={e => setNotes(e.target.value)} />
              {orders.length === 0 ? (
                <Text color="gray.500">No orders to apply payment to. Orders must be approved first.</Text>
              ) : (
                orders.map(o => (
                  <Button key={o.id} w="100%" colorScheme="blue" onClick={() => recordPayment(o.id)}>
                    Apply to Order #{o.id} (${((o.amount_owed || 0) - (o.amount_paid || 0)).toFixed(2)} remaining)
                  </Button>
                ))
              )}
            </VStack>
          </ModalBody>
          <ModalFooter><Button onClick={onClose}>Cancel</Button></ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
