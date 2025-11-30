# Authentication Testing Guide

## ✅ Setup Complete

### What's Been Configured:
1. ✅ Firebase SDK installed and configured
2. ✅ Auth screens replaced with Firebase-integrated versions
3. ✅ Backend API running on port 3000
4. ✅ PostgreSQL database connected with all tables
5. ✅ Email verification enforced
6. ✅ Strong password validation active

---

## 🔧 Final Step: Get Firebase Web API Key

**You need to get your Firebase Web API Key to complete setup:**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **beaconmobileapp-256f4**
3. Click ⚙️ **Settings** → **Project Settings**
4. Scroll down to "Your apps" section
5. Click on the **Web app** (</> icon) if it exists, OR click "Add app" → "Web"
6. Copy the **apiKey** value from the Firebase config

**Then update `config/firebase.js` line 11:**
```javascript
apiKey: "YOUR_ACTUAL_API_KEY_HERE",
```

---

## 🧪 Testing Authentication Flow

### Test 1: Sign Up with Email Verification

1. **Start the app:**
   ```powershell
   # In a new terminal (keep backend running)
   cd c:\Users\Admin\Desktop\Beacon-Mhealth
   npx expo start
   ```

2. **Create an account:**
   - Open the app on your device/emulator
   - Go to signup screen
   - Enter:
     - Full Name: `Test User`
     - Email: your-email@example.com
     - Password: `Test@1234` (meets strong password requirements)
     - Confirm Password: `Test@1234`
   - Click "Create Account"

3. **Expected Result:**
   - ✅ Success message: "Account created! Please check your email..."
   - ✅ Password strength indicator shows "Strong"
   - ✅ User is automatically signed out
   - ✅ Verification email sent to your inbox

4. **Check your email:**
   - Open verification email from Firebase
   - Click the verification link

---

### Test 2: Login WITHOUT Email Verification (Should Fail)

1. **Before verifying email, try to login:**
   - Email: your-email@example.com
   - Password: `Test@1234`
   - Click "Sign In"

2. **Expected Result:**
   - ❌ Error: "Please verify your email before logging in..."
   - ❌ Login blocked

---

### Test 3: Login WITH Email Verification (Should Succeed)

1. **After clicking the verification link in email:**
   - Go back to login screen
   - Email: your-email@example.com
   - Password: `Test@1234`
   - Click "Sign In"

2. **Expected Result:**
   - ✅ Login successful
   - ✅ Redirected to dashboard
   - ✅ User data synced to backend database
   - ✅ Check backend terminal for "Executed query" logs

3. **Verify Backend:**
   Open a new terminal and check if user was created:
   ```powershell
   # Query the database (you'll need psql or a DB client)
   # The user should exist in the 'users' table with:
   # - firebase_uid
   # - email
   # - created_at timestamp
   ```

---

### Test 4: Strong Password Validation

1. **Try to sign up with weak passwords:**

   **Test Case 1:** Password too short
   - Password: `Test@1`
   - Expected: ❌ "Password must be at least 8 characters long"

   **Test Case 2:** Missing uppercase
   - Password: `test@1234`
   - Expected: ❌ "Password must contain at least one uppercase letter"

   **Test Case 3:** Missing special character
   - Password: `Test1234`
   - Expected: ❌ "Password must contain at least one special character"

   **Test Case 4:** Strong password
   - Password: `Test@1234`
   - Expected: ✅ Password strength shows "Strong" (green)

---

## 🐛 Troubleshooting

### Issue: Firebase errors
- **Solution**: Make sure you've updated the API key in `config/firebase.js`

### Issue: Backend not responding
- **Check**: Backend server is running on port 3000
- **Test**: Open http://localhost:3000/health in browser
- **Expected**: `{"status":"OK"}`

### Issue: Database errors
- **Check**: Railway DATABASE_URL is correct in backend/.env
- **Check**: Tables were created (run deployment script again if needed)

### Issue: Email not sending
- **Check**: Firebase Authentication is enabled
- **Check**: Email/Password provider is enabled in Firebase Console

---

## 📊 Success Criteria

All tests should pass:
- ✅ Signup creates account and sends verification email
- ✅ Login blocked without email verification
- ✅ Login successful after email verification
- ✅ User data appears in PostgreSQL database
- ✅ Strong password validation works
- ✅ Backend server receives and processes requests

---

## 🎯 Next Steps After Testing

Once authentication is working:
1. **Phase 2**: Implement Add Child logic with backend
2. **Phase 3**: Implement Milestone tracking
3. **Phase 4**: Continue with remaining features

**Keep both terminals running:**
- Terminal 1: Backend (npm run dev)
- Terminal 2: Frontend (npx expo start)
