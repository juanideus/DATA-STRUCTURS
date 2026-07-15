<div align="center">
  <img src="./src/assets/favicon-dsa.svg" alt="Logo de DSA Lab" width="92" />

  # DSA Lab

  **Laboratorio interactivo para aprender estructuras de datos y algoritmos mediante visualizaciones, animaciones y código Java para principiantes.**

  [![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-ES_Modules-F7DF1E?logo=javascript&logoColor=111)](https://developer.mozilla.org/docs/Web/JavaScript)
  [![License: MIT](https://img.shields.io/badge/License-MIT-2f6f5e.svg)](./LICENSE)

  Desarrollado por **Juan Zúñiga Maluenda**  
  Universidad Católica del Norte · Antofagasta, Chile
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
- [Contribuciones](#contribuciones)
- [Hoja de ruta](#hoja-de-ruta)
- [Autor y contexto académico](#autor-y-contexto-académico)
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

### Código sincronizado

- Panel de código Java para principiantes.
- Pseudocódigo disponible como formato alternativo.
- Resaltado de la línea que corresponde al paso actual de la animación.
- Ejemplos deliberadamente sencillos, con variables, ciclos, condiciones, arreglos y métodos pequeños.
- Botón para copiar el código mostrado.

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
- Crédito de autor y referencia a la Universidad Católica del Norte.
- Formulario integrado para preparar reportes de errores en GitHub.

## Catálogo de contenidos

La versión actual contiene **51 temas**, agrupados en siete categorías.

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

### 2. Árboles — 21 temas

10. Árbol general
11. Árbol N-ario
12. Árbol binario
13. Binary Search Tree
14. Árbol AVL
15. Árbol Rojo-Negro
16. Splay Tree
17. Heap binario
18. Fibonacci Heap
19. Prefix Tree
20. Suffix Tree
21. Segment Tree
22. Fenwick Tree
23. B-Tree
24. B+ Tree
25. B* Tree
26. Merkle Tree
27. KD-Tree
28. QuadTree
29. Octree
30. Árbol de expresión

### 3. Hashing — 3 temas

31. Hash Table
32. Open Addressing
33. Separate Chaining

### 4. Grafos — 7 temas

34. Grafo
35. Grafo dirigido
36. DFS
37. BFS
38. Dijkstra
39. Prim
40. Kruskal

### 5. Recursión — 5 temas

41. Fibonacci
42. Factorial
43. Torres de Hanoi
44. Merge Sort
45. Quick Sort

### 6. Backtracking — 3 temas

46. N-Reinas
47. Laberinto
48. Sudoku Solver 9×9

### 7. Otros — 3 temas

49. Union-Find
50. LRU Cache
51. Bloom Filter

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

Flujo recomendado antes de subir cambios:

```bash
npm run audit
npm run build
```

## Estructura del proyecto

```text
DSA/
├── index.html                         # Documento HTML utilizado por Vite
├── package.json                       # Dependencias y scripts
├── package-lock.json                  # Versiones reproducibles
├── scripts/
│   └── audit-functions.mjs            # Auditoría automática del laboratorio
├── src/
│   ├── App.jsx                        # Aplicación, navegación y visualizadores
│   ├── main.jsx                       # Punto de entrada de React
│   ├── styles.css                     # Estilos, animaciones y responsive design
│   ├── assets/
│   │   ├── favicon-dsa.svg            # Favicon de DSA Lab
│   │   └── LogoUCN.png                # Recurso visual UCN
│   ├── components/
│   │   ├── EducationalDescription.jsx # Guía educativa de cada tema
│   │   └── OperationsPanel.jsx        # Campos y botones de operaciones
│   ├── data/
│   │   ├── algorithms.js              # Catálogo de 51 temas
│   │   ├── beginnerJava.js            # Código Java por operación
│   │   ├── educationalDescriptions.js # Contenido educativo detallado
│   │   └── guideJavaExamples.js       # Ejemplos Java de las guías
│   ├── logic/
│   │   └── operations.js              # Implementación de las acciones interactivas
│   └── estructuras/                   # Implementaciones auxiliares y de referencia
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

## Auditoría y calidad

El comando:

```bash
npm run audit
```

comprueba automáticamente, entre otros puntos:

- Que existan los 51 temas esperados.
- Que cada tema tenga descripción educativa suficiente.
- Que cada tema incluya un ejemplo Java.
- Que todas las acciones devuelvan valores, aristas y mensajes válidos.
- Que exista código Java para cada operación disponible.
- Que el Sudoku produzca una solución `9×9` válida.
- Que N-Reinas no contenga conflictos y muestre `isSafe`.
- Que el laberinto llegue a la salida y enseñe el retroceso.
- Que Hash Table busque y elimine por clave.
- Que Union-Find siga correctamente la cadena hacia la raíz.
- Que BFS y DFS respeten sus recorridos esperados.
- Que Torres de Hanoi complete todos sus movimientos.
- Que B+ Tree acepte al menos 15 inserciones consecutivas y muestre una promoción al padre.

La auditoría actual cubre **51 temas, 231 acciones y 55 funciones distintas**.

## Despliegue

### Configuración general para alojamiento estático

| Opción | Valor |
|---|---|
| Comando de instalación | `npm ci` |
| Comando de compilación | `npm run build` |
| Directorio de salida | `dist` |
| Versión recomendada de Node | 22 LTS o una versión compatible con los requisitos anteriores |

### Vercel

1. Importa el repositorio desde GitHub.
2. Selecciona **Vite** como framework.
3. Usa `npm run build` como comando de compilación.
4. Usa `dist` como directorio de salida.
5. Publica el proyecto.

### Netlify

1. Conecta el repositorio.
2. Define `npm run build` como *Build command*.
3. Define `dist` como *Publish directory*.
4. Ejecuta el despliegue.

### GitHub Pages

Si el proyecto se publica bajo una ruta de repositorio como:

```text
https://usuario.github.io/DATA-STRUCTURS/
```

Vite debe compilar los recursos usando esa ruta base. En ese caso, configura `base: '/DATA-STRUCTURS/'` en un archivo `vite.config.js` antes de generar `dist`. Si se publica en un dominio raíz, puede mantenerse la base predeterminada `/`.

## Reporte de errores

La aplicación incluye un botón con icono de insecto para informar problemas. El formulario solicita:

- Resumen corto.
- Tipo de problema.
- Descripción.
- Pasos para reproducirlo.
- Sección afectada.

Al continuar, se abre un borrador de Issue en:

[GitHub Issues · DATA-STRUCTURS](https://github.com/juanideus/DATA-STRUCTURS/issues/new)

El usuario puede revisar el contenido antes de publicarlo. Para crear el Issue es necesario iniciar sesión en GitHub.

También puedes abrir directamente la sección general de problemas:

[Ver problemas existentes](https://github.com/juanideus/DATA-STRUCTURS/issues)

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
- Guardar sesiones de práctica localmente.
- Incorporar desafíos con diferentes niveles.
- Añadir pruebas unitarias y pruebas visuales automatizadas.
- Mejorar la navegación por teclado y lectores de pantalla.
- Agregar internacionalización.
- Permitir exportar ejemplos y secuencias de ejecución.
- Ampliar los árboles multicamino a más niveles visuales.
- Incorporar nuevos algoritmos de ordenamiento, caminos mínimos y programación dinámica.

## Autor y contexto académico

**Autor:** Juan Zúñiga Maluenda  
**Contexto académico:** Universidad Católica del Norte  
**Ubicación:** Antofagasta, Chile

DSA Lab es una iniciativa educativa enfocada en facilitar la comprensión de estructuras de datos y algoritmos. Los nombres, marcas y recursos visuales de terceros pertenecen a sus respectivos titulares.

## Licencia

Este proyecto se distribuye bajo la **Licencia MIT**. Puedes usar, copiar, modificar, fusionar, publicar y distribuir el software, siempre que conserves el aviso de copyright y el texto de la licencia.

Consulta el archivo [LICENSE](./LICENSE) para leer los términos completos.

---

<div align="center">
  <strong>DSA Lab · Visualiza, comprende y crea.</strong><br />
  El límite es tu imaginación. Tú puedes.
</div>
