import {
  Box, Flex, HStack, Button, Heading, Spacer
} from '@chakra-ui/react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useFamily } from '../context/FamilyContext';

export default function ParentLayout() {
  const { selectedFamily, clearFamily } = useFamily();
  const navigate = useNavigate();

  const handleChangeFamily = () => {
    clearFamily();
    navigate('/');
  };

  return (
    <Box minH="100vh">
      <Flex bg="green.500" color="white" px={6} py={4} align="center">
        <Heading size="md">Troop 40203 Cookies</Heading>
        <Spacer />
        <HStack spacing={4}>
          <Button as={Link} to="/order" variant="ghost" colorScheme="whiteAlpha">
            Order
          </Button>
          <Button as={Link} to="/inventory" variant="ghost" colorScheme="whiteAlpha">
            Inventory
          </Button>
          <Button as={Link} to="/exchange" variant="ghost" colorScheme="whiteAlpha">
            Exchange
          </Button>
          <Button as={Link} to="/my-status" variant="ghost" colorScheme="whiteAlpha">
            My Status
          </Button>
          <Button variant="outline" colorScheme="whiteAlpha" size="sm" onClick={handleChangeFamily}>
            {selectedFamily?.name} ▾
          </Button>
        </HStack>
      </Flex>
      <Outlet />
    </Box>
  );
}
