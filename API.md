# Todo API Documentation

Base URL: `http://localhost:8080`

All endpoints return JSON responses. Error responses follow a consistent format.

## Endpoints

### Get All Todos

Retrieves a list of all todos.

**URL:** `/api/todos`

**Method:** `GET`

**Description:** Fetches all todo items from the server.

**Request:**
- No request body required
- No query parameters

**Response:**

**200 OK:**
```json
[
  {
    "id": "1",
    "title": "Complete the project",
    "completed": false,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  {
    "id": "2",
    "title": "Review code",
    "completed": true,
    "createdAt": "2024-01-14T15:20:00Z"
  }
]
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to fetch todos"
}
```

**Example Request:**
```bash
curl -X GET http://localhost:8080/api/todos
```

---

### Create a New Todo

Creates a new todo item.

**URL:** `/api/todos`

**Method:** `POST`

**Description:** Creates a new todo with the provided title.

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "New todo item"
}
```

**Response:**

**201 Created:**
```json
{
  "id": "3",
  "title": "New todo item",
  "completed": false,
  "createdAt": "2024-01-15T12:00:00Z"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "message": "Title is required"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to create todo"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8080/api/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "New todo item"}'
```

---

### Update a Todo

Updates an existing todo item.

**URL:** `/api/todos/:id`

**Method:** `PATCH`

**Description:** Updates one or more fields of an existing todo. The `id` parameter should be the todo's unique identifier.

**URL Parameters:**
- `id` (required): The unique identifier of the todo to update

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated todo title",
  "completed": true
}
```

**Note:** All fields in the request body are optional. Only include the fields you want to update.

**Response:**

**200 OK:**
```json
{
  "id": "1",
  "title": "Updated todo title",
  "completed": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Todo with id '1' not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Validation error",
  "message": "Invalid request body"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to update todo"
}
```

**Example Request:**
```bash
curl -X PATCH http://localhost:8080/api/todos/1 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

---

### Delete a Todo

Deletes a todo item.

**URL:** `/api/todos/:id`

**Method:** `DELETE`

**Description:** Permanently deletes a todo item from the server.

**URL Parameters:**
- `id` (required): The unique identifier of the todo to delete

**Request:**
- No request body required

**Response:**

**200 OK:**
```json
{
  "message": "Todo deleted successfully"
}
```

**204 No Content:**
(Some servers may return 204 No Content with no response body)

**404 Not Found:**
```json
{
  "error": "Not found",
  "message": "Todo with id '1' not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Failed to delete todo"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:8080/api/todos/1
```

---

## Data Models

### Todo Object

```typescript
interface Todo {
  id: string | number;      // Unique identifier
  title: string;            // Todo item title (required)
  completed: boolean;        // Completion status (default: false)
  createdAt?: string;       // ISO 8601 timestamp (optional)
}
```

---

## Error Handling

All error responses follow this format:

```json
{
  "error": "Error type",
  "message": "Human-readable error message"
}
```

### Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Request successful, no content to return
- `400 Bad Request` - Invalid request data
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Network Errors

When the server is unavailable (connection refused, network timeout, etc.), the frontend will:

1. Detect the network error
2. Display a user-friendly error message
3. Continue to function in a degraded mode (UI remains usable)
4. Show an empty state or cached data if available

The frontend distinguishes between:
- **Network errors**: Server is unreachable (connection refused, timeout, etc.)
- **HTTP errors**: Server responded with an error status code

---

## Notes

- All timestamps should be in ISO 8601 format (e.g., `2024-01-15T10:30:00Z`)
- The `id` field can be either a string or number, depending on backend implementation
- The `createdAt` field is optional and may not be present in all responses

## CORS Configuration

The frontend uses `credentials: 'include'` for cookie-based authentication. The backend **must** configure CORS headers correctly:

**Required CORS Headers:**
- `Access-Control-Allow-Origin: http://localhost:5173` (must be the exact origin, NOT `*`)
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

**Important:** When using `credentials: 'include'`, the `Access-Control-Allow-Origin` header cannot be a wildcard (`*`). It must specify the exact origin of the frontend (e.g., `http://localhost:5173`).

**Preflight Requests:**
The backend must handle OPTIONS preflight requests and return the appropriate CORS headers.
