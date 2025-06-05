

CREATE TABLE UnitsOfMeasurement (
    UnitID INT IDENTITY(1,1) PRIMARY KEY,
    UnitName NVARCHAR(50) NOT NULL,
    Abbreviation NVARCHAR(10) NULL,
    System NVARCHAR(20) NOT NULL DEFAULT 'Personalizado',
    IsActive BIT NOT NULL DEFAULT 1
);

INSERT INTO UnitsOfMeasurement (UnitName, Abbreviation, System)
VALUES 
('bolsa', NULL, 'Personalizado'),
('bolsitas', NULL, 'Personalizado'),
('botellas', NULL, 'Personalizado'),
('unidad', NULL, 'Personalizado'),
('cajas', NULL, 'Personalizado'),
('collar', NULL, 'Personalizado'),
('docena', 'doc', 'Personalizado'),
('galón', NULL, 'Personalizado'),
('latas', NULL, 'Personalizado'),
('libra', 'lb', 'Personalizado'),
('paquete', NULL, 'Personalizado'),
('par', NULL, 'Personalizado'),
('pote', NULL, 'Personalizado'),
('resma', NULL, 'Personalizado'),
('rollo', NULL, 'Personalizado'),
('saco', NULL, 'Personalizado'),
('sobres', NULL, 'Personalizado'),
('tanques', NULL, 'Personalizado'),
('tramos', NULL, 'Personalizado'),
('yarda', 'yd', 'Personalizado');


-- Sistema Métrico Decimal
INSERT INTO UnitsOfMeasurement (UnitName, Abbreviation, System)
VALUES 
('milímetro', 'mm', 'Métrico'),
('centímetro', 'cm', 'Métrico'),
('metro', 'm', 'Métrico'),
('kilómetro', 'km', 'Métrico'),
('miligramo', 'mg', 'Métrico'),
('gramo', 'g', 'Métrico'),
('kilogramo', 'kg', 'Métrico'),
('mililitro', 'ml', 'Métrico'),
('litro', 'l', 'Métrico');


-- Sistema Imperial
INSERT INTO UnitsOfMeasurement (UnitName, Abbreviation, System)
VALUES 
('pulgada', 'in', 'Imperial'),
('pie', 'ft', 'Imperial'),
('yarda', 'yd', 'Imperial'),
('milla', 'mi', 'Imperial'),
('onza', 'oz', 'Imperial'),
('libra', 'lb', 'Imperial'),
('galón', 'gal', 'Imperial'),
('cuarto de galón', 'qt', 'Imperial'),
('pinta', 'pt', 'Imperial');
