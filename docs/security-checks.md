# CI, runtime y detección de secretos

## Runtime y acciones fijadas

Verificado el 30 de octubre de 2026 contra fuentes primarias:

- [Node.js 24.22.2 LTS](https://nodejs.org/en/blog/release/v24.22.2): es posterior al parche de seguridad 24.22.1 del 21 de octubre de 2026. `.nvmrc`, CI y `devEngines.runtime` fijan esta versión; `engines.node` exige al menos 24.22.2 dentro de la línea 24.
- [actions/checkout v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1), fijada al commit [`3d3c42e5aac5ba805825da76410c181273ba90b1`](https://github.com/actions/checkout/commit/3d3c42e5aac5ba805825da76410c181273ba90b1).
- [actions/setup-node v7.1.0](https://github.com/actions/setup-node/releases/tag/v7.1.0), fijada al commit [`949feb2413d6458794dcd2491c4babbbce0c15c1`](https://github.com/actions/setup-node/commit/949feb2413d6458794dcd2491c4babbbce0c15c1).

Las acciones usan runtime interno Node 24 y requieren un runner reciente. `ubuntu-latest` de GitHub lo proporciona; un runner propio debe cumplir los requisitos oficiales. El Node interno de una acción no cambia el Node del proyecto configurado desde `.nvmrc`. CI comprueba que el runtime coincide exactamente con ese archivo. Railpack prioriza `RAILPACK_NODE_VERSION` y después `devEngines.runtime`; no se debe configurar allí una versión anterior al parche.

El token del checkout no se conserva, los permisos siguen limitados a lectura y no se pasan secretos de producción a la validación. Dependabot revisa semanalmente npm y GitHub Actions. Las ejecuciones antiguas de una misma rama se cancelan al llegar una nueva.

## Detector sin dependencias

```sh
npm run test:secrets
npm run audit:secrets
npm run build
node scripts/audit-secrets.mjs --artifacts-only
```

La revisión de código incluye los archivos seguidos por Git, los archivos nuevos no ignorados y los blobs históricos accesibles en las referencias locales. CI obtiene el historial completo antes de ejecutarla. El control de publicación revisa el `dist` generado y falla si no existe; no inspecciona producción ni envía correos o solicitudes a la API.

El detector busca patrones de claves privadas, tokens de proveedores, JWT, credenciales incrustadas en URLs y literales sensibles de alta entropía. También marca archivos env o contenedores de credenciales que hayan entrado al repositorio, sin abrirlos. Rechaza enlaces simbólicos y no recorre fuera del proyecto. En `dist` marca además mapas de código fuente, logs, bases de datos y directorios privados inesperados.

Los informes muestran únicamente ruta, línea, regla y, para el historial, identificador de blob. No imprimen coincidencias, valores, fragmentos de código ni errores sin filtrar. Las pruebas construyen sus cadenas sintéticas en memoria: no guardan credenciales reales ni tokens completos de ejemplo.

Es un control heurístico, no una certificación. No extrae texto de imágenes/PDF ni descomprime archivos binarios; tampoco identifica todos los formatos posibles de secretos. Un `.pem` público o una firma JWT de prueba pueden necesitar revisión manual. No se permiten exclusiones globales de carpetas de pruebas: un token real en una prueba también debe bloquearse.

Si aparece un secreto, revócalo o rótalo antes de limpiar el historial. Borrar su versión actual no lo elimina de los commits anteriores. No publiques el valor para pedir ayuda ni conviertas la regla en una excepción genérica.

## Configuración que sigue siendo externa al repositorio

- Confirmar en Vercel que el proyecto use Node 24.x y redeplegar; el manifiesto fija la versión mínima parcheada. En Railway, confirmar que no haya un `RAILPACK_NODE_VERSION` antiguo que sobreescriba `devEngines.runtime`, y verificar el runtime en los logs del nuevo despliegue. No se instala ni actualiza Node automáticamente en la máquina del desarrollador.
- Habilitar en GitHub la detección de secretos y protección de push disponibles para el repositorio; este script no sustituye esos controles.
- Hacer obligatorio el check `quality` en la protección de `main` y revisar los cambios en workflows y en el propio detector. Una PR puede modificar estos archivos, por lo que el control no sustituye la revisión humana.
- Revisar y aceptar las actualizaciones de Dependabot; fijar un SHA no actualiza una acción por sí mismo.
