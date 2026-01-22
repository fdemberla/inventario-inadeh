# Mobile Scanner API Endpoints

Bearer token authentication required for all endpoints. All requests must include:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 1. Single Barcode Scan

**Endpoint:** `POST /api/inventory/scanner/mobile/scan`

Scan and process a single barcode immediately.

### Request Body
```json
{
  "barcode": "123456789",
  "warehouseId": 1,
  "operation": "entrada",
  "quantity": 1
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `barcode` | string | ✓ | Product barcode to scan |
| `warehouseId` | number | ✓ | Warehouse ID for inventory location |
| `operation` | string | ✓ | `"entrada"` (receive) or `"salida"` (ship out) |
| `quantity` | number | | Quantity to add/remove (default: 1) |

### Response (Success - 200)
```json
{
  "success": true,
  "message": "Inventario actualizado correctamente (entrada)",
  "product": {
    "id": 123,
    "name": "Product Name",
    "barcode": "123456789"
  },
  "quantity": 5,
  "operation": "entrada",
  "userId": 1,
  "username": "admin",
  "timestamp": "2026-01-21T10:30:00.000Z"
}
```

### Error Responses
- **404**: Product not found
  ```json
  {
    "success": false,
    "message": "El producto no existe",
    "barcode": "123456789"
  }
  ```
- **400**: Insufficient inventory for "salida"
  ```json
  {
    "success": false,
    "message": "Cantidad insuficiente. Disponible: 2, Solicitado: 5",
    "currentQuantity": 2
  }
  ```
- **401**: Invalid or expired token

---

## 2. Get Products for Mobile Cache

**Endpoint:** `GET /api/inventory/scanner/mobile/products?warehouseId=1`

Get all products with current inventory levels for offline caching.

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `warehouseId` | number | ✓ | Warehouse ID to fetch products for |

### Response (Success - 200)
```json
{
  "success": true,
  "warehouse": {
    "warehouseId": 1,
    "warehouseName": "Main Warehouse",
    "warehouseCode": "MAIN",
    "location": "Panama City"
  },
  "products": [
    {
      "productId": 123,
      "barcode": "123456789",
      "productName": "Product Name",
      "categoryName": "Category",
      "unitName": "Unit",
      "sku": "SKU123",
      "currentQuantity": 50
    }
  ],
  "productCount": 1,
  "userId": 1,
  "username": "admin",
  "cachedAt": "2026-01-21T10:30:00.000Z"
}
```

### Error Responses
- **400**: warehouseId missing or invalid
- **404**: Warehouse not found
- **401**: Invalid or expired token

---

## 3. Bulk Sync Offline Scans

**Endpoint:** `POST /api/inventory/scanner/mobile/sync`

Synchronize multiple scans recorded offline on the mobile device.

### Request Body
```json
{
  "deviceId": "device-uuid-12345",
  "scans": [
    {
      "id": 1,
      "barcode": "123456789",
      "warehouseId": 1,
      "operation": "entrada",
      "quantity": 5,
      "timestamp": "2026-01-21T09:15:00.000Z",
      "deviceId": "device-uuid-12345"
    },
    {
      "id": 2,
      "barcode": "987654321",
      "warehouseId": 1,
      "operation": "salida",
      "quantity": 2,
      "timestamp": "2026-01-21T09:20:00.000Z",
      "deviceId": "device-uuid-12345"
    }
  ]
}
```

### Request Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `deviceId` | string | ✓ | Unique device identifier (UUID) |
| `scans` | array | ✓ | Array of scan objects (max 100) |
| `scans[].id` | number | ✓ | Local unique ID for tracking |
| `scans[].barcode` | string | ✓ | Product barcode |
| `scans[].warehouseId` | number | ✓ | Warehouse ID |
| `scans[].operation` | string | ✓ | `"entrada"` or `"salida"` |
| `scans[].quantity` | number | ✓ | Quantity (must be > 0) |
| `scans[].timestamp` | string | ✓ | ISO 8601 timestamp when scanned |
| `scans[].deviceId` | string | ✓ | Device ID (should match parent) |

### Response (Success - 200)
```json
{
  "success": true,
  "results": [
    {
      "id": 1,
      "success": true,
      "message": "Product Name (entrada) - Nueva cantidad: 55",
      "serverQuantity": 55
    },
    {
      "id": 2,
      "success": true,
      "message": "Another Product (salida) - Nueva cantidad: 8",
      "serverQuantity": 8
    }
  ],
  "serverTime": "2026-01-21T10:30:00.000Z",
  "summary": {
    "total": 2,
    "synced": 2,
    "failed": 0
  },
  "userId": 1,
  "username": "admin"
}
```

### Response with Partial Failures (200)
```json
{
  "success": false,
  "results": [
    {
      "id": 1,
      "success": false,
      "error": "Producto no encontrado",
      "conflictType": "product_not_found"
    },
    {
      "id": 2,
      "success": true,
      "message": "Product (entrada) - Nueva cantidad: 10",
      "serverQuantity": 10
    }
  ],
  "summary": {
    "total": 2,
    "synced": 1,
    "failed": 1
  }
}
```

### Conflict Types
| Type | Meaning |
|------|---------|
| `product_not_found` | Barcode doesn't exist in database |
| `negative_inventory` | Not enough stock for "salida" operation |
| `invalid_data` | Missing required fields in scan |
| `invalid_operation` | Operation must be "entrada" or "salida" |
| `invalid_quantity` | Quantity must be > 0 |
| `server_error` | Database or server error |

### Error Responses
- **400**: Invalid request body or exceeds 100 scans
- **401**: Invalid or expired token
- **500**: Server error

---

## React Native Implementation

### Example: Single Scan
```typescript
const response = await api.post('/api/inventory/scanner/mobile/scan', {
  barcode: scannedCode,
  warehouseId: selectedWarehouse,
  operation: 'entrada',
  quantity: 1
});

if (response.data.success) {
  Alert.alert('Éxito', `${response.data.product.name} - Cantidad: ${response.data.quantity}`);
} else {
  Alert.alert('Error', response.data.message);
}
```

### Example: Offline Sync
```typescript
const offlineScans = await getStoredScans(); // From local SQLite

const response = await api.post('/api/inventory/scanner/mobile/sync', {
  deviceId: getDeviceId(),
  scans: offlineScans.map(scan => ({
    id: scan.id,
    barcode: scan.barcode,
    warehouseId: scan.warehouseId,
    operation: scan.operation,
    quantity: scan.quantity,
    timestamp: scan.timestamp,
    deviceId: getDeviceId()
  }))
});

// Process results
response.data.results.forEach(result => {
  if (result.success) {
    markScanAsSynced(result.id);
  } else {
    logSyncError(result.id, result.conflictType);
  }
});
```

### Example: Load Product Cache
```typescript
const response = await api.get('/api/inventory/scanner/mobile/products', {
  params: { warehouseId: selectedWarehouse }
});

const products = response.data.products;
await saveProductsToLocalDB(products);
```

---

## Authentication Error

If token is invalid or expired:
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

Status: **401**

Re-authenticate with `/api/auth/mobile/login` to get a new token.

---

## Rate Limiting & Security

- Single scan requests are throttled per user/device
- Sync requests limited to 100 scans per request
- All timestamps must be ISO 8601 format
- Device ID should be persistent UUID across app reinstalls
- Bearer token stored securely in device's secure storage
