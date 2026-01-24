import { useState, useEffect } from 'react';
import {
  Box, Heading, VStack, Table, Thead, Tbody, Tr, Th, Td,
  Tabs, TabList, TabPanels, Tab, TabPanel, Badge,
  NumberInput, NumberInputField, Button, useToast, HStack, Text
} from '@chakra-ui/react';
import { useFamily } from '../../context/FamilyContext';
import api from '../../api';

export default function InventoryPage() {
  const { selectedFamily } = useFamily();
  const [central, setCentral] = useState([]);
  const [familyInventory, setFamilyInventory] = useState([]);
  const [myInventory, setMyInventory] = useState([]);
  const [cookies, setCookies] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const loadData = () => {
    api.get('/inventory/central').then(res => setCentral(res.data));
    api.get('/inventory/all-families').then(res => setFamilyInventory(res.data));
    api.get('/cookies').then(res => setCookies(res.data));
    if (selectedFamily?.id) {
      api.get(`/inventory/family/${selectedFamily.id}`).then(res => {
        setMyInventory(res.data);
        const qtys = {};
        res.data.forEach(item => {
          qtys[item.cookie_variety_id] = item.quantity;
        });
        setQuantities(qtys);
      });
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFamily]);

  const saveInventory = async () => {
    setSaving(true);
    const items = cookies.map(c => ({
      cookie_variety_id: c.id,
      quantity: quantities[c.id] || 0
    }));
    await api.put(`/inventory/family/${selectedFamily.id}`, { items });
    toast({ title: 'Inventory updated', status: 'success', duration: 2000 });
    loadData();
    setSaving(false);
  };

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
            <Tab>My Inventory</Tab>
            <Tab>Troop Supply</Tab>
            <Tab>All Families</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Text mb={4}>Update your on-hand inventory for: <strong>{selectedFamily?.name}</strong></Text>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Cookie</Th>
                    <Th isNumeric>Quantity On Hand</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {cookies.map(cookie => (
                    <Tr key={cookie.id}>
                      <Td>{cookie.name}</Td>
                      <Td isNumeric>
                        <NumberInput
                          size="sm"
                          maxW={24}
                          min={0}
                          value={quantities[cookie.id] || 0}
                          onChange={(_, val) => setQuantities({
                            ...quantities,
                            [cookie.id]: val || 0
                          })}
                        >
                          <NumberInputField />
                        </NumberInput>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              <HStack justify="flex-end" mt={4}>
                <Button colorScheme="blue" onClick={saveInventory} isLoading={saving}>
                  Save Inventory
                </Button>
              </HStack>
            </TabPanel>

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
