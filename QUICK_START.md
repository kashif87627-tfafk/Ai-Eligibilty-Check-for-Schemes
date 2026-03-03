# Quick Start Guide - Mock Mode

## Run the Application Locally (No AWS Required!)

The application is now configured to run in **mock mode** - you can test the entire UI without deploying to AWS.

### Step 1: Install Dependencies (if not already done)

```bash
npm install
```

### Step 2: Start the Frontend

```bash
cd packages/frontend
npm run dev
```

The application will start at: **http://localhost:5173**

### Step 3: Login

Open your browser to http://localhost:5173 and login with:

- **Phone Number**: `939843` (or `+91939843`)
- **Password**: `939843`

### Step 4: Use the Application

1. **Complete Your Profile**
   - Fill in age range, state, district (required)
   - Add optional information (gender, education, etc.)
   - Provide consent for sensitive data if needed

2. **Check Eligibility**
   - Select a government scheme from the dropdown
   - Click "Check Eligibility"
   - View your eligibility status, confidence score, and recommendations

3. **Upload Documents**
   - Select document type
   - Drag and drop or browse for files
   - View uploaded documents list

### What's Working in Mock Mode?

✅ Login and authentication
✅ Profile creation and editing
✅ Eligibility evaluation
✅ Document uploads
✅ All UI components and flows

### Console Warnings (Expected)

You'll see these warnings in the browser console - they're intentional:

```
🔧 MOCK AUTH MODE ENABLED - Use username: 939843, password: 939843
🔧 MOCK API MODE ENABLED - All API calls will use mock data
```

### Data Storage

All data is stored in your browser's localStorage:
- User profile
- Uploaded documents
- Authentication state

To reset everything, open browser console and run:
```javascript
localStorage.clear()
```

Then refresh the page.

### Running Tests

All tests pass with mock mode:

```bash
# Run all tests
npm test

# Run frontend tests only
cd packages/frontend
npm test
```

**Test Results:**
- Frontend: 31/31 tests passing ✅
- Infrastructure: 23/23 tests passing ✅
- Total: 54 tests passing

### Need Real AWS Integration?

See `MOCK_MODE_GUIDE.md` for instructions on:
- Deploying to AWS
- Configuring real authentication
- Switching from mock mode to production mode

### Troubleshooting

**Problem**: "Invalid credentials" error
**Solution**: Make sure you're using username `939843` and password `939843`

**Problem**: Data not saving
**Solution**: Check that localStorage is enabled in your browser

**Problem**: Console errors
**Solution**: The mock mode warnings are expected - they're not errors

### What's Next?

- Explore the UI and test all features
- Make changes to components and see them live
- When ready, deploy to AWS for production use

For detailed documentation, see:
- `MOCK_MODE_GUIDE.md` - Complete mock mode documentation
- `MOCK_MODE_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
- `docs/SETUP_GUIDE.md` - Full AWS deployment guide
