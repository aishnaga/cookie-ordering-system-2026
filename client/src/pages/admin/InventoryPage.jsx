import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Select, NumberInput, NumberInputField, HStack, useToast, Badge } from '@chakra-ui/react';
import api from '../../api';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [cookies, setCookies] = useState([]);
  const [selectedCookie, setSelectedCookie] = useState('');
  const [quantity, setQuantity] = useState(0);
  const toast = useToast();

  const load = () => {
    api.get('/inventory/central').then(res => setInventory(res.data));
    api.get('/cookies').then(res => setCookies(res.data));
  };
  useEffect(() => { load(); }, []);

  const addInventory = async () => {
    if (!selectedCookie || quantity <= 0) return;
    await api.post('/inventory/central', { cookie_variety_id: Number(selectedCookie), quantity });
    setQuantity(0);
    load();
    toast({ title: 'Inventory added', status: 'success', duration: 2000 });
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Central Inventory</Heading>
        <HStack>
          <Select placeholder="Select cookie" value={selectedCookie} onChange={e => setSelectedCookie(e.target.value)}>
            {cookies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <NumberInput min={1} value={quantity} onChange={(_, v) => setQuantity(v)}>
            <NumberInputField placeholder="Quantity" />
          </NumberInput>
          <Button colorScheme="blue" onClick={addInventory}>Add Stock</Button>
        </HStack>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Cookie</Th><Th isNumeric>Quantity</Th><Th>Status</Th></Tr></Thead>
          <Tbody>
            {inventory.map(i => (
              <Tr key={i.id}>
                <Td>{i.cookie_name}</Td>
                <Td isNumeric>{i.quantity}</Td>
                <Td><Badge colorScheme={i.status === 'on_hand' ? 'green' : 'yellow'}>{i.status}</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}
