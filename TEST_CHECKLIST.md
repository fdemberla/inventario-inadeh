# 📋 TEST CHECKLIST - Inventario Inadeh WMS

## Overview

Complete testing checklist for demonstrating the Inventario Inadeh Warehouse Management System in a live environment. Tests are organized by priority and include both automated API tests and manual UI validation points.

**Last Updated:** January 13, 2026  
**Test Environment:** MSSQL Test Database

---

## 🚀 Quick Start

### Prerequisites

- Application must be running on `localhost:3000`
- Test database must be configured and running
- Environment variables (.env.local) must be set with:
  - `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_DATABASE`

### Run Application & Tests

```bash
# Terminal 1: Start the development server
npm run dev

# Terminal 2: Run all tests (in another terminal)
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run pre-demo validation
npm run pre-demo
```

### Test Files Location

All automated tests are located in `/tests/api/__tests__/`:

- `auth.test.ts` - Authentication & login
- `users.test.ts` - User management
- `dashboard.test.ts` - Landing page & warehouses
- `scanner.test.ts` - Barcode scanning
- `inventory.test.ts` - Inventory operations

### Expected Test Behavior

- **Total Tests:** 105+
- **Estimated Runtime:** 30-60 seconds
- **Pass Rate:** All should pass if API is running correctly
- **Timeouts:** 10 seconds per test (configurable in jest.config.js)

### If Tests Fail

1. Verify `npm run dev` is running in another terminal
2. Check http://localhost:3000 is accessible
3. Verify database credentials in `.env.local`
4. Check test database is running
5. Look for specific test error messages

---

## ✅ AUTOMATED TESTS (API Layer)

### 1. Authentication Tests ✅ AUTOMATED

**File:** `tests/api/__tests__/auth.test.ts`

#### Valid Credentials

- [x] Login with correct username/password returns 200
- [x] JWT token is set in authentication cookie
- [x] User info is returned in response
- [x] Token can be used for authenticated requests

#### Invalid Credentials

- [x] Wrong password returns 401
- [x] Non-existent user returns 401
- [x] No cookie set on failed login
- [x] Error message is returned

#### Missing Fields

- [x] Missing username returns 400
- [x] Missing password returns 400
- [x] Empty fields are rejected

#### Edge Cases

- [x] Case sensitivity handling
- [x] Rate limiting behavior

**Test Count:** 12 tests  
**Expected Pass Rate:** 100%

---

### 2. User Management Tests ✅ AUTOMATED

**File:** `tests/api/__tests__/users.test.ts`

#### GET /api/users (List Users)

- [x] Returns 200 with user list
- [x] Users have required fields (FirstName, LastName, Email, Role)
- [x] IsActive status is included
- [x] Requires authentication
- [x] Returns empty array if no users

#### GET /api/users/:id (Get Single User)

- [x] Returns user details for valid ID
- [x] Returns 404 for non-existent user
- [x] Requires authentication
- [x] Handles invalid ID format

#### POST /api/users/create (Create User)

- [x] Creates user with valid data
- [x] Validates required fields (FirstName, LastName, Email, RoleID)
- [x] Prevents duplicate emails
- [x] Sets IsActive to true by default
- [x] Requires authentication

#### PUT /api/users/:id/update (Update User)

- [x] Updates user fields
- [x] Allows partial updates
- [x] Updates IsActive status
- [x] Returns 404 for non-existent user
- [x] Requires authentication

#### Role-Based Access Control

- [x] Shows RoleName for each user
- [x] Valid role IDs (1=Admin, 2=General)
- [x] Password hash not exposed in responses

#### Data Validation

- [x] Name length validation
- [x] Special characters in names
- [x] Whitespace trimming

**Test Count:** 28 tests  
**Expected Pass Rate:** 100%

---

### 3. Dashboard/Landing Page Tests ✅ AUTOMATED

**File:** `tests/api/__tests__/dashboard.test.ts`

#### GET /api/warehouses/user (Get User Warehouses)

- [x] Returns 200 with warehouse list
- [x] Contains WarehouseID, WarehouseCode, WarehouseName
- [x] Filters by user role
- [x] Returns empty array if user has no warehouses
- [x] Requires authentication

#### GET /api/inventory/:warehouseId (Get Warehouse Inventory)

- [x] Returns 200 with inventory list
- [x] Contains ProductID, QuantityOnHand, WarehouseID
- [x] Returns empty array for empty warehouses
- [x] Returns 400 for invalid warehouse ID
- [x] Returns 404 for non-existent warehouse
- [x] Requires authentication

#### Data Integration

- [x] Fetches all warehouses and inventories in parallel
- [x] Aggregates inventory by product/category
- [x] Handles multiple warehouses
- [x] Case-sensitive category names

#### Performance

- [x] Warehouse fetch completes within 5 seconds
- [x] Inventory fetch completes within 5 seconds

**Test Count:** 18 tests  
**Expected Pass Rate:** 100%

---

### 4. Scanner/Barcode Tests ✅ AUTOMATED

**File:** `tests/api/__tests__/scanner.test.ts`

#### POST /api/inventory/scanner (Barcode Scanning)

- [x] Valid barcode with operation returns 200 or 404
- [x] "entrada" (receipt) increases inventory
- [x] "salida" (out) decreases inventory
- [x] Returns product name in response
- [x] Returns updated quantity
- [x] Creates transaction record

#### Invalid Barcodes

- [x] Non-existent barcode returns 404
- [x] Missing barcode field returns error
- [x] Empty barcode returns error

#### Operations

- [x] Accepts "entrada" and "salida" operations
- [x] Rejects invalid operation types
- [x] Prevents invalid operations

#### Quantity Validation

- [x] Accepts positive quantities
- [x] Rejects zero quantity
- [x] Rejects negative quantity
- [x] Prevents negative inventory

#### Required Fields

- [x] Requires barcode
- [x] Requires operation
- [x] Requires quantity
- [x] Requires warehouseId

#### Transaction Logging

- [x] Creates transaction record
- [x] Records notes in transaction

#### Offline Support

- [x] Works with or without authentication token
- [x] Supports offline scanner operations

**Test Count:** 23 tests  
**Expected Pass Rate:** 100%

---

### 5. Inventory Management Tests ✅ AUTOMATED

**File:** `tests/api/__tests__/inventory.test.ts`

#### POST /api/inventory/update (Update Inventory)

- [x] Updates inventory for valid product/warehouse
- [x] Accepts different update types
- [x] Requires productId
- [x] Requires warehouseId
- [x] Requires newQuantity
- [x] Accepts non-negative quantities
- [x] Rejects negative quantities

#### GET /api/inventory/transactions (Transaction History)

- [x] Returns transaction list
- [x] Contains TransactionID, InventoryID, TransactionType, QuantityChange
- [x] Supports limit parameter
- [x] Supports order parameter (ASC/DESC)
- [x] Filters by inventoryId
- [x] Requires authentication
- [x] Returns empty array if no transactions

#### POST /api/inventory/scanner/sync (Offline Sync)

- [x] Accepts sync request
- [x] Processes multiple scans in batch
- [x] Returns sync status
- [x] Handles partial failures
- [x] Requires authentication

#### Data Consistency

- [x] QuantityOnHand >= 0
- [x] QuantityReserved <= QuantityOnHand
- [x] ReorderLevel is valid if set

#### Performance

- [x] Transaction history fetch within 5 seconds
- [x] Handles large transaction history efficiently

**Test Count:** 24 tests  
**Expected Pass Rate:** 100%

---

## 📋 MANUAL TESTING CHECKLIST

### Landing Page / Dashboard UI

- [ ] Page loads without errors
- [ ] All accessible warehouses display as cards
- [ ] Each card shows:
  - [ ] Warehouse code
  - [ ] Warehouse name
  - [ ] Location/region
  - [ ] Active/Inactive badge
  - [ ] Total inventory count
  - [ ] Top 5 categories with quantities
  - [ ] "Ver más" button for additional categories
- [ ] "Actualizar Ahora" button works
- [ ] "Auto-actualizar" checkbox toggles
- [ ] Last update timestamp displays correctly
- [ ] Cacheado indicator shows when appropriate
- [ ] "Ver Detalle" links navigate to inventory page
- [ ] Loading states show spinners
- [ ] Error states show alerts
- [ ] Mobile responsiveness (1-2-3 column layout)

### Authentication Flow

- [ ] Login page loads
- [ ] Valid credentials allow access
- [ ] Invalid credentials show error
- [ ] Logout clears session
- [ ] Redirect to login on unauthorized access
- [ ] Token persists across page reloads
- [ ] Logout button in sidebar works

### Inventory Views

- [ ] Inventory page loads for selected warehouse
- [ ] Products list displays
- [ ] Can filter by category
- [ ] Product details show quantity on hand
- [ ] Reserved quantity displays correctly

### Barcode Scanner

- [ ] Scanner page accessible from navigation
- [ ] Camera/barcode input works
- [ ] Valid barcode adds/updates inventory
- [ ] Operation selection (entrada/salida) works
- [ ] Quantity input accepts numbers
- [ ] Offline mode caches scans
- [ ] Online sync processes cached scans

### Products Management

- [ ] Products page lists all products
- [ ] Can create new product
- [ ] Image upload works
- [ ] Can edit existing product
- [ ] Delete functionality works
- [ ] Barcode validation prevents duplicates

### Categories Management

- [ ] Categories page lists categories
- [ ] Can create new category
- [ ] Can edit category
- [ ] Delete functionality works
- [ ] Hierarchical categories (if implemented) display

### Warehouses

- [ ] Warehouse list displays
- [ ] Can create new warehouse
- [ ] Can edit warehouse
- [ ] Location selection works
- [ ] Active/inactive toggle works

### Users Management (Admin Only)

- [ ] Users page lists all users
- [ ] Can create new user
- [ ] Can assign roles (Admin, General)
- [ ] Can assign warehouses
- [ ] Can deactivate users
- [ ] Email validation works

### Reports

- [ ] Reports page loads
- [ ] Can generate inventory report
- [ ] Can export to Excel/PDF
- [ ] Charts display correctly
- [ ] Filters work (date, warehouse, category)

### Offline Mode

- [ ] PWA installs on mobile
- [ ] Can scan barcodes offline
- [ ] Scans queue in IndexedDB
- [ ] Shows "Offline Mode" indicator
- [ ] Syncs when back online
- [ ] Handles sync conflicts

---

## 🎯 Priority Breakdown

### Critical (Must Work)

1. ✅ Login/authentication
2. ✅ Dashboard/warehouse display
3. ✅ Inventory viewing
4. ✅ Barcode scanning (entrada/salida)

### High (Should Work)

1. ✅ User management
2. ✅ Inventory transactions
3. ✅ Auto-refresh functionality
4. ✅ Category aggregation

### Medium (Nice to Have)

1. Product management
2. Category management
3. Offline sync
4. Reports

### Low (Future)

1. Advanced filtering
2. Complex reporting
3. Multi-warehouse analytics

---

## 📊 Test Execution Schedule

### Before Demo (5-10 minutes)

```bash
npm run pre-demo
```

This runs:

1. ESLint validation
2. All API tests
3. Reports results

### During Demo

Demonstrate these manual flows:

1. Login with admin account
2. View dashboard with warehouses
3. Click on warehouse to see inventory
4. Use scanner to add/remove items
5. Check transaction history
6. Show auto-refresh working

### After Changes

```bash
npm run test:watch
```

Continuously monitor test results during development.

---

## 🔍 Known Issues / Skip List

Add known issues here that should be skipped or documented during demo:

```
None currently - all critical functionality tested
```

---

## 📈 Coverage Goals

| Component      | Target | Current |
| -------------- | ------ | ------- |
| API Routes     | 80%    | TBD     |
| Authentication | 100%   | TBD     |
| Dashboard      | 90%    | TBD     |
| Scanner        | 90%    | TBD     |
| Inventory      | 85%    | TBD     |

Run coverage report:

```bash
npm run test:coverage
```

---

## 🚨 Troubleshooting

### Tests fail with "Cannot find module 'mssql'"

```bash
npm install
```

### Database connection fails

- Verify `DB_SERVER`, `DB_USER`, `DB_PASSWORD` in `.env.local`
- Check test database is running
- Verify network connectivity to database

### Tests timeout

- Increase timeout in `jest.config.js` (currently 10 seconds)
- Check database performance
- Verify no locks/blocks on test database

### Token expiration during tests

- Tests should handle token refresh automatically
- If not, check token expiration time in auth system

---

## 📞 Support

For test-related issues:

1. Check test output for specific error
2. Review test file for assertions
3. Verify API endpoint exists and returns expected data
4. Check database has test data

---

## ✨ Demo Talking Points

1. **Automated API Tests:** "We have 105 automated tests covering all critical APIs"
2. **Real Database Testing:** "Tests run against actual test database for real-world validation"
3. **High Reliability:** "All tests isolated with transaction rollback - no data pollution"
4. **Quick Feedback:** "Full test suite runs in ~30 seconds"
5. **Easy to Extend:** "Simple test structure - easy to add more tests as features develop"

---

**Last Modified:** January 13, 2026  
**Test Coverage:** 105+ automated tests across 5 test suites  
**Estimated Full Test Time:** 30-45 seconds
