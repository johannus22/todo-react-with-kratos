import { Link } from 'react-router-dom';
import { Card, Button } from 'pixel-retroui';
import { useAuth } from '../contexts/AuthContext';

export function Dashboard() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const userEmail = user?.traits?.email || user?.verifiable_addresses?.[0]?.value || 'User';

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-gray-600">
                Welcome back, <span className="font-semibold">{userEmail}</span>!
              </p>
            </div>
            <Button onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex items-center justify-center">
            <Link to="/todos">
              <Button className=" w-3/4" bg='green' textColor='white'>Go to Todos</Button>
            </Link>
            <Link to="/mfa">
              <Button className="w-3/4" bg='blue' textColor='white'>Manage MFA</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
