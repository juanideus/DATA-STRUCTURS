# Correcciones de la auditoría de seguridad — 19 de octubre de 2026

Cambios locales, sin despliegue, envío de correos, modificación de credenciales ni cambios en las cuentas de infraestructura.

| Hallazgo | Corrección y estado |
| --- | --- |
| SEC01 — confianza en cabeceras de IP | Las cabeceras se ignoran salvo que el socket pertenezca a un CIDR explícitamente confiable. Railway en producción exige configurar esos CIDR antes de arrancar. **Falta confirmar el contrato real del ingress y configurarlo antes de desplegar.** |
| SEC02 — representaciones equivalentes de IPv6 | Se normalizan IPv6 e IPv4 mapeada antes de calcular la identidad y consumir el límite. Las variantes textuales comparten contador. |
| SEC03 — agotamiento del cupo global y contadores por instancia | Se conserva el límite temprano para proteger parsing, memoria y servicios externos. **No está resuelto solo con código:** falta protección de borde en todas las rutas públicas y, antes de usar varias réplicas, un almacén compartido de contadores. |
| SEC04 — runtime desactualizado | `.nvmrc`, manifiestos, lockfiles y CI usan un contrato LTS actualizado. **Falta comprobar el runtime efectivo de los despliegues.** |
| SEC05 — URL con parámetros sensibles | Navegador y API conservan solo origen y ruta: excluyen usuario, contraseña, query y fragmento. No se cambia la URL navegada ni el SEO. |
| SEC06 — Turnstile sin recuperación | Carga compartida con timeout, limpieza de scripts fallidos y recuperación al reabrir. El formulario conserva los datos y no permite enviar sin verificación. Mensajes consistentes en español e inglés. |
| SEC07 — tipos JSON incorrectos | Se rechazan raíces inválidas con 400 y campos de tipos incorrectos con 422, con errores públicos controlados. Se valida exactamente el tipo de contenido JSON. |
| SEC08 — CSP demasiado amplia | Se elimina el comodín `*.up.railway.app`; el frontend permite la API concreta y Turnstile. |
| SEC09 — cadena de suministro y secretos | Acciones fijadas por SHA, checkout sin credenciales persistentes, Dependabot para acciones y detector local/CI para archivos, historial y artefactos. **Falta verificar los controles externos de GitHub y el CI remoto.** |

## Verificación local

- 71 pruebas de API, validación, IP, límites, secretos, configuración y loader aprobadas.
- 12 pruebas de navegador aprobadas en escritorio y móvil, con servicios externos interceptados: envío saneado, validación, recuperación, aislamiento de widgets y ausencia de autoenvíos.
- Build de producción, auditoría funcional y auditoría SEO aprobados; 174 URLs SEO revisadas.
- Auditoría de dependencias sin avisos conocidos en esa fecha, incluyendo dependencias de desarrollo.
- Escaneo heurístico de código actual, 893 blobs históricos y 202 artefactos generados sin hallazgos de secretos. No certifica la ausencia absoluta de secretos.

## Antes de desplegar

1. Confirmar con Railway los CIDR del ingress que llega al socket y que `X-Real-IP` se sobrescribe, no se conserva desde el cliente. No usar rangos universales ni adivinar rangos privados. Ver [despliegue de reportes](../report/README.md).
2. Preparar protección de borde para el dominio personalizado y cualquier dominio alternativo accesible. CORS no reemplaza esta protección. Probar falsos positivos de alumnos que comparten IP universitaria y observar respuestas 429.
3. Mantener una réplica hasta contar con límites compartidos; comprobar el runtime LTS efectivo en Railway/Vercel.
4. Ejecutar CI remoto y comprobar protección de `main`, detección de secretos y protección de push disponibles. Ver [controles de seguridad](security-checks.md).
5. En staging, probar el reporte con dos clientes y cabeceras falsificadas antes del cambio de producción. No desplegar la nueva política de proxy sin la configuración confirmada.

Estos cambios reducen riesgos concretos; no equivalen a inmunidad frente a DDoS ni a una certificación de seguridad.
