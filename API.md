# Todo API Documentation

Base URL: `http://localhost:8080`

All endpoints return JSON responses. Error responses follow a consistent format.

## Endpoints

### Get All Todos

Retrieves a list of all todos.

**URL:** `/api/todos`

**Method:** `GET`

**Description:** Fetches all todo items from the server.

**Request Headers:**
```
X-User-Id: <Kratos identity.id>   (required for auth/Keto)
```

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
X-User-Id: <Kratos identity.id>   (required for auth/Keto)
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
X-User-Id: <Kratos identity.id>   (required for auth/Keto)
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

**Request Headers:**
```
X-User-Id: <Kratos identity.id>   (required for auth/Keto)
```

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

## Troubleshooting: 500 on todo endpoints

The frontend sends `X-User-Id: <Kratos identity.id>` on all todo requests. On 500, return JSON like `{ "message": "…" }` or `{ "error": "…" }` so the UI can show it. The frontend also reads `detail` and `reason`.

### GET /api/todos

- **Request:** `X-User-Id` only (no body).

| Cause | What to check |
|-------|----------------|
| **Keto (expand or check per todo)** | If you filter by Keto permissions, KETO_READ_URL and the check/expand. If it throws → 500. |
| **Supabase select** | RLS, `user_id` filter, connection. |

### POST /api/todos

- **Request:** `Content-Type: application/json`, `X-User-Id`, body `{"title":"..."}`.

| Cause | What to check |
|-------|----------------|
| Missing/invalid `X-User-Id` | Pass it to Supabase (`user_id`) and Keto. If missing or downstream throws → 500. |
| Supabase insert | `user_id` column, RLS, types, connection. |
| Keto (create relation after insert) | KETO_WRITE_URL, namespace `todos`, object = todo id, relation (e.g. `owner`). Catch Keto errors and return JSON. |
| Body shape | Frontend sends `{"title":"..."}` only. |

### PATCH /api/todos/:id

- **Request:** `Content-Type: application/json`, `X-User-Id`, body `{"title":"..."}` and/or `{"completed":true|false}`. The `:id` is the todo’s `id` (string or number from GET).

| Cause | What to check |
|-------|----------------|
| **Keto permission check before update** | Call Keto **read** (e.g. check `todos:<id>` relation `edit` or `owner` for `X-User-Id`). Use KETO_READ_URL. If the check throws or is misconfigured (wrong namespace/object/relation) → 500. Catch and return JSON. |
| **Supabase update** | RLS, `id`/`user_id` match, types. `id` from URL must match your PK (string UUID vs number). |
| **`:id` in URL** | Ensure it’s the same format as in Supabase (string vs number). |

### DELETE /api/todos/:id

- **Request:** `X-User-Id`, no body. The `:id` is the todo’s `id`.

| Cause | What to check |
|-------|----------------|
| **Keto permission check before delete** | Same as PATCH: Keto read for `delete` or `owner` on `todos:<id>`. If the check or Keto request fails → 500. Catch and return JSON. |
| **Keto: delete relation tuples** | If you delete Keto relations when a todo is removed, use KETO_WRITE_URL. Failures there can cause 500; consider doing it after a successful Supabase delete or catching and logging. |
| **Supabase delete** | RLS, `id` format, FKs. |
| **`:id` in URL** | Same as PATCH; must match your DB PK. |

### Shared checks for all 500s

- **Keto URLs:** KETO_READ_URL for check/expand (e.g. port 4466), KETO_WRITE_URL for create/delete relations (e.g. 4467). Using the wrong port can cause timeouts or parse errors.
- **Wrap Supabase and Keto calls** in try/catch; on failure return `{ "message": "…" }` with status 500 instead of letting the worker throw.

---

## Notes

- All timestamps should be in ISO 8601 format (e.g., `2024-01-15T10:30:00Z`)
- The `id` field can be either a string or number, depending on backend implementation
- The `createdAt` field is optional and may not be present in all responses

## CORS Configuration

The frontend uses `credentials: 'include'` for cookie-based authentication and sends the `X-User-Id` header on todo requests. The backend **must** configure CORS so the frontend’s origin and headers are allowed.

### Required CORS headers

- **`Access-Control-Allow-Origin`**  
  The frontend origin. Must be the exact origin, **not** `*`.  
  Examples depending on where the frontend runs:
  - Vite: `http://localhost:5173`
  - Next.js / Create React App: `http://localhost:3000`
  - Preview: `http://localhost:4173` (or the origin you use)

  If the frontend can run on multiple ports, the backend should allow each one (e.g. from an env list or config).

- **`Access-Control-Allow-Credentials: true`**  
  Required when using `credentials: 'include'`.

- **`Access-Control-Allow-Methods`**  
  `GET, POST, PATCH, DELETE, OPTIONS`

- **`Access-Control-Allow-Headers`**  
  Must include every header the frontend sends. At least:
  - `Content-Type`
  - **`X-User-Id`** (used for Keto/auth on todo endpoints)

  Example: `Content-Type, X-User-Id`  
  If you use more custom headers, add them too.

### Preflight (OPTIONS)

The backend must respond to **OPTIONS** preflight requests with the CORS headers above so the browser allows the following GET/POST/PATCH/DELETE with `X-User-Id` and cookies.

### If you see CORS errors

1. **“Request header field X-User-Id is not allowed”**  
   Add `X-User-Id` to `Access-Control-Allow-Headers`.

2. **“The value of the 'Access-Control-Allow-Origin' header must not be the wildcard '*'”**  
   Use the exact frontend origin (e.g. `http://localhost:5173`) instead of `*`.

3. **Origin `http://localhost:3000` not allowed**  
   Add that origin to the set of allowed origins in your CORS config.

### Example: Cloudflare Worker (or similar)

Use this pattern in your worker so `http://localhost:8787/api/todos` accepts requests from the frontend (e.g. `http://localhost:5173`).

```js
// Allowed origins (adjust to match your frontends)
const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Vite
  'http://localhost:3000',  // Next.js / CRA
  'http://localhost:4173',  // Vite preview
];

const CORS_HEADERS = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
  'Access-Control-Max-Age': '86400',
};

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return { ...CORS_HEADERS, 'Access-Control-Allow-Origin': allowOrigin };
}

export default {
  async fetch(request, env, ctx) {
    // 1) Handle preflight (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(request) });
    }

    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      // 2) Your existing API logic here (auth, Keto, Supabase, etc.)
      const response = await handleApiRequest(request, url);
      // 3) Add CORS to the real response
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders(request)).forEach(([k, v]) => headers.set(k, v));
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleApiRequest(request, url) {
  // ... your existing /api/todos and other routes
  // return fetch(...) or new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } });
}
```

**Checklist for `http://localhost:8787`:**

| Header                         | Value                                                |
|--------------------------------|------------------------------------------------------|
| `Access-Control-Allow-Origin`  | `http://localhost:5173` (or the request `Origin` if in allowlist) |
| `Access-Control-Allow-Credentials` | `true`                                          |
| `Access-Control-Allow-Headers` | `Content-Type, X-User-Id`                           |
| `Access-Control-Allow-Methods` | `GET, POST, PATCH, DELETE, OPTIONS`                 |

- **OPTIONS** to `http://localhost:8787/api/todos` must return **204** with these headers.
- **GET/POST/PATCH/DELETE** must also include these headers on the response.
- If your frontend runs on a different port, add it to `ALLOWED_ORIGINS` (or your env-based allowlist).
