import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, HStack, Table, Thead, Tbody, Tr, Th, Td,
  Button, NumberInput, NumberInputField, useToast, Badge,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody,
  ModalFooter, ModalCloseButton, useDisclosure, Text
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function ExchangePage() {
  const { selectedFamily } = useFamily();
  const [familyInventory, setFamilyInventory] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const loadData = () => {
    api.get('/inventory/all-families').then(res => setFamilyInventory(res.data));
    api.get(`/exchanges/family/${selectedFamily.id}`).then(res => setMyExchanges(res.data));
  };

  useEffect(() => {
    loadData();
  }, [selectedFamily.id]);

  const otherFamilies = familyInventory.filter(
    item => item.family_id !== selectedFamily.id
  );

  const handleRequest = (item) => {
    setSelectedItem(item);
    setQuantity(1);
    onOpen();
  };

  const submitRequest = async () => {
    try {
      await api.post('/exchanges', {
        requesting_family_id: selectedFamily.id,
        providing_family_id: selectedItem.family_id,
        cookie_variety_id: selectedItem.cookie_variety_id,
        quantity
      });
      toast({
        title: 'Request sent!',
        status: 'success',
        duration: 3000,
      });
      onClose();
      loadData();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to send request',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleApprove = async (exchangeId) => {
    try {
      await api.put(`/exchanges/${exchangeId}/status`, { status: 'approved' });
      toast({ title: 'Exchange approved!', status: 'success', duration: 3000 });
      loadData();
    } catch (err) {
      toast({ title: 'Error', status: 'error', duration: 3000 });
    }
  };

  const handleDecline = async (exchangeId) => {
    try {
      await api.put(`/exchanges/${exchangeId}/status`, { status: 'declined' });
      toast({ title: 'Exchange declined', status: 'info', duration: 3000 });
      loadData();
    } catch (err) {
      toast({ title: 'Error', status: 'error', duration: 3000 });
    }
  };

  const pendingRequests = myExchanges.filter(
    e => e.status === 'requested' && e.providing_family_id === selectedFamily.id
  );

  const myRequests = myExchanges.filter(
    e => e.requesting_family_id === selectedFamily.id
  );

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Cookie Exchanges</Heading>

        {pendingRequests.length > 0 && (
          <Box borderWidth={1} borderRadius="lg" p={4} bg="yellow.50">
            <Heading size="sm" mb={3}>Pending Requests for Your Cookies</Heading>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>From</Th>
                  <Th>Cookie</Th>
                  <Th isNumeric>Qty</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {pendingRequests.map(ex => (
                  <Tr key={ex.id}>
                    <Td>{ex.requesting_family_name}</Td>
                    <Td>{ex.cookie_name}</Td>
                    <Td isNumeric>{ex.quantity}</Td>
                    <Td>
                      <HStack>
                        <Button size="xs" colorScheme="green" onClick={() => handleApprove(ex.id)}>
                          Approve
                        </Button>
                        <Button size="xs" colorScheme="red" onClick={() => handleDecline(ex.id)}>
                          Decline
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}

        <Box>
          <Heading size="md" mb={3}>Request Cookies from Other Families</Heading>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Family</Th>
                <Th>Cookie</Th>
                <Th isNumeric>Available</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {otherFamilies.map(item => (
                <Tr key={`${item.family_id}-${item.cookie_variety_id}`}>
                  <Td>{item.family_name}</Td>
                  <Td>{item.cookie_name}</Td>
                  <Td isNumeric>{item.quantity}</Td>
                  <Td>
                    <Button size="sm" onClick={() => handleRequest(item)}>
                      Request
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>

        <Box>
          <Heading size="md" mb={3}>My Exchange Requests</Heading>
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th>To/From</Th>
                <Th>Cookie</Th>
                <Th isNumeric>Qty</Th>
                <Th>Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {myRequests.map(ex => (
                <Tr key={ex.id}>
                  <Td>{ex.providing_family_name}</Td>
                  <Td>{ex.cookie_name}</Td>
                  <Td isNumeric>{ex.quantity}</Td>
                  <Td>
                    <Badge colorScheme={
                      ex.status === 'completed' ? 'green' :
                      ex.status === 'declined' ? 'red' : 'yellow'
                    }>
                      {ex.status}
                    </Badge>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Request Cookies</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedItem && (
              <VStack spacing={4} align="stretch">
                <Text>
                  Request <strong>{selectedItem.cookie_name}</strong> from{' '}
                  <strong>{selectedItem.family_name}</strong>
                </Text>
                <Text>Available: {selectedItem.quantity}</Text>
                <NumberInput
                  min={1}
                  max={selectedItem.quantity}
                  value={quantity}
                  onChange={(_, val) => setQuantity(val)}
                >
                  <NumberInputField />
                </NumberInput>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
            <Button colorScheme="green" onClick={submitRequest}>
              Send Request
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
