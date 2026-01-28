import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
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
    <div className="page-shell">
      <div className="mx-auto max-w-2xl lg:max-w-3xl space-y-8 lg:space-y-10">
        <Card className="p-8 padding-have fade-up">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="page-kicker text-xs text-[#6b5a46]">Overview</span>
              <h1 className="text-3xl sm:text-4xl font-semibold mt-2">Dashboard</h1>
              <p className="text-gray-600 mt-2">
                Welcome back, <span className="font-semibold">{userEmail}</span>.
              </p>
            </div>
            <Button
              onClick={handleLogout}
              className="bg-[#ff8fab] hover:bg-[#ff6f92] text-black"
            >
              Logout
            </Button>
          </div>
        </Card>

        <Card className="p-8 sm:p-10 lg:p-12 fade-up">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link to="/todos">
              <Button className="w-full bg-[#1f6feb] hover:bg-[#1a56c4] text-white">
                Go to Todos
              </Button>
            </Link>
            <Link to="/mfa">
              <Button className="w-full bg-[#ffe77a] hover:bg-[#ffd94f] text-black">
                Manage MFA
              </Button>
            </Link>
            <Link to="/settings">
              <Button className="w-full bg-[#111827] hover:bg-[#0b1120] text-white">
                Account Settings
              </Button>
            </Link>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-8 sm:p-10 lg:p-12 fade-up">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">Admin: All Todos</h2>
                <p className="text-sm text-gray-600">View and delete todos across all accounts.</p>
              </div>
              <Button
                onClick={refetchAdminTodos}
                className="bg-[#1f6feb] hover:bg-[#1a56c4] text-white"
              >
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
