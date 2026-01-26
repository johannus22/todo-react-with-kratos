import { Link } from 'react-router-dom';
import { Card, Button } from 'pixel-retroui';
import { useAuth } from '../contexts/AuthContext';
import { AdminTodoList } from '../components/AdminTodoList';
import { useAdminTodos } from '../hooks/useAdminTodos';

export function Dashboard() {
  const { user, logout, isAdmin } = useAuth();
  const {
    todos: adminTodos,
    loading: adminLoading,
    error: adminError,
    deleteTodo: deleteAdminTodo,
    refetch: refetchAdminTodos,
  } = useAdminTodos(isAdmin ? user?.id ?? null : null);

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
            <Button onClick={handleLogout} bg="red" textColor="white">
              Logout
            </Button>
          </div>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Link to="/todos">
              <Button className="w-full sm:w-40" bg="blue" textColor="white">
                Go to Todos
              </Button>
            </Link>
            <Link to="/mfa">
              <Button className="w-full sm:w-40" bg="yellow" textColor="black">
                Manage MFA
              </Button>
            </Link>
            <Link to="/settings">
              <Button className="w-full sm:w-40" bg="gray" textColor="white">
                Account Settings
              </Button>
            </Link>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Admin: All Todos</h2>
                <p className="text-sm text-gray-600">View and delete todos across all accounts.</p>
              </div>
              <Button onClick={refetchAdminTodos} bg="blue" textColor="white">
                Refresh
              </Button>
            </div>
            <AdminTodoList
              todos={adminTodos}
              loading={adminLoading}
              error={adminError}
              onDelete={deleteAdminTodo}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
