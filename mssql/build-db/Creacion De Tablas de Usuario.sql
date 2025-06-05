
CREATE TABLE inventario.dbo.Roles (
    RoleID INT IDENTITY(1,1) PRIMARY KEY,
    RoleName NVARCHAR(50) NOT NULL UNIQUE, -- 'admin' or 'user'
    Description NVARCHAR(255) NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL
);


CREATE TABLE inventario.dbo.Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(MAX) NOT NULL,
    RoleID INT NOT NULL, -- FK to Roles
    FirstName NVARCHAR(100) NULL,
    LastName NVARCHAR(100) NULL,
    Phone NVARCHAR(20) NULL,
    Email NVARCHAR(255) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    ModifiedDate DATETIME2 NULL,
    CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleID) REFERENCES Roles(RoleID)
);

CREATE TABLE inventario.dbo.WarehouseUsers (
    WarehouseUserID INT IDENTITY(1,1) PRIMARY KEY,
    UserID INT NOT NULL,
    WarehouseID INT NOT NULL,
    CreatedDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_WarehouseUsers_Users FOREIGN KEY (UserID) REFERENCES Users(UserID),
    CONSTRAINT FK_WarehouseUsers_Warehouses FOREIGN KEY (WarehouseID) REFERENCES Warehouses(WarehouseID),
    CONSTRAINT UQ_WarehouseUsers_User_Warehouse UNIQUE (UserID, WarehouseID)
);





-- Users table indexes
CREATE INDEX IX_Users_Username ON Users(Username);
CREATE INDEX IX_Users_RoleID ON Users(RoleID);

-- WarehouseUsers table indexes
CREATE INDEX IX_WarehouseUsers_UserID ON WarehouseUsers(UserID);
CREATE INDEX IX_WarehouseUsers_WarehouseID ON WarehouseUsers(WarehouseID);
