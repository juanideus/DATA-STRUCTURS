# DSA Lab Report API

Servicio independiente para recibir el formulario **Informar problema** de DSA Lab y enviarlo mediante Resend. Se despliega como servicio Node.js en Railway y queda disponible en `https://api.dsalab.dev`.

## Endpoints

- `GET /` y `GET /health`: comprueban que el servicio está activo.
- `POST /api/report`: valida el formulario y envía el correo.

## Desarrollo local

Requiere Node.js 24.22.2 LTS o una versión posterior de la línea 24. El runtime exacto está fijado en `devEngines` para Railway.

```bash
cd report
copy .env.example .env
npm test
npm start
```

Node no carga `.env` automáticamente en este proyecto. Para realizar un envío local, define las variables en la terminal o usa `node --env-file=.env src/server.js`. Las pruebas incluidas no consumen Resend ni envían correos reales.

## Configuración en Railway

Crea un proyecto o servicio conectado al repositorio `juanideus/DATA-STRUCTURS` y configura:

| Campo | Valor |
| --- | --- |
| Branch | `main` |
| Root Directory | `/report` |
| Build Command | automático (`npm ci`) |
| Start Command | automático (`npm start`) |
| Health Check Path | `/health` |
| Restart Policy | `On Failure` |

Railway detecta `package.json`, instala con el lockfile, ejecuta `npm start` y proporciona `PORT` automáticamente. No crees una variable `PORT` en producción.

Configura en **Variables**:

```env
RESEND_API_KEY=re_xxxxxxxxx
REPORT_EMAIL=correo-asociado-a-resend@ejemplo.com
REPORT_FROM=DSA Lab <reportes@dsalab.dev>
ALLOWED_ORIGINS=https://www.dsalab.dev,https://dsalab.dev,https://data-structurs.vercel.app
TURNSTILE_SECRET_KEY=clave-secreta-entregada-por-cloudflare
TURNSTILE_HOSTNAMES=www.dsalab.dev,dsalab.dev,data-structurs.vercel.app
NODE_ENV=production
CLIENT_IP_SOURCE=railway-public
```

No agregues `RESEND_API_KEY` ni `TURNSTILE_SECRET_KEY` al frontend, a una variable `VITE_*`, al repositorio ni al archivo `.env.example`. Los orígenes oficiales ya están autorizados en el servicio; `ALLOWED_ORIGINS` permite añadir otros sin reemplazarlos.

### Requisito antes de desplegar: entrada HTTP pública de Railway

En Railway configura `CLIENT_IP_SOURCE=railway-public` y deja
`TRUSTED_PROXY_CIDRS` ausente o vacío. El modo exige `NODE_ENV=production` y las
variables de contexto `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE_ID` y
`RAILWAY_DEPLOYMENT_ID` que proporciona la plataforma; no las inventes.

Railway documenta `X-Real-IP` como IP del cliente. Un empleado confirma que su
edge HTTP sobrescribe los valores enviados por el cliente para los dominios
personalizados y generados, y que **no publica CIDRs de proxies ni un número
estable de saltos**. Exigir esos rangos causaba un bloqueo de arranque imposible
de configurar de forma mantenible. Fuentes primarias verificadas el 19/10/2026:
[especificaciones](https://docs.railway.com/networking/public-networking/specs-and-limits#technical-specifications)
y [aclaración del equipo de Railway](https://station.railway.com/questions/need-authoritative-client-ip-proxy-tru-090eac86).

En este modo la API usa solo un `X-Real-IP` válido y canonicalizado. Rechaza
valores ausentes, duplicados, listas o IP inválidas con 503 antes de consumir
cuota; no cae en la IP compartida del socket. Ignora `CF-Connecting-IP`,
`X-Forwarded-For` y `Forwarded`, sin volver a interpretar el resultado del edge.

**Condición de seguridad:** los reportes deben llegar únicamente por ingress
HTTP público, en un entorno dedicado sin servicios privados no confiables ni
TCP proxy. Las variables de contexto y `Host` no autentican una petición.
La red `*.railway.internal` no sanitiza estas cabeceras, y escuchar en
`0.0.0.0` tampoco la aísla (puede usar IPv4 e IPv6). No reutilices este modo para
llamadas privadas: si incorporas otros servicios, revisa el límite de confianza
o añade un gateway autenticado. Ver [aislamiento de red privada](https://docs.railway.com/networking/private-networking/how-it-works#network-isolation).

Antes de activar una nueva versión:

1. Comprueba en Architecture que el entorno sea dedicado y en Networking que no exista TCP proxy.
2. Valida en staging que las cabeceras falsificadas no cambien la identidad a través del edge, tanto en el dominio propio como en el generado. Las pruebas locales solo simulan ese contrato, no certifican a Railway.
3. Dos IP públicas distintas deben obtener cuotas distintas; alias IPv6/IPv4-mapped deben compartir cuota. Alumnos detrás de un mismo NAT universitario seguirán compartiéndola.
4. Comprueba `/health`, los logs de arranque y un envío legítimo tras desplegar. No expongas direcciones de visitantes en endpoints de diagnóstico.

Railway solo ha confirmado la derivación del usuario desde Cloudflare sobre
IPv4. Si Cloudflare llega por IPv6, no supongas que la IP representa al usuario:
puede representar al edge y compartir cuota. No lo compenses confiando en un
`CF-Connecting-IP` sin autenticar; monitoriza falsos positivos.

Fuera de Railway, `CLIENT_IP_SOURCE=socket` ignora las cabeceras. Para un reverse
proxy propio usa `CLIENT_IP_SOURCE=trusted-proxy` con `TRUSTED_PROXY_CIDRS`
confirmados y un contrato de sobrescritura. El modo previo sin selector conserva
esa configuración por compatibilidad; no detecta proxies privados automáticamente.

### Protección anti-bot con Turnstile

1. En Cloudflare abre **Turnstile → Add widget**.
2. Selecciona el modo **Managed** y autoriza `www.dsalab.dev`, `dsalab.dev` y `data-structurs.vercel.app`.
3. Copia la **site key** pública en Vercel como `VITE_TURNSTILE_SITE_KEY`.
4. Copia la **secret key** exclusivamente en Railway como `TURNSTILE_SECRET_KEY`.
5. Conserva en Railway `TURNSTILE_HOSTNAMES` con los tres hostnames anteriores.
6. Vuelve a desplegar el frontend y la API.

La protección es obligatoria para enviar reportes: configura ambas claves antes de desplegar. Si falta la site key, el formulario informa que no puede realizar la verificación; si falta la secret key, la API responde 503 sin enviar el correo. La API comprueba que el token pertenezca a un hostname oficial y a la acción `report`.

### Dominio de la API

1. Despliega el servicio y entra en **Settings → Networking → Public Networking**.
2. Genera primero un dominio temporal `*.up.railway.app` y comprueba `GET /health`.
3. Selecciona **Custom Domain** e ingresa `api.dsalab.dev`.
4. Railway entregará un `CNAME` y un `TXT` de verificación. Copia ambos exactamente en Cloudflare.
5. Espera hasta que Railway muestre el dominio y el certificado como activos.
6. En Vercel configura `VITE_REPORT_API_URL=https://api.dsalab.dev` para Production y vuelve a desplegar el frontend.

No reutilices los registros web de `dsalab.dev` o `www.dsalab.dev`: `api` es un subdominio independiente destinado únicamente al servicio de reportes.

## Dominio remitente en Resend

1. En Resend abre **Domains → Add Domain** e ingresa `dsalab.dev`.
2. Copia en Cloudflare los registros SPF y DKIM entregados por Resend. Si Resend entrega también un MX para el Return-Path, cópialo con el nombre y prioridad indicados.
3. Esos registros de correo deben permanecer en modo **DNS only**; nunca actives el proxy naranja para registros de correo.
4. Espera que SPF y DKIM aparezcan como verificados.
5. Conserva en Railway `REPORT_FROM=DSA Lab <reportes@dsalab.dev>`.

Resend permite enviar desde cualquier dirección del dominio verificado, por lo que `reportes@dsalab.dev` no necesita ser una casilla creada. Esto habilita el remitente, pero no crea un buzón para recibir respuestas. Los reportes seguirán llegando a la dirección privada definida en `REPORT_EMAIL`.

## Solicitud de ejemplo

```json
{
  "name": "Nombre del alumno",
  "email": "alumno@correo.com",
  "title": "Problema al insertar",
  "type": "Animación",
  "section": "Árbol AVL",
  "description": "La animación no muestra la rotación después de insertar el tercer valor.",
  "steps": "Ingresé 10, luego 20 y finalmente 30.",
  "pageUrl": "https://tu-proyecto.vercel.app/avl",
  "userAgent": "Se completa automáticamente desde el navegador",
  "turnstileToken": "Se completa automáticamente mediante Cloudflare Turnstile",
  "website": ""
}
```

`website` es un campo trampa: debe permanecer vacío y oculto para los usuarios.

## Protección incluida

- CORS limitado a los orígenes configurados.
- Validación de raíz JSON y tipos de campo, además de límites de caracteres.
- URL diagnóstica limitada a origen y ruta, sin credenciales, parámetros ni fragmento, también en el servidor.
- Cuerpo máximo de 16 KB.
- Escape del contenido HTML.
- Honeypot contra envíos automatizados.
- Cloudflare Turnstile con validación obligatoria en el servidor; sin secret key no se envían reportes.
- Límite de cinco solicitudes por IP cada quince minutos y un presupuesto global de 120 solicitudes por minuto por instancia.
- La identidad usa el modo de despliegue explícito: `railway-public` consume solo el `X-Real-IP` del edge HTTP en un entorno dedicado; `trusted-proxy` exige CIDRs propios confirmados y `socket` ignora las cabeceras. Siempre se ignora `X-Forwarded-For`.
- IP canonicalizada antes de usarla como clave: formatos IPv6 equivalentes e IPv4-mapped comparten contador.
- Tope de direcciones rastreadas que rechaza nuevas IP al saturarse, sin expulsar y desbloquear IP previamente limitadas.
- Respuestas sin detalles internos ni credenciales.
- Solicitudes sin `Origin` rechazadas en producción.
- Tiempo máximo de diez segundos para contactar a Resend.
- HSTS y CSP restrictiva también en las respuestas JSON de la API.

Los límites se guardan en memoria y protegen el trabajo de una instancia, pero no sustituyen una protección DDoS en el borde. Se reinician al desplegar y no se comparten entre réplicas; para un cupo común entre instancias se necesita Redis u otro almacén compartido. Durante un ataque distribuido, el presupuesto global puede rechazar reportes legítimos, por lo que conviene filtrar tráfico antes de Railway.

Se conserva el límite global temprano: también protege el parseo de solicitudes
inválidas y los recursos del proceso. No se ha movido detrás de Turnstile ni se ha
añadido una exclusión que el cliente pueda elegir. Un ataque distribuido todavía
puede agotar ese presupuesto; la corrección restante es de infraestructura:

- Revisar en el borde reglas para `POST /api/report`, sin desafiar indiscriminadamente a todos los alumnos de una misma red universitaria.
- Proteger todas las vías públicas hacia el servicio, incluido el dominio generado si permanece activo; una regla solo en el dominio Cloudflare no cubre automáticamente otras vías.
- Observar 429, saturación y errores de validación antes de cambiar umbrales.
- Mantener una sola réplica mientras se use memoria local. Si se necesitan cuotas entre réplicas o resistentes a reinicios, configurar primero un almacén compartido y su política de fallo.

Estas acciones no se aplican automáticamente y no se afirma inmunidad frente a DDoS.

## Datos pendientes

Antes del despliegue solamente deben reemplazarse:

1. El correo asociado a la cuenta de Resend (`REPORT_EMAIL`).
2. La API key creada en Resend (`RESEND_API_KEY`).
3. Cualquier origen adicional que necesite acceder a la API (`ALLOWED_ORIGINS`).
4. La site key pública y la secret key de Turnstile.
5. Los registros DNS exactos que entreguen Resend y Railway.
6. Tras desplegar, verificar que `https://api.dsalab.dev/health` responda correctamente.
7. Los CIDRs de ingress confirmados y el comportamiento de las cabeceras, antes de desplegar.
8. El runtime LTS del servicio y la protección de borde de todas sus entradas públicas.
