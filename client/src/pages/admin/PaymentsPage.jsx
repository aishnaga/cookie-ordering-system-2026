import { useState, useEffect } from 'react';
import { Box, Heading, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td, Button, NumberInput, NumberInputField, Input, Text, useToast, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, ModalCloseButton, useDisclosure } from '@chakra-ui/react';
import api from '../../api';

export default function PaymentsPage() {
  const [families, setFamilies] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [orders, setOrders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editPayments, setEditPayments] = useState({});
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

  const openPayment = async (family, isEdit = false) => {
    setSelectedFamily(family);
    setEditMode(isEdit);
    const res = await api.get(`/orders/family/${family.id}`);
    const filteredOrders = res.data.filter(o => o.status !== 'pending');
    setOrders(filteredOrders);
    setAmount('');
    setNotes('');
    if (isEdit) {
      const payments = {};
      filteredOrders.forEach(o => {
        payments[o.id] = {
          cash_paid: o.cash_paid || 0,
          check_paid: o.check_paid || 0,
          credit_card_paid: o.credit_card_paid || 0
        };
      });
      setEditPayments(payments);
    }
    onOpen();
  };

  const recordPayment = async (orderId, paymentType) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: 'Please enter a valid amount', status: 'error', duration: 2000 });
      return;
    }
    try {
      await api.post(`/orders/${orderId}/payment`, { amount: numAmount, notes, paymentType });
      toast({ title: 'Payment recorded', status: 'success', duration: 2000 });
      onClose();
      loadFamilies();
    } catch (err) {
      toast({ title: 'Error recording payment', status: 'error', duration: 2000 });
    }
  };

  const savePaymentEdits = async () => {
    try {
      for (const [orderId, payments] of Object.entries(editPayments)) {
        await api.put(`/orders/${orderId}/payment`, payments);
      }
      toast({ title: 'Payments updated', status: 'success', duration: 2000 });
      onClose();
      loadFamilies();
    } catch (err) {
      toast({ title: 'Error updating payments', status: 'error', duration: 2000 });
    }
  };

  const updateEditPayment = (orderId, field, value) => {
    setEditPayments({
      ...editPayments,
      [orderId]: {
        ...editPayments[orderId],
        [field]: parseFloat(value) || 0
      }
    });
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Payments</Heading>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Family</Th><Th isNumeric>Owed</Th><Th isNumeric>Cash</Th><Th isNumeric>Check</Th><Th isNumeric>Credit Card</Th><Th isNumeric>Balance</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {families.map(f => (
              <Tr key={f.id}>
                <Td>{f.name}</Td>
                <Td isNumeric>{f.owed ? `$${f.owed.toFixed(2)}` : ''}</Td>
                <Td isNumeric>{f.cash ? `$${f.cash.toFixed(2)}` : ''}</Td>
                <Td isNumeric>{f.check ? `$${f.check.toFixed(2)}` : ''}</Td>
                <Td isNumeric>{f.creditCard ? `$${f.creditCard.toFixed(2)}` : ''}</Td>
                <Td isNumeric color={(f.balance || 0) > 0 ? 'red.500' : 'green.500'}>{f.balance ? `$${Math.abs(f.balance).toFixed(2)}` : ''}</Td>
                <Td>
                  <HStack>
                    <Button size="sm" colorScheme="green" onClick={() => openPayment(f, false)}>Record</Button>
                    <Button size="sm" onClick={() => openPayment(f, true)}>Edit</Button>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose} size={editMode ? "xl" : "md"}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editMode ? 'Edit Payments' : 'Record Payment'} - {selectedFamily?.name}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {editMode ? (
              <VStack spacing={4}>
                {orders.length === 0 ? (
                  <Text color="gray.500">No orders to edit.</Text>
                ) : (
                  orders.map(o => (
                    <Box key={o.id} w="100%" p={3} borderWidth={1} borderRadius="md">
                      <Text mb={2} fontWeight="bold">Order #{o.id} - Owed: ${(o.amount_owed || 0).toFixed(2)}</Text>
                      <HStack spacing={4}>
                        <Box>
                          <Text fontSize="sm">Cash</Text>
                          <NumberInput size="sm" min={0} value={editPayments[o.id]?.cash_paid || 0} onChange={(v) => updateEditPayment(o.id, 'cash_paid', v)}>
                            <NumberInputField />
                          </NumberInput>
                        </Box>
                        <Box>
                          <Text fontSize="sm">Check</Text>
                          <NumberInput size="sm" min={0} value={editPayments[o.id]?.check_paid || 0} onChange={(v) => updateEditPayment(o.id, 'check_paid', v)}>
                            <NumberInputField />
                          </NumberInput>
                        </Box>
                        <Box>
                          <Text fontSize="sm">Credit Card</Text>
                          <NumberInput size="sm" min={0} value={editPayments[o.id]?.credit_card_paid || 0} onChange={(v) => updateEditPayment(o.id, 'credit_card_paid', v)}>
                            <NumberInputField />
                          </NumberInput>
                        </Box>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            ) : (
              <VStack spacing={4}>
                <NumberInput min={0} value={amount} onChange={(v) => setAmount(v)} w="100%">
                  <NumberInputField placeholder="Amount (e.g., 24.00)" />
                </NumberInput>
                <Input placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
                {orders.length === 0 ? (
                  <Text color="gray.500">No orders to apply payment to. Orders must be approved first.</Text>
                ) : (
                  orders.map(o => (
                    <Box key={o.id} w="100%" p={3} borderWidth={1} borderRadius="md">
                      <Text mb={2}>Order #{o.id} - ${((o.amount_owed || 0) - (o.cash_paid || 0) - (o.check_paid || 0) - (o.credit_card_paid || 0)).toFixed(2)} remaining</Text>
                      <HStack>
                        <Button flex={1} colorScheme="green" onClick={() => recordPayment(o.id, 'cash')}>
                          Cash
                        </Button>
                        <Button flex={1} colorScheme="orange" onClick={() => recordPayment(o.id, 'check')}>
                          Check
                        </Button>
                        <Button flex={1} colorScheme="blue" onClick={() => recordPayment(o.id, 'credit_card')}>
                          Credit Card
                        </Button>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onClose} mr={3}>Cancel</Button>
            {editMode && <Button colorScheme="blue" onClick={savePaymentEdits}>Save Changes</Button>}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
