import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td,
  Tabs, TabList, TabPanels, Tab, TabPanel, Badge
} from '@chakra-ui/react';
import api from '../../api';

export default function InventoryPage() {
  const [central, setCentral] = useState([]);
  const [familyInventory, setFamilyInventory] = useState([]);

  useEffect(() => {
    api.get('/inventory/central').then(res => setCentral(res.data));
    api.get('/inventory/all-families').then(res => setFamilyInventory(res.data));
  }, []);

  // Group family inventory by family
  const byFamily = familyInventory.reduce((acc, item) => {
    if (!acc[item.family_name]) acc[item.family_name] = [];
    acc[item.family_name].push(item);
    return acc;
  }, {});

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading>Cookie Inventory</Heading>

        <Tabs>
          <TabList>
            <Tab>Troop Supply</Tab>
            <Tab>Family Inventory</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Cookie</Th>
                    <Th isNumeric>Available</Th>
                    <Th>Status</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {central.map(item => (
                    <Tr key={item.id}>
                      <Td>{item.cookie_name}</Td>
                      <Td isNumeric>{item.quantity}</Td>
                      <Td>
                        <Badge colorScheme={item.status === 'on_hand' ? 'green' : 'yellow'}>
                          {item.status}
                        </Badge>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TabPanel>

            <TabPanel>
              {Object.entries(byFamily).map(([familyName, items]) => (
                <Box key={familyName} mb={6}>
                  <Heading size="sm" mb={2}>{familyName}</Heading>
                  <Table variant="simple" size="sm">
                    <Thead>
                      <Tr>
                        <Th>Cookie</Th>
                        <Th isNumeric>Quantity</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {items.map(item => (
                        <Tr key={item.id}>
                          <Td>{item.cookie_name}</Td>
                          <Td isNumeric>{item.quantity}</Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </Box>
              ))}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
}
