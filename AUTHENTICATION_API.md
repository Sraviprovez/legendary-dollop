# Authentication API Documentation

## Status: ✅ COMPLETE AND TESTED

All authentication endpoints are implemented and working.

## API Endpoints

### 1. Login (Form-based)

**Endpoint:** `POST /api/auth/login`

**Content-Type:** `application/x-www-form-urlencoded`

**Request Body:**
```
username=admin@synkrasis.ai&password=Admin123!
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@synkrasis.ai&password=Admin123!"
```

---

### 2. Login (JSON-based) - **Recommended for Frontend**

**Endpoint:** `POST /api/auth/login/json`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "email": "admin@synkrasis.ai",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@synkrasis.ai", "password": "Admin123!"}'
```

**JavaScript Example:**
```javascript
const login = async (email, password) => {
  const response = await fetch('http://localhost:8000/api/auth/login/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  if (response.ok) {
    localStorage.setItem('token', data.access_token);
    return data.access_token;
  } else {
    throw new Error(data.detail);
  }
};
```

---

### 3. Get Current User

**Endpoint:** `GET /api/auth/me`

**Authorization:** Required (Bearer token)

**Request Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "e295409f-a7ea-48e9-b3c9-624787cc8cd1",
    "email": "admin@synkrasis.ai",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin"
  }
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

**JavaScript Example:**
```javascript
const getCurrentUser = async (token) => {
  const response = await fetch('http://localhost:8000/api/auth/me', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (response.ok) {
    return data.data;
  } else {
    throw new Error('Failed to get user');
  }
};
```

---

## Creating Protected Routes

### Using Dependencies

Create protected endpoints using the provided dependencies in `app/api/deps.py`:

```python
from fastapi import APIRouter, Depends
from app.api.deps import get_current_active_user, require_admin
from app.models.base import User

router = APIRouter()

@router.get("/protected-route")
async def protected_route(current_user: User = Depends(get_current_active_user)):
    """Only authenticated users can access"""
    return {"message": f"Hello {current_user.email}"}

@router.get("/admin-only")
async def admin_only(current_user: User = Depends(require_admin)):
    """Only admins can access"""
    return {"message": "Admin endpoint"}

@router.get("/editor-only")
async def editor_only(current_user: User = Depends(require_role("data_engineer"))):
    """Only data engineers can access"""
    return {"message": "Data engineer endpoint"}
```

### Available Dependencies

```python
from app.api.deps import (
    get_current_user,           # Any authenticated user
    get_current_active_user,    # Active authenticated user
    require_admin,              # Admin only
    require_role(role),         # Specific role
    require_any_role(roles)     # Any of specified roles
)
```

---

## Error Handling

### 401 Unauthorized - Invalid Credentials

**Status Code:** `401`

**Response:**
```json
{
  "detail": "Incorrect email or password"
}
```

### 401 Unauthorized - Invalid Token

**Status Code:** `401`

**Response:**
```json
{
  "detail": "Could not validate credentials"
}
```

### 401 Unauthorized - Inactive User

**Status Code:** `401`

**Response:**
```json
{
  "detail": "User account is inactive"
}
```

### 403 Forbidden - Insufficient Permissions

**Status Code:** `403`

**Response:**
```json
{
  "detail": "Admin role required"
}
```

---

## Token Management

### Token Storage (Frontend)

**Recommended:** Store in `localStorage` or `sessionStorage`

```javascript
// After login
localStorage.setItem('token', response.access_token);

// Before API request
const token = localStorage.getItem('token');

// On logout
localStorage.removeItem('token');
```

### Token Format

Tokens are JWT (JSON Web Tokens) with the following claims:
- `sub` - Subject (email address)
- `role` - User role
- `exp` - Expiration time
- `iat` - Issued at time

### Token Expiration

- **Default:** 1440 minutes (24 hours)
- **Configurable:** Set `JWT_EXPIRATION_MINUTES` environment variable

Example:
```bash
export JWT_EXPIRATION_MINUTES=60  # 1 hour
```

---

## Test Scenarios

### Scenario 1: Successful Login

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@synkrasis.ai", "password": "Admin123!"}' \
  | jq -r '.access_token')

# Use token
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Result: 200 OK with user data
```

### Scenario 2: Wrong Password

```bash
curl -X POST http://localhost:8000/api/auth/login/json \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@synkrasis.ai", "password": "wrong"}'

# Result: 401 Unauthorized
```

### Scenario 3: Invalid Token

```bash
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"

# Result: 401 Unauthorized
```

### Scenario 4: Missing Authorization Header

```bash
curl -X GET http://localhost:8000/api/auth/me

# Result: 403 Forbidden (missing credentials)
```

---

## Frontend Integration

### React Hook Example

```javascript
import { useState, useCallback } from 'react';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:8000/api/auth/login/json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail);

      localStorage.setItem('token', data.access_token);
      
      // Get user info
      const userResponse = await fetch('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${data.access_token}` }
      });
      const userData = await userResponse.json();
      
      setUser(userData.data);
      return userData.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  return { user, loading, error, login, logout, getToken };
};
```

### Usage in Component

```javascript
function LoginPage() {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      // Error already in state
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      {error && <p style={{color: 'red'}}>{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Security Best Practices

### ✅ DO

- ✅ Store token in `localStorage` or `sessionStorage`
- ✅ Include token in `Authorization: Bearer <token>` header
- ✅ Set token to expire (24 hours default)
- ✅ Require token for all protected endpoints
- ✅ Clear token on logout
- ✅ Use HTTPS in production
- ✅ Validate token signature server-side

### ❌ DON'T

- ❌ Store token in cookies (if not httpOnly)
- ❌ Send credentials in URL
- ❌ Log tokens
- ❌ Use weak secrets
- ❌ Forget to expire tokens
- ❌ Accept expired tokens
- ❌ Disable HTTPS

---

## Configuration

### Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# Default Admin User (first-run only)
ADMIN_EMAIL=admin@synkrasis.ai
ADMIN_PASSWORD=Admin123!
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

### Production Recommendations

```bash
# Strong secret (at least 32 characters)
JWT_SECRET=$(openssl rand -hex 32)

# Shorter token expiration
JWT_EXPIRATION_MINUTES=60

# Specific allowed origins (in CORS config)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## Troubleshooting

### "Could not validate credentials"

**Cause:** Invalid or expired token

**Solution:**
1. Get a new token using login endpoint
2. Check token hasn't expired
3. Verify token is in correct format in Authorization header

### "Incorrect email or password"

**Cause:** User doesn't exist or password is wrong

**Solution:**
1. Verify email address
2. Check password (case-sensitive)
3. Ensure user account is active
4. Reset password if forgotten

### "Admin role required"

**Cause:** Current user doesn't have admin role

**Solution:**
1. Use admin account to login
2. Contact admin to grant permissions
3. Check user role in database

### "User account is inactive"

**Cause:** User account has been disabled

**Solution:**
1. Contact admin to reactivate account
2. Check user is_active flag in database

---

## Performance Considerations

- **Token Validation:** Fast (JWT signature validation only)
- **Database Queries:** One query per protected endpoint call
- **Caching:** Consider caching user permissions if checking frequently
- **Rate Limiting:** Implement rate limiting on login endpoint

---

## Next Steps

1. **Multi-factor Authentication:** Add TOTP support
2. **Refresh Tokens:** Implement token refresh mechanism
3. **Password Reset:** Add email-based password reset
4. **User Management:** Add admin panel for user management
5. **Audit Logging:** Log all authentication events
6. **OAuth2/OIDC:** Add social login support

---

**Status:** ✅ Complete and tested
**Date:** 2026-03-04
**Version:** 1.0.0
