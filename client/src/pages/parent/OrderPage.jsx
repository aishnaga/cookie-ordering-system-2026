import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, HStack, Text, NumberInput,
  NumberInputField, Button, Table, Thead, Tbody, Tr, Th, Td,
  useToast, Alert, AlertIcon
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function OrderPage() {
  const { selectedFamily } = useFamily();
  const [cookies, setCookies] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    api.get('/cookies').then(res => {
      setCookies(res.data);
      const initial = {};
      res.data.forEach(c => { initial[c.id] = 0; });
      setQuantities(initial);
    });
  }, []);

  const total = cookies.reduce((sum, c) => {
    return sum + (quantities[c.id] || 0) * c.price_per_box;
  }, 0);

  const hasItems = Object.values(quantities).some(q => q > 0);

  const handleSubmit = async () => {
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([cookie_variety_id, quantity]) => ({
        cookie_variety_id: Number(cookie_variety_id),
        quantity
      }));

    setSubmitting(true);
    try {
      await api.post('/orders', {
        family_id: selectedFamily.id,
        items
      });
      toast({
        title: 'Order submitted!',
        description: 'Waiting for coordinator approval.',
        status: 'success',
        duration: 5000,
      });
      // Reset form
      const reset = {};
      cookies.forEach(c => { reset[c.id] = 0; });
      setQuantities(reset);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.error || 'Failed to submit order',
        status: 'error',
        duration: 5000,
      });
    }
    setSubmitting(false);
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Place Order</Heading>
        <Text>Ordering as: <strong>{selectedFamily.name}</strong></Text>

        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Cookie</Th>
              <Th isNumeric>Price</Th>
              <Th isNumeric>Quantity</Th>
              <Th isNumeric>Subtotal</Th>
            </Tr>
          </Thead>
          <Tbody>
            {cookies.map(cookie => (
              <Tr key={cookie.id}>
                <Td>{cookie.name}</Td>
                <Td isNumeric>${cookie.price_per_box.toFixed(2)}</Td>
                <Td isNumeric>
                  <NumberInput
                    size="sm"
                    maxW={20}
                    min={0}
                    value={quantities[cookie.id]}
                    onChange={(_, val) => setQuantities({
                      ...quantities,
                      [cookie.id]: val || 0
                    })}
                  >
                    <NumberInputField />
                  </NumberInput>
                </Td>
                <Td isNumeric>
                  ${((quantities[cookie.id] || 0) * cookie.price_per_box).toFixed(2)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>

        <HStack justify="space-between">
          <Text fontSize="xl" fontWeight="bold">
            Total: ${total.toFixed(2)}
          </Text>
          <Button
            colorScheme="green"
            onClick={handleSubmit}
            isDisabled={!hasItems || submitting}
            isLoading={submitting}
          >
            Submit Order
          </Button>
        </HStack>

        <Alert status="info">
          <AlertIcon />
          Your order will be reviewed by the coordinator before pickup.
        </Alert>
      </VStack>
    </Box>
  );
}
