CREATE TABLE inventario.dbo.ProductsIstmo (
    codigo NVARCHAR(150) PRIMARY KEY,         		-- Unique code (Primary Key)
    nombre NVARCHAR(256) NOT NULL,          		-- First name for the product
    descripcion NVARCHAR(512) NULL,              	-- Second name for the product (optional)
    unidad_medida NVARCHAR(20) NOT NULL      		-- Unit of measurement (e.g., lb, kg)
);