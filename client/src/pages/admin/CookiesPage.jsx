import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Input, HStack, useToast, Badge } from '@chakra-ui/react';
import api from '../../api';

export default function CookiesPage() {
  const [cookies, setCookies] = useState([]);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('6.00');
  const toast = useToast();

  const load = () => api.get('/cookies?all=true').then(res => setCookies(res.data));
  useEffect(() => { load(); }, []);

  const addCookie = async () => {
    if (!newName.trim()) return;
    await api.post('/cookies', { name: newName, price_per_box: parseFloat(newPrice) });
    setNewName(''); setNewPrice('6.00');
    load();
    toast({ title: 'Cookie added', status: 'success', duration: 2000 });
  };

  const toggleActive = async (cookie) => {
    await api.put(`/cookies/${cookie.id}`, { ...cookie, active: !cookie.active });
    load();
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Manage Cookies</Heading>
        <HStack>
          <Input placeholder="Cookie name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Input type="number" step="0.01" w="100px" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
          <Button colorScheme="blue" onClick={addCookie}>Add</Button>
        </HStack>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Name</Th><Th>Price</Th><Th>Status</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {cookies.map(c => (
              <Tr key={c.id}>
                <Td>{c.name}</Td>
                <Td>${c.price_per_box.toFixed(2)}</Td>
                <Td><Badge colorScheme={c.active ? 'green' : 'gray'}>{c.active ? 'Active' : 'Inactive'}</Badge></Td>
                <Td><Button size="sm" onClick={() => toggleActive(c)}>{c.active ? 'Deactivate' : 'Activate'}</Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}
