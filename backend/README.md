# Beacon mHealth Backend

Backend API for the Beacon mHealth mobile application.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: Firebase Admin SDK
- **Notifications**: Firebase Cloud Messaging (FCM)

## Prerequisites

1. **Node.js** (v14 or higher)
2. **PostgreSQL** (v12 or higher)
3. **Firebase Project** with authentication enabled

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password
   - Enable Google
4. Generate service account key:
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save the JSON file

### 2. PostgreSQL Setup

1. Install PostgreSQL if not installed
2. Create a new database:
```sql
CREATE DATABASE beacon_db;
```

3. Run the schema:
```bash
psql -U your_username -d beacon_db -f prisma/schema.sql
```

### 3. Environment Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in the environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/beacon_db"
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
JWT_SECRET=your-random-secret-key
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:8081,exp://192.168.1.100:8081
```

**Note**: Get Firebase credentials from the service account JSON file you downloaded.

### 4. Install Dependencies

```bash
npm install
```

### 5. Run the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register/ update user after Firebase auth
- `GET /api/auth/profile` - Get user profile (protected)
- `POST /api/auth/fcm-token` - Update FCM token (protected)
- `POST /api/auth/verify` - Verify auth token (protected)

### Health Check

- `GET /health` - Server  health status

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # PostgreSQL connection
│   │   └── firebase.js      # Firebase Admin SDK
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── errorHandler.js  # Global error handler
│   ├── routes/
│   │   └── auth.js          # Auth routes
│   ├── controllers/
│   │   └── authController.js # Auth logic
│   ├── services/            # Business logic
│   ├── utils/               # Helper functions
│   └── index.js             # Express app entry
├── prisma/
│   └── schema.sql           # Database schema
├── .env                     # Environment variables
├── .env.example             # Environment template
└── package.json
```

## Testing

Health check:
```bash
curl http://localhost:3000/health
```

## Next Steps

1. Complete Phase 1: Implement client-side Firebase authentication
2. Complete Phase 2: Add child management endpoints
3. Complete Phase 3: Implement milestone tracking
4. Continue with remaining phases as per implementation plan

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists and schema is loaded

### Firebase Auth Issues
- Verify service account credentials in .env
- Ensure private key includes newlines properly
- Check Firebase project ID matches

## License

Proprietary
