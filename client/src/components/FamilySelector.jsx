import { useState, useEffect } from 'react';
import {
  Box, Select, Button, VStack, Heading, Text
} from '@chakra-ui/react';
import { useFamily } from '../context/FamilyContext';
import api from '../api';

export default function FamilySelector() {
  const [families, setFamilies] = useState([]);
  const [selected, setSelected] = useState('');
  const { selectFamily } = useFamily();

  useEffect(() => {
    api.get('/families').then(res => setFamilies(res.data));
  }, []);

  const handleContinue = () => {
    const family = families.find(f => f.id === Number(selected));
    if (family) {
      selectFamily(family);
    }
  };

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6} borderWidth={1} borderRadius="lg">
      <VStack spacing={4}>
        <Heading size="lg">Welcome!</Heading>
        <Text>Select your family to continue</Text>
        <Select
          placeholder="Select your family"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {families.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </Select>
        <Button
          colorScheme="green"
          width="100%"
          onClick={handleContinue}
          isDisabled={!selected}
        >
          Continue
        </Button>
      </VStack>
    </Box>
  );
}
