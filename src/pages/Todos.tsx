import { Link } from "react-router-dom";
import { AddTodoForm } from "../components/AddTodoForm";
import { TodoList } from "../components/TodoList";
import { useTodos } from "../hooks/useTodos";
import { Card } from "pixel-retroui";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "pixel-retroui";

export function Todos() {
  const { logout, user } = useAuth();
  const { todos, loading, error, addTodo, updateTodo, deleteTodo } = useTodos(user?.id ?? null);

  const handleToggle = async (id: string | number) => {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      await updateTodo(id, { completed: !todo.completed });
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Todo App</h1>
              <p className="text-gray-600">Manage your tasks!</p>
              {user?.traits?.email && (
                <p className="text-sm text-gray-500 mt-2">
                  Welcome back, {user.traits.email}!
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>

        <AddTodoForm onSubmit={addTodo} disabled={loading} />

        {error && !error.isNetworkError && (
          <Card className="p-4 mb-4" bg="red" textColor="white">
            <p className="font-semibold">
              {error.status === 401
                ? 'Please sign in.'
                : error.status === 403
                  ? "You can't edit or delete this."
                  : `Error: ${error.message}`}
            </p>
          </Card>
        )}

        <TodoList
          todos={todos}
          loading={loading}
          error={error}
          onToggle={handleToggle}
          onDelete={deleteTodo}
        />
      </div>
    </div>
  );
}
