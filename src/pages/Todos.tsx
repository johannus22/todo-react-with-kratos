import { Link } from "react-router-dom";
import { AddTodoForm } from "../components/AddTodoForm";
import { TodoList } from "../components/TodoList";
import { useTodos } from "../hooks/useTodos";
import { Card } from "../components/ui/Card";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/Button";

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
    <div className="page-shell no-shadow">
      <div className="mx-auto max-w-2xl lg:max-w-3xl space-y-8 lg:space-y-10">
        <Card className="p-8 sm:p-10 lg:p-12 no-shadow padding-have fade-up">
          <div className="flex flex-col gap-4 no-shadow sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="page-kicker text-xs no-shadow text-[#6b5a46]">Daily focus</span>
              <h1 className="text-3xl sm:text-4xl font-semibold no-shadow mt-2">Your Todos</h1>
              <p className="text-gray-600 no-shadow mt-2">Plan the day, then ship the wins.</p>
              {user?.traits?.email && (
                <p className="text-sm text-gray-500 no-shadow mt-2">
                  Signed in as {user.traits.email}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 sm:gap-4 w-full sm:w-auto">
              <Link to="/dashboard" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-[#1f6feb] hover:bg-[#1a56c4] text-white">
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleLogout}
                className="flex-1 sm:flex-none bg-[#ff8fab] hover:bg-[#ff6f92] text-black"
              >
                Logout
              </Button>
            </div>
          </div>
        </Card>
        <div className="mt-10"></div>

        <Card className="p-8 sm:p-10 lg:p-12 mt-10 padding-have no-shadow fade-up">
          <h2 className="text-xl font-semibold mb-4">Add a new task</h2>
          <AddTodoForm onSubmit={addTodo} disabled={loading} />
        </Card>

        {error && !error.isNetworkError && (
          <Card className="p-4 bg-[#b42318] text-white">
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
