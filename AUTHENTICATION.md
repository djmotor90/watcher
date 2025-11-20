# Authentication Guide

## Overview

The Watcher application now includes a complete authentication system using JWT (JSON Web Tokens) and bcrypt password hashing. This secures both the API and dashboard access.

## Features

- **User Registration**: Create new accounts with email and password
- **User Login**: Authenticate with email and password
- **JWT Tokens**: Secure token-based authentication
- **Password Hashing**: bcrypt with 10 rounds for security
- **Token Expiry**: Tokens valid for 7 days
- **Token Verification**: Validate JWT tokens on protected endpoints

## API Endpoints

### Signup
**POST** `/api/auth/signup`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "User Name"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400`: Missing required fields (email, password, name)
- `409`: User already exists with that email
- `500`: Server error

### Login
**POST** `/api/auth/login`

Authenticate with email and password to receive a JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `401`: Invalid email or password
- `500`: Server error

### Verify Token
**GET** `/api/auth/verify`

Verify and decode a JWT token.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "userId": "user_id",
    "email": "user@example.com",
    "iat": 1763654114,
    "exp": 1764258914
  }
}
```

**Error Responses:**
- `401`: No token provided or invalid token

## Dashboard Usage

### Initial Access

1. Open the dashboard at `http://localhost:3001`
2. You'll see the login page if not authenticated
3. Click **"Sign Up"** to create a new account or use **"Login"** if you already have one

### Signup Flow

1. Enter your name, email, and password
2. Click **Sign Up**
3. Upon success, you'll be logged in and redirected to the dashboard
4. Your token is stored in `localStorage` as `authToken`

### Login Flow

1. Enter your email and password
2. Click **Login**
3. Upon success, you'll be redirected to the dashboard
4. Your token is stored in `localStorage` as `authToken`

### Logout

1. Click the **Logout** button in the top-right corner
2. Your token will be removed from `localStorage`
3. You'll be redirected to the login page

## API Integration

### Using Tokens with API Calls

Include the token in the `Authorization` header when making requests to protected endpoints:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:3000/api/dashboard/summary
```

Or with axios (JavaScript):

```javascript
const token = localStorage.getItem('authToken');
const response = await axios.get('http://localhost:3000/api/dashboard/summary', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with 10 rounds
- Never stored in plain text
- Minimum recommended password length: 8 characters
- Use strong passwords with uppercase, lowercase, numbers, and symbols

### Token Security
- Tokens are valid for 7 days
- Stored in `localStorage` on the client
- Sent in the `Authorization` header with each request
- For production, consider:
  - Using httpOnly cookies instead of localStorage
  - Implementing token refresh mechanism
  - Adding HTTPS enforcement
  - Implementing rate limiting on auth endpoints

### Environment Variables

Configure the JWT secret in your `.env` file:

```
JWT_SECRET=your-super-secret-key-change-this-in-production
```

Default fallback: `your-secret-key` (used only if `JWT_SECRET` not set)

**IMPORTANT**: Change the JWT secret in production!

## Database Schema

The `User` table stores:
- `id`: Unique identifier (Prisma ID)
- `email`: User email (unique)
- `password`: Hashed password (bcrypt)
- `name`: User's display name
- `role`: User role (default: "admin")
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

## Testing Authentication

### Create a Test User

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "name": "Test User"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### Verify Token

```bash
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Troubleshooting

### "User already exists"
The email address is already registered. Use a different email or use the login endpoint.

### "Invalid email or password"
Check that your email and password are correct. Both are case-sensitive.

### "No token provided"
Include the `Authorization` header with your token when accessing protected endpoints.

### "Invalid token"
The token may be expired, malformed, or the signature is invalid. Try logging in again to get a fresh token.

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Two-factor authentication (2FA)
- [ ] Social login (Google, GitHub, etc.)
- [ ] Token refresh endpoint
- [ ] Rate limiting on auth endpoints
- [ ] Account deletion
- [ ] Change password functionality
- [ ] User profile management

## Integration with Existing Features

### Agent Registration

Agent registration still uses API key + secret authentication and is separate from user authentication. This allows agents to register without user intervention.

### Dashboard Access

The dashboard now requires user login. Once authenticated, the user's JWT token is used to access all dashboard endpoints.

### ClickUp Integration

ClickUp integration remains unchanged but is available through authenticated dashboard endpoints.

## Migration from Previous Version

If you had an existing installation:

1. The database automatically includes the `User` table
2. Existing agent data is preserved
3. All dashboard endpoints now require authentication
4. Agents continue to use API key authentication (unchanged)
