import { useState, useEffect } from 'react';
import { Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td, Badge } from '@chakra-ui/react';
import api from '../../api';

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState([]);

  useEffect(() => {
    api.get('/exchanges').then(res => setExchanges(res.data));
  }, []);

  const statusColors = { requested: 'yellow', approved: 'blue', completed: 'green', declined: 'red' };

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Exchange Activity</Heading>
        <Table variant="simple" bg="white">
          <Thead><Tr><Th>Date</Th><Th>From</Th><Th>To</Th><Th>Cookie</Th><Th isNumeric>Qty</Th><Th>Status</Th></Tr></Thead>
          <Tbody>
            {exchanges.map(e => (
              <Tr key={e.id}>
                <Td>{new Date(e.created_at).toLocaleDateString()}</Td>
                <Td>{e.providing_family_name}</Td>
                <Td>{e.requesting_family_name}</Td>
                <Td>{e.cookie_name}</Td>
                <Td isNumeric>{e.quantity}</Td>
                <Td><Badge colorScheme={statusColors[e.status]}>{e.status}</Badge></Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </VStack>
    </Box>
  );
}
