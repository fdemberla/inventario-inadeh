import fs from "fs";
import path from "path";

/**
 * Convierte un certificado .cer a formato PEM para usar con SAML
 */
export function loadCertificate(certPath: string): string {
  try {
    const fullPath = path.resolve(process.cwd(), certPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Certificate file not found at ${fullPath}`);
      return "";
    }

    let certContent = fs.readFileSync(fullPath, "utf8");

    // Si es un archivo .cer, asumimos que ya está en formato Base64
    // y necesitamos agregar los headers PEM si no los tiene
    if (!certContent.includes("-----BEGIN CERTIFICATE-----")) {
      // Limpiar cualquier whitespace y saltos de línea
      const cleanCert = certContent.replace(/\s/g, "");

      // Agregar headers PEM y formatear
      certContent = `-----BEGIN CERTIFICATE-----\n${cleanCert.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
    }

    return certContent;
  } catch (error) {
    console.error("Error loading certificate:", error);
    return "";
  }
}

/**
 * Extrae el certificado del XML de metadatos de federación
 */
export function extractCertFromMetadata(metadataXml: string): string {
  try {
    // Buscar el certificado en el XML
    const certMatch = metadataXml.match(
      /<X509Certificate>([\s\S]*?)<\/X509Certificate>/,
    );

    if (certMatch && certMatch[1]) {
      const certData = certMatch[1].replace(/\s/g, "");
      return `-----BEGIN CERTIFICATE-----\n${certData.match(/.{1,64}/g)?.join("\n")}\n-----END CERTIFICATE-----`;
    }

    return "";
  } catch (error) {
    console.error("Error extracting certificate from metadata:", error);
    return "";
  }
}
