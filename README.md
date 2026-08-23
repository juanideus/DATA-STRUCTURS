<div align="center">
  <img src="./src/assets/favicon-dsa.svg" alt="Logo de DSA Lab" width="92" />

  # DSA Lab

  **Laboratorio interactivo para aprender estructuras de datos y algoritmos mediante visualizaciones, animaciones y código Java para principiantes.**

  [![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=111)](https://developer.mozilla.org/docs/Web/JavaScript)
  [![License: MIT](https://img.shields.io/badge/License-MIT-2f6f5e.svg)](./LICENSE)

  Desarrollado por **Juan Zúñiga Maluenda**
</div>

---

## Tabla de contenidos

- [Acerca del proyecto](#acerca-del-proyecto)
- [Objetivos educativos](#objetivos-educativos)
- [Características principales](#características-principales)
- [Catálogo de contenidos](#catálogo-de-contenidos)
- [Cómo funciona la experiencia](#cómo-funciona-la-experiencia)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Auditoría y calidad](#auditoría-y-calidad)
- [Despliegue](#despliegue)
- [Reporte de errores](#reporte-de-errores)
- [Accesibilidad y diseño adaptable](#accesibilidad-y-diseño-adaptable)
- [SEO y rastreo](#seo-y-rastreo)
- [Contribuciones](#contribuciones)
- [Hoja de ruta](#hoja-de-ruta)
- [Autor](#autor)
- [Licencia](#licencia)

## Acerca del proyecto

**DSA Lab** es una aplicación web educativa que convierte estructuras de datos y algoritmos en experiencias visuales e interactivas. Su propósito es ayudar a estudiantes que están comenzando a comprender qué ocurre dentro de un algoritmo, en lugar de limitarse a observar su resultado final.

La plataforma permite modificar ejemplos, ejecutar operaciones, reproducir animaciones paso a paso y comparar cada cambio visual con código Java sencillo. De esta forma, el estudiante puede usar la aplicación como punto de apoyo para comprender conceptos, experimentar sin miedo y desarrollar sus propias soluciones.

La idea central del proyecto es:

> **Visualiza, comprende y crea. El límite es tu imaginación.**

## Objetivos educativos

DSA Lab fue creado para:

- Facilitar el aprendizaje inicial de estructuras de datos y algoritmos.
- Mostrar visualmente cómo cambia una estructura después de cada operación.
- Relacionar la animación con las líneas de código que se están ejecutando.
- Presentar Java de forma directa, evitando abstracciones innecesarias para principiantes.
- Permitir que el estudiante agregue, elimine, busque y modifique datos.
- Ayudar a comprender recursividad y backtracking mediante decisiones y retrocesos visibles.
- Servir como referencia antes de implementar un algoritmo desde cero.
- Promover la experimentación y el aprendizaje autónomo.

## Características principales

### Laboratorio visual interactivo

- Visualizaciones específicas para arrays, listas, árboles, heaps, grafos, hashing y otros temas.
- Controles para insertar, eliminar, buscar, actualizar, recorrer y restablecer datos.
- Botones **Nuevo ejemplo** y **Restablecer** en cada tema.
- Reproductor con pasos anterior/siguiente, pausa y reproducción automática.
- Velocidades de reproducción `0.5×`, `1×` y `2×`.
- Mensajes que explican qué está ocurriendo durante la operación.
- Sección teórica de complejidad algorítmica con notación O, Ω y Θ, casos, reglas de conteo, tabla comparativa y gráfico de crecimiento, sin código ni controles interactivos.
- Polinomios enlazados con términos ordenados por exponente, agrupación de exponentes repetidos y suma visual mediante punteros.
- Listas generalizadas con átomos, sublistas, niveles, referencias compartidas y enlaces `link`/`dlink`.
- Matriz poco poblada con cabeceras AROW y ACOL, nodos compartidos y recorridos circulares invertidos.

### Código sincronizado

- Panel de código Java para principiantes.
- Pseudocódigo disponible como formato alternativo.
- Resaltado de la línea que corresponde al paso actual de la animación.
- Ejemplos deliberadamente sencillos, con variables, ciclos, condiciones, arreglos y métodos pequeños.
- Botón para copiar el código mostrado.

### Modo desafío guiado

- Preguntas de predicción construidas a partir del estado real de la estructura.
- Disponible en los 66 laboratorios prácticos; cada desafío utiliza una operación real del tema y el estado actual del visualizador.
- Tres respuestas posibles, pista opcional y explicación posterior al intento.
- Botón para comprobar la predicción ejecutando la operación en el visualizador.
- Progreso local con intentos, aciertos, porcentaje y uso de pistas, sin cuentas ni base de datos.
- Preguntas especializadas para Array, Pila, Cola, Binary Search Tree y AVL, junto con predicciones de estado generadas para el resto de estructuras y algoritmos.

### Contenido educativo

Cada tema incluye una guía con:

- Definición de la estructura o algoritmo.
- Explicación de su funcionamiento interno.
- Ejemplo conceptual.
- Operaciones principales.
- Ventajas.
- Limitaciones y cuidados.
- Casos de uso reales.
- Complejidad temporal o espacial principal.
- Ejemplo básico en Java.
- Una idea importante para recordar.

### Visualizaciones especiales

- Árbol AVL con factor de balance.
- Listas circulares con flechas de retorno.
- Lista doble y lista circular doble con enlaces en ambos sentidos.
- Prefix Tree con forma de árbol y nodos finales de palabra identificados.
- B-Tree, B+ Tree y B* Tree con nodos multiclave.
- B+ Tree con hojas enlazadas, división balanceada y promoción visible de separadores.
- Sudoku `9×9` resuelto con recursividad y backtracking.
- N-Reinas con visualización del método `isSafe`.
- Laberinto con avance, choque, retroceso y caminos descartados.
- Torres de Hanoi con movimientos animados.
- Grafos con recorridos y aristas visibles.

### Experiencia de usuario

- Introducción animada al abrir la página.
- Página de bienvenida con explicación del propósito del laboratorio.
- Buscador de algoritmos en el menú lateral.
- Navegación por categorías y entre temas anterior/siguiente.
- Diseño adaptable para escritorio, tablet y móvil.
- Favicon y marca visual de DSA Lab.
- Crédito de autor visible en el menú lateral.
- Formulario para enviar reportes directamente al equipo del proyecto.

## Catálogo de contenidos

La versión actual contiene **86 temas**, agrupados en nueve categorías.

### 0. Fundamentos — 20 temas

- ¿Qué son las estructuras de datos?
- Complejidad algorítmica
- Programación Orientada a Objetos (POO)
- Variables, tipos y operadores
- Condiciones y ciclos
- Métodos y parámetros
- Punteros y referencias
- Manejo de memoria en Java
- Fundamentos de recursividad
- Tipos de Datos Abstractos (TDA)
- Genéricos en Java
- Errores y excepciones
- Comparación y ordenamiento de objetos
- Diseño y representación de algoritmos
- Correctitud de algoritmos
- Pruebas y depuración
- Fundamentos de Backtracking
- Fundamentos de Búsqueda Binaria
- Fundamentos de Divide y Vencerás
- Fundamentos de Programación Dinámica

### 1. Estructuras lineales — 9 temas

1. Array
2. Pila (Stack)
3. Cola (Queue)
4. Deque
5. Lista simple
6. Lista doble
7. Lista circular simple
8. Lista circular doble
9. Skip List

### 2. Árboles — 23 temas

10. Árbol general
11. Árbol N-ario
12. Árbol binario
13. Árbol binario enhebrado
14. Binary Search Tree
15. Árbol AVL
16. Árbol Rojo-Negro
17. Splay Tree
18. Heap binario
19. Fibonacci Heap
20. Prefix Tree
21. Suffix Tree
22. Segment Tree
23. Fenwick Tree
24. B-Tree
25. B+ Tree
26. B* Tree
27. Merkle Tree
28. KD-Tree
29. QuadTree
30. Octree
31. Árbol de expresión
32. AST (Abstract Syntax Tree)

### 3. Hashing — 3 temas

33. Hash Table
34. Open Addressing
35. Separate Chaining

### 4. Grafos — 8 temas

36. Grafo
37. Grafo dirigido
38. DFS
39. BFS
40. Dijkstra
41. A* (A-Star)
42. Prim
43. Kruskal

### 5. Recursión — 3 temas

44. Fibonacci
45. Factorial
46. Torres de Hanoi
### 6. Ordenamientos — 10 temas

47. Bubble Sort
48. Selection Sort
49. Insertion Sort
50. Merge Sort
51. Quick Sort
52. Shell Sort
53. Heap Sort
54. Counting Sort
55. Radix Sort
56. Bogo Sort

### 7. Backtracking — 3 temas

57. N-Reinas
58. Laberinto
59. Sudoku Solver 9×9

### 8. Otros — 7 temas

60. Matriz
61. Polinomios con listas
62. Listas generalizadas
63. Matriz poco poblada
64. Union-Find
65. LRU Cache
66. Bloom Filter

## Cómo funciona la experiencia

1. **Elige un tema.** Usa el menú lateral o el buscador para abrir una estructura o algoritmo.
2. **Revisa el ejemplo inicial.** La visualización muestra el estado actual de los datos.
3. **Selecciona una función.** Dependiendo del tema, podrás insertar, eliminar, buscar, actualizar, recorrer o resolver.
4. **Completa los campos.** Ingresa un valor, índice, clave, vértice u otro dato solicitado.
5. **Ejecuta la operación.** La aplicación genera una secuencia de estados visuales.
6. **Observa el código.** La línea correspondiente se resalta mientras avanza la animación.
7. **Controla la reproducción.** Pausa, avanza, retrocede o cambia la velocidad.
8. **Experimenta.** Genera un nuevo ejemplo o restablece el estado original.
9. **Lee la guía.** Debajo del laboratorio encontrarás la descripción completa y un ejemplo Java.

## Tecnologías

| Tecnología | Uso en el proyecto |
|---|---|
| React 19 | Componentes, estado y experiencia interactiva |
| React DOM | Renderizado de la aplicación en el navegador |
| Vite 8 | Servidor de desarrollo y compilación de producción |
| JavaScript con ES Modules | Lógica, datos y operaciones |
| CSS | Diseño, animaciones y adaptación responsive |
| Lucide React | Iconografía de la interfaz |
| Node.js | Ejecución de scripts, instalación y auditoría |

El proyecto no necesita base de datos ni servidor de aplicación. Después de compilarse, se publica como un sitio estático.

## Requisitos

- **Node.js:** `^20.19.0` o `>=22.12.0`, según el motor requerido por la versión instalada de Vite.
- **npm:** incluido normalmente con Node.js.
- Un navegador moderno con soporte para ES Modules.
- Git, únicamente si deseas clonar y contribuir al repositorio.

Puedes revisar tus versiones con:

```bash
node --version
npm --version
git --version
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/juanideus/DATA-STRUCTURS.git
cd DATA-STRUCTURS
```

### 2. Instalar dependencias

Para reproducir exactamente las versiones registradas en `package-lock.json`:

```bash
npm ci
```

Durante desarrollo también puedes utilizar:

```bash
npm install
```

### 3. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Vite mostrará la dirección local en la terminal, normalmente:

```text
http://localhost:5173/
```

### 4. Crear una compilación de producción

```bash
npm run build
```

Los archivos optimizados se generan en `dist/`.

### 5. Probar la compilación localmente

```bash
npm run preview
```

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Inicia Vite en modo desarrollo con actualización automática |
| `npm run build` | Genera la versión optimizada dentro de `dist/` |
| `npm run preview` | Sirve localmente la compilación de producción |
| `npm run audit` | Ejecuta la auditoría funcional y educativa del catálogo |
| `npm run audit:challenges` | Genera desafíos y compara sus predicciones con las operaciones reales |
| `npm run audit:java` | Compila con `javac` los 310 códigos Java visibles |
| `npm run audit:stress` | Prueba entradas extremas y secuencias largas de operaciones |
| `npm run test:e2e` | Ejecuta pruebas reales de navegador en escritorio y móvil |
| `npm run check` | Ejecuta las auditorías funcional, de desafíos, Java y de estrés, además de las pruebas E2E |

Flujo recomendado antes de subir cambios:

```bash
npm run check
```

## Estructura del proyecto

```text
DSA/
├── index.html                         # Documento HTML utilizado por Vite
├── package.json                       # Dependencias y scripts
├── package-lock.json                  # Versiones reproducibles
├── playwright.config.js               # Pruebas E2E en escritorio y móvil
├── vite.config.js                     # Configuración de React y compilación
├── vercel.json                        # Despliegue y cabeceras en Vercel
├── netlify.toml                       # Despliegue y cabeceras en Netlify
├── tests/e2e/                         # Flujos críticos en navegador
├── .github/
│   ├── workflows/ci.yml               # Validación automática
│   └── dependabot.yml                 # Actualizaciones controladas
├── scripts/
│   ├── audit-functions.mjs            # Auditoría automática del laboratorio
│   ├── compile-java-audit.mjs          # Compilación real de cada código Java mostrado
│   ├── stress-audit.mjs                # Entradas límite y operaciones encadenadas
│   └── run-e2e.mjs                    # Build, servidor temporal y pruebas de navegador
├── src/
│   ├── App.jsx                        # Aplicación, navegación y visualizadores
│   ├── main.jsx                       # Punto de entrada de React
│   ├── styles.css                     # Estilos, animaciones y responsive design
│   ├── assets/
│   │   └── favicon-dsa.svg            # Favicon de DSA Lab
│   ├── components/
│   │   ├── AppErrorBoundary.jsx       # Recuperación ante errores inesperados
│   │   ├── EducationalDescription.jsx # Guía educativa de cada tema
│   │   ├── OperationsPanel.jsx        # Campos y botones de operaciones
│   │   └── VariablesPanel.jsx         # Variables de la ejecución en tiempo real
│   ├── data/
│   │   ├── algorithms.js              # Catálogo de 86 temas
│   │   ├── astJava.js                 # Parser AST y operaciones completas en Java
│   │   ├── denseMatrixJava.js         # Operaciones de matriz densa en Java
│   │   ├── beginnerJava.js            # Código Java por operación
│   │   ├── educationalDescriptions.js # Contenido educativo detallado
│   │   ├── generalizedListJava.js      # Lista generalizada completa en Java
│   │   ├── graphDesigns.js             # Topologías visuales de los grafos
│   │   ├── linkedListJava.js           # Listas enlazadas completas en Java
│   │   ├── polynomialJava.js           # Polinomios enlazados completos en Java
│   │   ├── guideJavaExamples.js        # Ejemplos Java de las guías
│   │   ├── treeJava.js                 # Operaciones completas de árboles en Java
│   │   ├── sparseMatrixJava.js         # Matriz circular AROW/ACOL completa en Java
│   │   └── sortingJava.js              # Implementaciones completas de ordenamientos en Java
│   ├── logic/
│   │   ├── codeAnimation.js            # Sincronización entre código y animaciones
│   │   ├── ast.js                      # Parser y disposición visual del AST
│   │   ├── complexity.js               # Órdenes y valores para los gráficos teóricos
│   │   ├── denseMatrix.js              # Dimensión, índices y transposición de matriz
│   │   ├── generalizedList.js           # Parser y modelo de listas generalizadas
│   │   ├── operations.js               # Implementación de las acciones interactivas
│   │   ├── polynomial.js                # Modelo y operaciones de polinomios
│   │   ├── pathfindingMap.js           # Mapas para Dijkstra y A*
│   │   └── sortingAlgorithms.js        # Trazas reales de los diez ordenamientos
├── .gitignore                         # Archivos excluidos del repositorio
├── LICENSE                            # Licencia MIT
└── README.md                          # Documentación del proyecto
```

### Responsabilidades principales

- `src/data/algorithms.js` define la identidad, categoría, complejidad, descripción, pseudocódigo y valores iniciales de cada tema.
- `src/logic/operations.js` recibe una acción del usuario y devuelve valores, aristas, mensajes y cuadros de animación.
- `src/data/beginnerJava.js` entrega el código Java que corresponde a cada operación.
- `src/App.jsx` coordina el estado general y selecciona el visualizador apropiado.
- `src/components/OperationsPanel.jsx` construye los controles según el tipo de estructura.
- `src/components/EducationalDescription.jsx` presenta la documentación extendida.
- `scripts/audit-functions.mjs` verifica que el catálogo y las operaciones mantengan contratos válidos.
- `scripts/audit-challenges.mjs` genera preguntas y verifica sus resultados con el mismo motor de operaciones utilizado por la interfaz.
- `scripts/compile-java-audit.mjs` envuelve y compila cada fragmento educativo con `javac`.
- `scripts/stress-audit.mjs` somete todas las acciones a datos vacíos, negativos, decimales, enormes, texto, Unicode y secuencias de uso prolongadas.

## Auditoría y calidad

El comando:

```bash
npm run audit
```

comprueba automáticamente, entre otros puntos:

- Que existan los 86 temas esperados.
- Que cada tema tenga descripción educativa suficiente.
- Que cada sección práctica incluya un ejemplo Java; las guías de fundamentos son deliberadamente teóricas y no muestran código.
- Que todas las acciones devuelvan valores, aristas y mensajes válidos.
- Que exista código Java para cada operación disponible.
- Que el Sudoku produzca una solución `9×9` válida.
- Que N-Reinas no contenga conflictos y muestre `isSafe`.
- Que el laberinto llegue a la salida y enseñe el retroceso.
- Que Hash Table busque y elimine por clave.
- Que Union-Find siga correctamente la cadena hacia la raíz.
- Que BFS y DFS respeten sus recorridos esperados.
- Que Dijkstra y A* encuentren la ruta mínima A-F con costo 12.
- Que Torres de Hanoi complete todos sus movimientos.
- Que B+ Tree acepte al menos 15 inserciones consecutivas y muestre una promoción al padre.
- Que BST siga la ruta correcta y que AVL mantenga factores de balance válidos.
- Que el árbol enhebrado conserve el orden BST, repare hilos al eliminar y recorra inorden sin pila ni recursión.
- Que Splay lleve el nodo accedido a la raíz.
- Que Merkle combine hashes por parejas y el árbol de expresión respete precedencia.
- Que el AST distinga sentencias, identificadores, operadores y literales, respete precedencia y sincronice su recorrido recursivo.
- Que la matriz densa acceda mediante fila y columna, recorra sus dos ejes y transponga sin repetir intercambios.
- Que los polinomios mantengan exponentes descendentes, agrupen términos repetidos, eliminen coeficientes cero y sumen con punteros sincronizados.
- Que las listas generalizadas distingan átomos, sublistas y cabeceras, calculen longitud y profundidad y mantengan referencias compartidas.
- Que la matriz poco poblada inserte un único nodo en AROW y ACOL, recorra ambas listas en orden invertido y cierre sus enlaces circulares.

La auditoría actual cubre **86 temas, 310 acciones, 3100 pruebas funcionales y 83 funciones distintas**. También valida desafíos generados desde el estado real de los **66 laboratorios prácticos**. La capa de estrés añade **15 520 comprobaciones** —11 560 entradas extremas y 3960 operaciones encadenadas—. Además, los **310 códigos Java visibles** se compilan realmente con `javac`.

Además, Playwright verifica los recorridos críticos en Chromium de escritorio y móvil:

- Enlaces compartibles como `/avl` y `/sudoku`.
- Carga directa de los 86 temas y del tipo de contenido que corresponde a cada uno.
- Veinte guías de Fundamentos sin visualizador interactivo, operaciones, reproductor ni panel de código.
- Rechazo seguro de índices negativos, coordenadas fuera de rango, valores enormes y texto potencialmente peligroso.
- Avance sincronizado de animación, línea Java, explicación y variables en arreglos, grafos, Hanoi y N-Reinas.
- Persistencia del tema, velocidad y formato de código.
- Operaciones y restablecimiento de estructuras.
- Recorrido BST sincronizado entre nodo, línea Java y variables.
- Árbol enhebrado con hijos sólidos, hilos discontinuos, inserción y recorrido inorden sincronizado.
- Inserciones consecutivas en B+ con nodos de máximo tres claves, sin cruces ni solapamientos.
- Código especializado visible para AVL, Suffix Tree y B+ Tree.
- Introducción mostrada sólo durante la primera visita.
- Copia de reportes sin necesidad de una cuenta de GitHub.
- Ausencia de desbordamiento horizontal en móvil.

## Despliegue

### Configuración general para alojamiento estático

| Opción | Valor |
|---|---|
| Comando de instalación | `npm ci` |
| Comando de compilación | `npm run build` |
| Directorio de salida | `dist` |
| Versión recomendada de Node | `22.12.0`, registrada también en `.nvmrc` |

Las dependencias están fijadas a versiones exactas. Dependabot revisa actualizaciones semanalmente mediante pull requests y GitHub Actions ejecuta auditoría, build, revisión de vulnerabilidades y pruebas E2E antes de integrar cambios.

### Vercel

1. Importa el repositorio desde GitHub.
2. Selecciona **Vite** como framework.
3. Usa `npm run build` como comando de compilación.
4. Usa `dist` como directorio de salida.
5. Publica el proyecto.

`vercel.json` ya contiene el directorio de salida y las cabeceras de seguridad recomendadas.

### Netlify

1. Conecta el repositorio.
2. Define `npm run build` como *Build command*.
3. Define `dist` como *Publish directory*.
4. Ejecuta el despliegue.

`netlify.toml` ya contiene esta configuración y las cabeceras de seguridad.

### GitHub Pages

Si el proyecto se publica bajo una ruta de repositorio como:

```text
https://usuario.github.io/DATA-STRUCTURS/
```

Vite debe compilar los recursos usando esa ruta base. En ese caso, configura `base: '/DATA-STRUCTURS/'` en un archivo `vite.config.js` antes de generar `dist`. Si se publica en un dominio raíz, puede mantenerse la base predeterminada `/`.

## Reporte de errores

La aplicación incluye un botón con icono de insecto para informar problemas. El formulario envía la información directamente a la API ubicada en `report/`, sin abrir GitHub ni exponer la clave de Resend en el navegador.

El formulario solicita:

- Resumen corto.
- Tipo de problema.
- Descripción.
- Pasos para reproducirlo.
- Sección afectada.
- Nombre y correo opcional para responder al usuario.

En Vercel se debe configurar `VITE_REPORT_API_URL` con la URL pública del Web Service de Render. En Render, `ALLOWED_ORIGINS` debe contener el dominio exacto del frontend.

La política de seguridad de Vercel permite conexiones HTTPS hacia servicios `*.onrender.com`. Si la API se traslada a otro proveedor o a un dominio propio, ese origen también debe agregarse a `connect-src` en `vercel.json`.

## Navegación y preferencias

Cada tema dispone de un enlace compartible basado en hash, compatible con alojamiento estático:

```text
https://tu-dominio.cl/array
https://tu-dominio.cl/avl
https://tu-dominio.cl/sudoku
```

El navegador conserva localmente:

- Último tema visitado.
- Velocidad de reproducción.
- Formato Java o pseudocódigo.
- Estado del menú lateral.
- Confirmación de que la introducción ya fue mostrada.

La aplicación no almacena información personal ni envía estas preferencias a un servidor.

## Accesibilidad y diseño adaptable

El proyecto incorpora:

- Etiquetas accesibles en botones y controles importantes.
- Navegación comprensible mediante nombres visibles.
- Estados activos diferenciados por color, posición y forma.
- Tamaños tipográficos adaptados para lectura educativa.
- Diseño responsive para escritorio, tablet y móvil.
- Alternativa de movimiento reducido mediante `prefers-reduced-motion`.
- Mensajes textuales que acompañan los cambios visuales.
- Código con numeración de líneas y resaltado del paso activo.

Las visualizaciones son una ayuda educativa y deben complementarse con la explicación escrita y el código, especialmente para personas que no puedan percibir todos los cambios gráficos.

## SEO y rastreo

El build genera una versión HTML rastreable para la bienvenida y para cada tema en español e inglés. Esto permite que un buscador descubra contenido útil sin depender exclusivamente de la ejecución de React.

- Las rutas en español usan el formato `/avl` y las rutas en inglés `/en/avl`.
- Cada página posee título, descripción, URL canónica y metadatos Open Graph propios.
- Las variantes de idioma se relacionan mediante `hreflang="es"`, `hreflang="en"` y `hreflang="x-default"`.
- El contenido incluye datos estructurados `WebSite`, `SoftwareApplication`, `LearningResource` y `BreadcrumbList` según corresponda.
- La navegación principal utiliza enlaces HTML rastreables.
- `robots.txt` permite el rastreo y declara la ubicación del sitemap.
- `sitemap.xml` se construye automáticamente con todas las rutas públicas bilingües.

Para comprobar el resultado localmente:

```bash
npm run build
npm run audit:seo
```

Después del despliegue, el propietario debe verificar `dsalab.dev` como propiedad de dominio en Google Search Console y enviar `https://www.dsalab.dev/sitemap.xml`.

## Contribuciones

Las contribuciones son bienvenidas. Una forma recomendada de colaborar es:

1. Crea un *fork* del repositorio.
2. Crea una rama para tu cambio:

   ```bash
   git switch -c feature/nombre-del-cambio
   ```

3. Instala las dependencias con `npm ci`.
4. Implementa el cambio manteniendo el enfoque educativo.
5. Ejecuta las comprobaciones:

   ```bash
   npm run audit
   npm run build
   ```

6. Crea un commit descriptivo.
7. Sube tu rama y abre un Pull Request.

### Criterios para nuevas visualizaciones

Una contribución debería procurar:

- Mostrar claramente el estado inicial y final.
- Explicar las decisiones intermedias importantes.
- Mantener sincronizados visualización y código.
- Usar Java legible para estudiantes principiantes.
- Incluir descripción, operaciones, ventajas, limitaciones y usos.
- Funcionar en pantallas grandes y pequeñas.
- Añadir o actualizar pruebas en la auditoría cuando corresponda.

## Hoja de ruta

Posibles mejoras futuras:

- Añadir más descripciones guiadas y ejercicios.
- Permitir que el usuario escriba conjuntos de datos completos.
- Incorporar niveles de dificultad al modo desafío disponible en todos los laboratorios prácticos.
- Crear un panel general de progreso y temas dominados.
- Añadir pruebas unitarias y pruebas visuales automatizadas.
- Mejorar la navegación por teclado y lectores de pantalla.
- Permitir exportar ejemplos y secuencias de ejecución.
- Ampliar los árboles multicamino a más niveles visuales.
- Incorporar nuevos algoritmos de ordenamiento, caminos mínimos y programación dinámica.

## Autor

**Juan Zúñiga Maluenda**

DSA Lab es una iniciativa educativa enfocada en facilitar la comprensión de estructuras de datos y algoritmos. Los nombres, marcas y recursos visuales de terceros pertenecen a sus respectivos titulares.

## Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. Puedes usar, copiar, modificar, fusionar, publicar y distribuir el software, siempre que conserves el aviso de copyright y el texto de la licencia.

Consulta el archivo [LICENSE](./LICENSE) para leer los términos completos.

---

<div align="center">
  <strong>DSA Lab · Visualiza, comprende y crea.</strong><br />
  El límite es tu imaginación. Tú puedes.
</div>
