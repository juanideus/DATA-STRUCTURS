# DSA Lab Report API

Servicio independiente para recibir el formulario **Informar problema** de DSA Lab y enviarlo mediante Resend. Se despliega como servicio Node.js en Railway y queda disponible en `https://api.dsalab.dev`.

## Endpoints

- `GET /` y `GET /health`: comprueban que el servicio está activo.
- `POST /api/report`: valida el formulario y envía el correo.

## Desarrollo local

Requiere Node.js 20 o superior.

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
```

No agregues `RESEND_API_KEY` ni `TURNSTILE_SECRET_KEY` al frontend, a una variable `VITE_*`, al repositorio ni al archivo `.env.example`. Los orígenes oficiales ya están autorizados en el servicio; `ALLOWED_ORIGINS` permite añadir otros sin reemplazarlos.

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
- Validación y límites de caracteres.
- Cuerpo máximo de 16 KB.
- Escape del contenido HTML.
- Honeypot contra envíos automatizados.
- Cloudflare Turnstile con validación obligatoria en el servidor; sin secret key no se envían reportes.
- Límite de cinco solicitudes por IP cada quince minutos y un presupuesto global de 120 solicitudes por minuto por instancia.
- IP real entregada por Railway mediante `X-Real-IP`. Si esa IP pertenece a los rangos publicados por Cloudflare, se usa `CF-Connecting-IP` para distinguir a los usuarios; en conexiones directas se ignora esa cabecera y siempre se ignora `X-Forwarded-For`.
- Tope de direcciones rastreadas que rechaza nuevas IP al saturarse, sin expulsar y desbloquear IP previamente limitadas.
- Respuestas sin detalles internos ni credenciales.
- Solicitudes sin `Origin` rechazadas en producción.
- Tiempo máximo de diez segundos para contactar a Resend.
- HSTS y CSP restrictiva también en las respuestas JSON de la API.

Los límites se guardan en memoria y protegen el trabajo de una instancia, pero no sustituyen una protección DDoS en el borde. Se reinician al desplegar y no se comparten entre réplicas; para un cupo común entre instancias se necesita Redis u otro almacén compartido. Durante un ataque distribuido, el presupuesto global puede rechazar reportes legítimos, por lo que conviene filtrar tráfico antes de Railway.

## Datos pendientes

Antes del despliegue solamente deben reemplazarse:

1. El correo asociado a la cuenta de Resend (`REPORT_EMAIL`).
2. La API key creada en Resend (`RESEND_API_KEY`).
3. Cualquier origen adicional que necesite acceder a la API (`ALLOWED_ORIGINS`).
4. La site key pública y la secret key de Turnstile.
5. Los registros DNS exactos que entreguen Resend y Railway.
6. Tras desplegar, verificar que `https://api.dsalab.dev/health` responda correctamente.
