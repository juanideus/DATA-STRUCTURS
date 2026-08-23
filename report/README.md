# DSA Lab Report API

Servicio independiente para recibir el formulario **Informar problema** de DSA Lab y enviarlo mediante Resend. Está preparado para desplegarse como Web Service en Render.

## Endpoints

- `GET /health`: comprueba que el servicio está activo.
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

## Configuración en Render

Crea un **Web Service** conectado al mismo repositorio:

| Campo | Valor |
| --- | --- |
| Root Directory | `report` |
| Runtime | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Configura en **Environment**:

```env
RESEND_API_KEY=re_xxxxxxxxx
REPORT_EMAIL=correo-asociado-a-resend@ejemplo.com
ALLOWED_ORIGINS=https://www.dsalab.dev,http://localhost:5173
REPORT_FROM=DSA Lab <onboarding@resend.dev>
NODE_ENV=production
```

No agregues `RESEND_API_KEY` al frontend, a una variable `VITE_*`, al repositorio ni al archivo `.env.example`.

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
- Límite básico de cinco solicitudes por IP cada quince minutos.
- Respuestas sin detalles internos ni credenciales.
- Solicitudes sin `Origin` rechazadas en producción.
- Tiempo máximo de diez segundos para contactar a Resend.

El límite de solicitudes se guarda en memoria y es adecuado como primera barrera. Si en el futuro se utilizan varias instancias o se recibe más tráfico, conviene reemplazarlo por Redis o una solución persistente.

## Datos pendientes

Antes del despliegue solamente deben reemplazarse:

1. El correo asociado a la cuenta de Resend (`REPORT_EMAIL`).
2. La API key creada en Resend (`RESEND_API_KEY`).
3. La URL pública de DSA Lab (`ALLOWED_ORIGINS`).
4. Tras desplegar, la URL de Render que consumirá el frontend.
