# Quick Authentication Reference

## API Endpoints

### Login (Use This for Frontend) ⭐
```
POST /api/auth/login/json
Content-Type: application/json

{
  "email": "admin@synkrasis.ai",
  "password": "Admin123!"
}

✅ Response:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

### Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

✅ Response:
{
  "success": true,
  "data": {
    "id": "...",
    "email": "admin@synkrasis.ai",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin"
  }
}
```

---

## Frontend Integration

### React Hook
```javascript
import { useState } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const login = async (email, password) => {
    const res = await fetch('http://localhost:8000/api/auth/login/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const { access_token } = await res.json();
    localStorage.setItem('token', access_token);
    setToken(access_token);
    return access_token;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return { user, token, login, logout };
};
```

### Use in Component
```javascript
function LoginPage() {
  const { login } = useAuth();
  
  const handleLogin = async (e) => {
    e.preventDefault();
    const token = await login('admin@synkrasis.ai', 'Admin123!');
    // Redirect to dashboard
    window.location.href = '/dashboard';
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Protected API Calls
```javascript
const fetchWithAuth = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Use it
const response = await fetchWithAuth('http://localhost:8000/api/sources');
```

---

## Backend - Protected Routes

### Create Protected Endpoint
```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, require_admin
from app.models.base import User

router = APIRouter()

@router.get("/my-data")
async def get_my_data(user: User = Depends(get_current_active_user)):
    return {"message": f"Data for {user.email}"}

@router.post("/admin-action")
async def admin_action(admin: User = Depends(require_admin)):
    return {"message": "Admin action completed"}
```

### Available Dependencies
```python
from app.api.deps import:
  get_current_user              # Any authenticated user
  get_current_active_user       # Active user (not disabled)
  require_admin                 # Admin role
  require_role("engineer")      # Specific role
  require_any_role(["admin", "editor"])  # Multiple roles
```

---

## Testing

### cURL Login
```bash
curl -X POST http://localhost:8000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@synkrasis.ai","password":"Admin123!"}'
```

### Test with Token
```bash
TOKEN="eyJhbGc..." # from login response

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Get Token & Use It (One Command)
```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@synkrasis.ai","password":"Admin123!"}' \
  | jq -r '.access_token')

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## Default Credentials

**Email:** `admin@synkrasis.ai`
**Password:** `Admin123!`

⚠️ Change immediately after first login!

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Incorrect email or password" | Check credentials |
| "Could not validate credentials" | Token expired or invalid |
| CORS error in browser | Check frontend domain in CORS config |
| Token not persisting | Use `localStorage.setItem('token', ...)` |
| 403 Forbidden | Missing Authorization header |

---

## Configuration

### Environment Variables
```bash
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

### Docker Compose
Add to backend service:
```yaml
environment:
  - JWT_SECRET=your-secret-key
  - JWT_EXPIRATION_MINUTES=1440
```

---

## Key Points

✅ Store token in `localStorage`
✅ Send token in `Authorization: Bearer <token>` header
✅ Handle 401 errors (expired token)
✅ Implement logout by clearing token
✅ Use `/api/auth/login/json` for frontend
✅ Check `/api/auth/me` to verify auth
✅ Token expires after 24 hours by default

---

**Status:** Complete & Tested ✅
**Created:** 2026-03-04
