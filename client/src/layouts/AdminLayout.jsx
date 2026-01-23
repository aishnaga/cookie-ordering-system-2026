import {
  Box, Flex, VStack, Button, Heading, Spacer
} from '@chakra-ui/react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export default function AdminLayout() {
  const { logout } = useAdmin();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/families', label: 'Families' },
    { to: '/admin/cookies', label: 'Cookies' },
    { to: '/admin/inventory', label: 'Inventory' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/payments', label: 'Payments' },
    { to: '/admin/exchanges', label: 'Exchanges' },
  ];

  return (
    <Flex minH="100vh">
      <Box w="200px" bg="blue.700" color="white" p={4}>
        <VStack spacing={4} align="stretch">
          <Heading size="sm" mb={4}>Coordinator</Heading>
          {navItems.map(item => (
            <Button
              key={item.to}
              as={Link}
              to={item.to}
              variant="ghost"
              colorScheme="whiteAlpha"
              justifyContent="flex-start"
            >
              {item.label}
            </Button>
          ))}
          <Spacer />
          <Button variant="outline" colorScheme="whiteAlpha" onClick={handleLogout}>
            Logout
          </Button>
        </VStack>
      </Box>
      <Box flex={1} bg="gray.50">
        <Outlet />
      </Box>
    </Flex>
  );
}
