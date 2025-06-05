CREATE TABLE Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    ParentCategoryID INT NULL,
    Description NVARCHAR(500) NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_Categories_ParentCategory FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    InternalSKU NVARCHAR(50) NOT NULL UNIQUE,
    ProductName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    Barcode NVARCHAR(50) NULL UNIQUE,
    CategoryID INT NULL,
    ImageURL NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID)
);

CREATE TABLE Warehouses (
    WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseCode NVARCHAR(20) NOT NULL UNIQUE,
    WarehouseName NVARCHAR(100) NOT NULL,
    Location NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL
);

CREATE TABLE Inventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    WarehouseID INT NOT NULL,
    QuantityOnHand INT NOT NULL DEFAULT 0,
    QuantityReserved INT NOT NULL DEFAULT 0,
    ReorderLevel INT NULL,
    LastStockedDate DATETIME2 NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_Inventory_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_Inventory_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    CONSTRAINT UQ_Inventory_Product_Warehouse UNIQUE (ProductID, WarehouseID)
);

CREATE TABLE InventoryTransactions (
    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
    InventoryID INT NOT NULL,
    TransactionType NVARCHAR(20) NOT NULL, -- 'RECEIPT', 'SHIPMENT', 'ADJUSTMENT', 'TRANSFER'
    QuantityChange INT NOT NULL,
    ReferenceNumber NVARCHAR(50) NULL,
    Notes NVARCHAR(MAX) NULL,
    CreatedBy NVARCHAR(100) NULL, -- Will reference Users table when you add authentication
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_InventoryTransactions_Inventory FOREIGN KEY (InventoryID) REFERENCES Inventory(InventoryID),
    CONSTRAINT CHK_TransactionType CHECK (TransactionType IN ('RECEIPT', 'SHIPMENT', 'ADJUSTMENT', 'TRANSFER'))
);

CREATE TABLE Suppliers (
    SupplierID INT IDENTITY(1,1) PRIMARY KEY,
    SupplierName NVARCHAR(100) NOT NULL,
    ContactPerson NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(100) NULL,
    Address NVARCHAR(MAX) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL
);

CREATE TABLE ProductSuppliers (
    ProductSupplierID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    SupplierID INT NOT NULL,
    SupplierSKU NVARCHAR(50) NULL,
    LeadTimeDays INT NULL,
    Cost DECIMAL(19,4) NULL,
    IsPrimarySupplier BIT NOT NULL DEFAULT 0,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_ProductSuppliers_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID),
    CONSTRAINT FK_ProductSuppliers_Suppliers FOREIGN KEY (SupplierID) REFERENCES Suppliers(SupplierID),
    CONSTRAINT UQ_ProductSupplier UNIQUE (ProductID, SupplierID)
);

CREATE TABLE UnitsOfMeasurement (
    UnitID INT IDENTITY(1,1) PRIMARY KEY,
    UnitName NVARCHAR(50) NOT NULL,
    Abbreviation NVARCHAR(10) NULL,
    System NVARCHAR(20) NOT NULL DEFAULT 'Personalizado',
    IsActive BIT NOT NULL DEFAULT 1
);


-- Products table indexes
CREATE INDEX IX_Products_InternalSKU ON Products(InternalSKU);
CREATE INDEX IX_Products_Barcode ON Products(Barcode);
CREATE INDEX IX_Products_CategoryID ON Products(CategoryID);

-- Inventory table indexes
CREATE INDEX IX_Inventory_ProductID ON Inventory(ProductID);
CREATE INDEX IX_Inventory_WarehouseID ON Inventory(WarehouseID);

-- Transactions table indexes
CREATE INDEX IX_InventoryTransactions_InventoryID ON InventoryTransactions(InventoryID);
CREATE INDEX IX_InventoryTransactions_CreatedDate ON InventoryTransactions(CreatedDate);