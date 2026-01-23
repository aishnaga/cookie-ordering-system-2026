import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Button, Input, HStack, useToast } from '@chakra-ui/react';
import api from '../../api';

export default function FamiliesPage() {
  const [families, setFamilies] = useState([]);
  const [newName, setNewName] = useState('');
  const toast = useToast();

  const load = () => api.get('/families').then(res => setFamilies(res.data));
  useEffect(() => { load(); }, []);

  const addFamily = async () => {
    if (!newName.trim()) return;
    await api.post('/families', { name: newName });
    setNewName('');
    load();
    toast({ title: 'Family added', status: 'success', duration: 2000 });
  };

  const deleteFamily = async (id) => {
    await api.delete(`/families/${id}`);
    load();
  };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Manage Families</Heading>
        <HStack>
          <Input placeholder="Family name" value={newName} onChange={e => setNewName(e.target.value)} />
          <Button colorScheme="blue" onClick={addFamily}>Add</Button>
        </HStack>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Name</Th><Th>Actions</Th></Tr></Thead>
          <Tbody>
            {families.map(f => (
              <Tr key={f.id}>
                <Td>{f.name}</Td>
                <Td><Button size="sm" colorScheme="red" onClick={() => deleteFamily(f.id)}>Delete</Button></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}
