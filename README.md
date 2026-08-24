<div align="center">
  <img src="./src/assets/favicon-dsa.svg" alt="Logo de DSA Lab" width="96" />

  # DSA Lab

  **Laboratorio bilingüe para visualizar, practicar y comprender estructuras de datos y algoritmos.**

  [Abrir DSA Lab](https://www.dsalab.dev/) · [Informar un problema](https://www.dsalab.dev/)

  [![Validación](https://github.com/juanideus/DATA-STRUCTURS/actions/workflows/ci.yml/badge.svg)](https://github.com/juanideus/DATA-STRUCTURS/actions/workflows/ci.yml)
  [![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
  [![Vercel](https://img.shields.io/badge/Despliegue-Vercel-000?logo=vercel)](https://www.dsalab.dev/)
  [![License: MIT](https://img.shields.io/badge/Licencia-MIT-365f87.svg)](./LICENSE)

  Creado por **Juan Zúñiga Maluenda**
</div>

---

## Contenido

- [Qué es DSA Lab](#qué-es-dsa-lab)
- [Estado actual](#estado-actual)
- [Características](#características)
- [Catálogo educativo](#catálogo-educativo)
- [Cómo aprende un estudiante](#cómo-aprende-un-estudiante)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Instalación local](#instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts y calidad](#scripts-y-calidad)
- [Despliegue](#despliegue)
- [API de reportes](#api-de-reportes)
- [Accesibilidad](#accesibilidad)
- [Internacionalización](#internacionalización)
- [SEO y dominio](#seo-y-dominio)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Contribuciones](#contribuciones)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Hoja de ruta](#hoja-de-ruta)
- [Licencia](#licencia)

## Qué es DSA Lab

DSA Lab es una aplicación web educativa para estudiantes que están comenzando con estructuras de datos y algoritmos. En lugar de mostrar únicamente el resultado, representa la ejecución paso a paso y relaciona cada cambio con el código Java que lo produce.

El estudiante puede ingresar sus propios datos, ejecutar operaciones, pausar, avanzar o retroceder la animación, revisar variables en tiempo real y comparar el comportamiento visual con Java o pseudocódigo.

El objetivo no es reemplazar las clases ni convertirse en un IDE. Es un punto de apoyo para:

- Entender qué ocurre internamente en una estructura.
- Relacionar teoría, código, variables y resultado.
- Experimentar sin miedo a equivocarse.
- Practicar antes de implementar un algoritmo desde cero.
- Detectar visualmente decisiones, ciclos, recursión y backtracking.

> **Visualiza, comprende y crea. El límite es tu imaginación. Tú puedes.**

## Estado actual

| Indicador | Estado |
|---|---:|
| Temas educativos | 86 |
| Laboratorios interactivos | 66 |
| Secciones de fundamentos | 20 |
| Operaciones disponibles | 310 |
| Fragmentos Java compilados en auditoría | 310 |
| Pruebas conceptuales | 10 preguntas por tema |
| Idiomas | Español e inglés |
| Páginas SEO generadas | 174 |
| Despliegue web | Vercel |
| API de reportes | Render + Resend |
| Dominio canónico | [www.dsalab.dev](https://www.dsalab.dev/) |

La aplicación funciona sin cuentas de usuario ni base de datos para las actividades educativas. Las preferencias, avances de desafíos y resultados locales se guardan en el navegador.

## Características

### Visualización y operaciones

- Representaciones específicas para arrays, listas, árboles, grafos, hashing, matrices, recursión, backtracking y ordenamientos.
- Inserción, eliminación, búsqueda, actualización y recorridos según las reglas de cada estructura.
- Botón **Nuevo ejemplo** para generar otros datos.
- Botón **Vaciar** para comenzar desde cero.
- Botón **Restablecer** para recuperar el ejemplo original.
- Límite suficiente para observar divisiones, promociones, rotaciones y rebalanceos.
- Reproductor con paso anterior, reproducción, pausa, paso siguiente y velocidades `0.5×`, `1×` y `2×`.

### Código sincronizado

- Código Java directo y deliberadamente pedagógico.
- Pseudocódigo como vista alternativa.
- Línea activa sincronizada con el cambio visual.
- Ciclos que muestran sus iteraciones y regresan a evaluar la condición.
- Condiciones con resultado visible `true` o `false`.
- Métodos auxiliares incluidos cuando el algoritmo los utiliza.
- Variables en tiempo real asociadas al fotograma actual.
- Botón para copiar el código.

### Evaluaciones por tema

- Prueba conceptual diferente para cada estructura o algoritmo.
- Diez preguntas de materia por intento.
- Diagramas y ejercicios de lectura de código cuando corresponde.
- Puntaje, porcentaje y estado de aprobación.
- Revisión final con la respuesta elegida, la correcta y una explicación.
- Regla contra copia: abandonar la pestaña, ventana o sección cancela el intento y bloquea esa prueba durante 45 minutos.
- El bloqueo y el historial se conservan localmente en el navegador.

### Modo desafío

- Predicciones construidas desde el estado real del visualizador.
- Pistas opcionales.
- Explicación después de responder.
- Comprobación mediante la misma operación que ejecuta el laboratorio.
- Progreso local de intentos, aciertos y pistas utilizadas.

### Experiencia de uso

- Bienvenida e introducción animada.
- Tour guiado mediante el botón **¿Cómo funciona?**.
- Menú lateral plegable y categorías replegables.
- Buscador por nombre, categoría o traducción.
- Navegación anterior y siguiente entre temas.
- Formulario para reportar problemas directamente al equipo.
- Diseño adaptable para escritorio, tablet y móvil.
- Métricas de rendimiento con Vercel Analytics y Speed Insights.

### Visualizaciones destacadas

- AVL con alturas, factor de balance y rotaciones.
- Heap con extracción completa, reemplazo de raíz y heapificación.
- B-Tree, B+ Tree y B* Tree con nodos multiclave y promociones.
- Árbol binario enhebrado con hijos e hilos diferenciados.
- Prefix Tree con marcas de final de palabra.
- Fibonacci y Factorial mediante árboles de llamadas.
- Dijkstra y A* sobre mapas con origen y destino variables.
- Quick Sort, Merge Sort y otros ocho ordenamientos con trazas propias.
- Sudoku `9×9`, N-Reinas y Laberinto con backtracking visible.
- Matriz poco poblada mediante cabeceras `AROW` y `ACOL` circulares e invertidas.
- Polinomios y listas generalizadas basados en nodos enlazados.
- AST con precedencia, tipos de nodo y recorrido recursivo.

## Catálogo educativo

La navegación está organizada en nueve categorías.

| Categoría | Cantidad | Contenidos |
|---|---:|---|
| Estructuras lineales | 9 | Array, Stack, Queue, Deque, listas simple/doble/circulares y Skip List |
| Árboles | 23 | Árboles generales, binarios, balanceados, multicamino, espaciales, de texto y sintaxis |
| Hashing | 3 | Hash Table, Open Addressing y Separate Chaining |
| Grafos | 8 | Grafos, BFS, DFS, Dijkstra, A*, Prim y Kruskal |
| Recursión | 3 | Fibonacci, Factorial y Torres de Hanoi |
| Ordenamientos | 10 | Bubble, Selection, Insertion, Merge, Quick, Shell, Heap, Counting, Radix y Bogo Sort |
| Backtracking | 3 | N-Reinas, Laberinto y Sudoku `9×9` |
| Otros | 7 | Matrices, polinomios, listas generalizadas, Union-Find, LRU y Bloom Filter |
| Fundamentos | 20 | Bases de programación, algoritmos, memoria, complejidad, POO y paradigmas |

<details>
<summary><strong>Ver los 23 árboles</strong></summary>

1. Árbol general
2. Árbol N-ario
3. Árbol binario
4. Árbol binario enhebrado
5. Binary Search Tree
6. Árbol AVL
7. Árbol Rojo-Negro
8. Splay Tree
9. Heap binario
10. Fibonacci Heap
11. Prefix Tree
12. Suffix Tree
13. Segment Tree
14. Fenwick Tree
15. B-Tree
16. B+ Tree
17. B* Tree
18. Merkle Tree
19. KD-Tree
20. QuadTree
21. Octree
22. Árbol de expresión
23. AST (Abstract Syntax Tree)

</details>

<details>
<summary><strong>Ver los 20 fundamentos</strong></summary>

1. Estructuras de datos
2. Complejidad algorítmica
3. Programación Orientada a Objetos
4. Variables, tipos y operadores
5. Condiciones y ciclos
6. Métodos y parámetros
7. Punteros y referencias
8. Manejo de memoria
9. Recursividad
10. Tipos de Datos Abstractos
11. Genéricos
12. Errores y excepciones
13. Comparación y ordenamiento de objetos
14. Diseño y representación de algoritmos
15. Correctitud de algoritmos
16. Pruebas y depuración
17. Backtracking
18. Búsqueda binaria
19. Divide y vencerás
20. Programación dinámica

</details>

## Cómo aprende un estudiante

1. Abre un tema desde el menú lateral o el buscador.
2. Lee su definición, complejidad y guía educativa.
3. Modifica los datos del ejemplo o vacía la estructura.
4. Selecciona una operación.
5. Observa el cambio visual y la línea Java resaltada.
6. Revisa las variables del fotograma actual.
7. Pausa, retrocede o cambia la velocidad si necesita más tiempo.
8. Activa el modo desafío para predecir un resultado.
9. Realiza la prueba conceptual de diez preguntas.
10. Revisa sus respuestas y vuelve al contenido que necesita reforzar.

## Arquitectura

```text
DATA-STRUCTURS/
├── .github/
│   ├── dependabot.yml                 # Actualizaciones semanales agrupadas
│   └── workflows/ci.yml               # Validación automática de PR y main
├── public/
│   ├── dsa-lab-social-v2.jpg          # Vista previa para redes sociales
│   └── robots.txt                     # Directivas para buscadores
├── report/                            # API independiente de reportes
│   ├── src/
│   │   ├── email.js                   # Envío mediante Resend
│   │   ├── server.js                  # Servidor HTTP y endpoints
│   │   └── validation.js              # Validación y límites de entrada
│   └── test/                          # Pruebas de la API
├── scripts/
│   ├── audit-functions.mjs            # Contratos y sincronización del catálogo
│   ├── audit-challenges.mjs           # Desafíos contra operaciones reales
│   ├── audit-section-tests.mjs        # Preguntas y combinaciones por tema
│   ├── compile-java-audit.mjs         # Compilación real con javac
│   ├── stress-audit.mjs               # Entradas extremas y secuencias largas
│   ├── generate-seo.mjs               # HTML, sitemap y rutas bilingües
│   └── run-e2e.mjs                    # Build, preview y Playwright
├── src/
│   ├── accessibility/                 # Preferencias y gestión de foco
│   ├── components/                    # Paneles, tour, pruebas y navegación
│   ├── data/                          # Catálogo, traducciones y código Java
│   ├── logic/                         # Operaciones y trazas algorítmicas
│   ├── App.jsx                        # Coordinación principal del laboratorio
│   ├── i18n.jsx                       # Idioma y traducciones de interfaz
│   ├── seo.js                         # Metadatos dinámicos
│   └── styles.css                     # Sistema visual y responsive
├── tests/e2e/app.spec.js              # Recorridos reales de navegador
├── .env.example                       # URL pública de la API de reportes
├── index.html                         # Documento base y metadatos sociales
├── package.json                       # Scripts y dependencias
├── playwright.config.js               # Escritorio Chromium y Pixel 7
├── vercel.json                        # Build, rutas limpias y seguridad
└── vite.config.js                     # Configuración de Vite
```

### Flujo de una operación

```text
Interfaz
   ↓
OperationsPanel
   ↓
executeOperation
   ↓
resultado + fotogramas
   ↓
sincronización con beginnerJava
   ↓
visualizador + línea activa + variables
```

Las implementaciones especializadas —árboles, listas, grafos, ordenamientos, matrices, recursión y backtracking— generan trazas propias cuando una animación genérica no representa correctamente su lógica.

## Tecnologías

| Tecnología | Responsabilidad |
|---|---|
| React 19 | Componentes, estado y experiencia interactiva |
| React DOM | Renderizado en el navegador |
| Vite 8 | Desarrollo, optimización y build |
| JavaScript ES Modules | Catálogo, operaciones y animaciones |
| CSS | Diseño, responsive y preferencias visuales |
| Lucide React | Iconografía |
| Playwright | Pruebas reales de navegador |
| Node.js | Auditorías, SEO y API de reportes |
| Vercel | Frontend, Analytics y Speed Insights |
| Render | Web Service de reportes |
| Resend | Entrega de reportes por correo |

## Instalación local

### Requisitos

- Node.js `^20.19.0` o `>=22.12.0`.
- npm 10 o superior.
- Git.
- Java/JDK si se ejecutará `npm run audit:java`.

### Frontend

```bash
git clone https://github.com/juanideus/DATA-STRUCTURS.git
cd DATA-STRUCTURS
npm ci
npm run dev
```

Vite mostrará una URL local, normalmente `http://localhost:5173/`.

### Build de producción

```bash
npm run build
npm run preview
```

El resultado se genera en `dist/` y no debe subirse al repositorio.

## Variables de entorno

### Frontend

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_REPORT_API_URL` | Para enviar reportes | URL HTTPS del Web Service desplegado en Render, sin `/` final |

Ejemplo:

```env
VITE_REPORT_API_URL=https://tu-api.onrender.com
```

Las variables que comienzan con `VITE_` son públicas y quedan incluidas en el frontend. Nunca guardes claves privadas en ellas.

### API de reportes

| Variable | Obligatoria | Descripción |
|---|---|---|
| `RESEND_API_KEY` | Sí | Clave privada creada en Resend |
| `REPORT_EMAIL` | Sí | Correo receptor asociado a Resend |
| `REPORT_FROM` | Sí | Remitente autorizado |
| `ALLOWED_ORIGINS` | Sí | Orígenes del frontend separados por coma |
| `NODE_ENV` | Producción | Debe ser `production` en Render |
| `PORT` | Automática | Render la proporciona; localmente puede usarse `10000` |

Los archivos `.env` están ignorados. Solo se versionan ejemplos sin credenciales.

## Scripts y calidad

| Comando | Qué comprueba |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de Vite y generación de 174 páginas SEO |
| `npm run preview` | Vista local del build |
| `npm run audit` | 86 temas, 310 acciones, código, fotogramas y contratos |
| `npm run audit:challenges` | Desafíos generados desde operaciones reales |
| `npm run audit:section-tests` | 860 preguntas y diez preguntas por tema |
| `npm run audit:java` | Compilación de 310 fragmentos con `javac` |
| `npm run audit:stress` | Entradas extremas y operaciones encadenadas |
| `npm run audit:seo` | Canonical, hreflang, JSON-LD, sitemap y robots |
| `npm run test:e2e` | Flujos de escritorio y móvil con Playwright |
| `npm run check` | Ejecuta la validación integral anterior |

Estado de la auditoría integral:

- **3.100** pruebas funcionales.
- **810** desafíos generados y verificados.
- **860** preguntas revisadas.
- **310** fragmentos Java compilados.
- **15.520** pruebas de estrés.
- **174** URLs bilingües verificadas.
- **82** recorridos E2E aprobados; las omisiones restantes son deliberadas según dispositivo.

Antes de abrir una PR:

```bash
npm run check
```

GitHub Actions también ejecuta auditoría, revisión de vulnerabilidades, build y pruebas de navegador. `main` debe modificarse mediante Pull Request.

## Despliegue

### Frontend en Vercel

| Ajuste | Valor |
|---|---|
| Root Directory | raíz del repositorio |
| Framework | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js | 22.12.0 o compatible |

Agrega `VITE_REPORT_API_URL` en **Settings → Environment Variables** y vuelve a desplegar si cambia.

`vercel.json` configura rutas limpias, cabeceras de seguridad, CSP y acceso HTTPS a Render.

### API en Render

Crea un **Web Service** separado desde el mismo repositorio:

| Ajuste | Valor |
|---|---|
| Root Directory | `report` |
| Runtime | Node |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

Configura las variables privadas únicamente en Render. No las copies al código, GitHub ni Vercel.

### Dominio

El dominio `dsalab.dev` administra su DNS en Cloudflare y apunta al proyecto de Vercel. La aplicación usa `https://www.dsalab.dev` como origen canónico.

## API de reportes

El formulario **Informar problema** envía los datos a la API de `report/`.

Endpoints:

- `GET /health`: estado del servicio.
- `POST /api/report`: validación y envío mediante Resend.

Protecciones incluidas:

- CORS limitado mediante `ALLOWED_ORIGINS`.
- Honeypot contra bots.
- Cuerpo máximo de 16 KB.
- Límites de longitud por campo.
- Escape del contenido HTML.
- Cinco solicitudes por IP cada quince minutos.
- Tiempo máximo para contactar a Resend.
- Respuestas sin credenciales ni detalles internos.

Render puede tardar en despertar cuando el servicio está suspendido. El frontend mantiene el envío activo y comunica al usuario que debe conservar la ventana abierta.

Consulta [report/README.md](./report/README.md) para la configuración completa.

## Accesibilidad

El botón **Opciones de accesibilidad** permite guardar en el navegador:

- Tamaño de interfaz normal, grande o muy grande.
- Contraste alto.
- Paleta apta para daltonismo.
- Reducción de movimiento.

Además, DSA Lab incluye:

- Enlace de teclado para saltar al contenido principal.
- Indicadores de foco visibles.
- Foco atrapado y restaurado en modales.
- Cierre con `Escape` cuando no contradice la regla de evaluación.
- Menú móvil navegable por teclado.
- Etiquetas accesibles en controles.
- Estados acompañados por texto, iconos y forma, no solamente color.
- Diseño sin desbordamiento horizontal en móvil.
- Respeto por `prefers-reduced-motion`.

Las visualizaciones complementan el material escrito y el código; no son la única fuente de información.

## Internacionalización

La interfaz, navegación, fundamentos, guías, pruebas, desafíos, tour, reportes y metadatos están disponibles en español e inglés.

- Español: `/avl`
- Inglés: `/en/avl`

Si el usuario no ha elegido un idioma, la aplicación utiliza la preferencia del navegador. La selección se guarda localmente.

## SEO y dominio

El build genera HTML rastreable para la bienvenida y los 86 temas en ambos idiomas:

- 174 URLs públicas.
- Título y descripción por página.
- URL canónica bajo `https://www.dsalab.dev`.
- Alternativas `hreflang="es"`, `hreflang="en"` y `hreflang="x-default"`.
- Metadatos Open Graph y Twitter con imagen social absoluta.
- Datos estructurados `WebSite`, `SoftwareApplication`, `LearningResource` y `BreadcrumbList`.
- `sitemap.xml` generado durante el build.
- `robots.txt` con referencia al sitemap.
- Enlaces HTML rastreables en la navegación.

Validación local:

```bash
npm run build
npm run audit:seo
```

En Google Search Console debe estar verificada la propiedad de dominio `dsalab.dev` y enviado `https://www.dsalab.dev/sitemap.xml`.

## Seguridad y privacidad

- No hay cuentas de estudiantes ni seguimiento personal en una base de datos.
- Preferencias, desafíos y pruebas se almacenan en `localStorage`.
- Los datos de un reporte solo se envían cuando el usuario pulsa **Enviar reporte**.
- `RESEND_API_KEY` permanece exclusivamente en Render.
- La CSP bloquea scripts, marcos, objetos y conexiones no autorizadas.
- Cámara, micrófono y geolocalización están deshabilitados mediante cabeceras.
- `.env`, builds, resultados de Playwright, logs y dependencias están excluidos por `.gitignore`.

## Contribuciones

1. Crea una rama con un nombre descriptivo:

   ```bash
   git switch -c feature/nombre-del-cambio
   ```

2. Instala exactamente las dependencias registradas:

   ```bash
   npm ci
   ```

3. Implementa el cambio manteniendo el enfoque pedagógico.
4. Añade o actualiza pruebas.
5. Ejecuta:

   ```bash
   npm run check
   ```

6. Abre una Pull Request hacia `main`.

Una nueva estructura o algoritmo debe incluir, como mínimo:

- Identidad, descripción, categoría y complejidad.
- Visualización propia y adaptable.
- Operaciones coherentes con la estructura.
- Java completo y legible.
- Métodos auxiliares utilizados.
- Sincronización de línea, variables y cambio visual.
- Guía educativa en español e inglés.
- Diez preguntas específicas de materia.
- Casos válidos, inválidos y extremos en auditoría.

## Limitaciones conocidas

- El código está diseñado para enseñar y no reemplaza una implementación de producción o una biblioteca estándar.
- No existe autenticación ni sincronización de progreso entre dispositivos.
- El sistema contra copia funciona en el navegador; no pretende reemplazar una plataforma formal de supervisión.
- La API de Render puede presentar arranque en frío si el servicio entra en suspensión.
- El rate limit de reportes se conserva en memoria y debe migrarse a almacenamiento compartido si se utilizan varias instancias.

## Hoja de ruta

- Panel de progreso por tema y recomendaciones de repaso.
- Pruebas visuales automatizadas para detectar desplazamientos o cruces.
- Exportación de ejemplos y secuencias de ejecución.
- Más ejercicios graduados por dificultad.
- Soporte educativo opcional para C++ y Python.
- Mejoras continuas para lectores de pantalla.
- Persistencia distribuida del límite de reportes si aumenta el tráfico.

## Autor

**Juan Zúñiga Maluenda**

DSA Lab es una iniciativa educativa orientada a facilitar el aprendizaje inicial de estructuras de datos y algoritmos.

## Licencia

Este proyecto se distribuye bajo la [Licencia MIT](./LICENSE). Puedes usar, copiar, modificar y distribuir el software conservando el aviso de copyright y el texto de la licencia.

---

<div align="center">
  <strong>DSA Lab · Visualiza, comprende y crea.</strong><br />
  El límite es tu imaginación. Tú puedes.
</div>
