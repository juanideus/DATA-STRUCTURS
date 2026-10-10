# Correcciones y segunda revisión — 10/10/2026

Se corrigieron los hallazgos de la auditoría del commit `8e769e6`.
Los cambios permanecen locales; este informe no confirma un despliegue ni una nueva PR.

## Decisión importante sobre las trazas

Una expansión sintáctica no equivale a ejecutar el programa. Se retiró el recorrido
genérico de ramas/ciclos para las familias sin eventos semánticos propios. Esas operaciones
siguen funcionando, pero muestran un **resumen identificado de estados**, sin inventar
líneas ejecutadas. Los recorridos de árboles muestran cada visita en su orden real.
Una línea sin equivalencia exacta queda sin resaltar y se explica en la interfaz.
Completar trazas nativas detalladas para todas esas operaciones sigue siendo trabajo futuro.

## Hallazgos corregidos

| Hallazgo | Corrección | Revisión posterior |
|---|---|---|
| A1 | Hash con signo común y casillas reales, incluidas marcas de borrado | `zzzzzz` indica 8 en Java/C++; `a`, `m`, borrar `a`, buscar `m` pasa por BORRADA y llega a 2 |
| A2 | No expandir ramas/ciclos ficticios; recorridos n-arios por sus padres reales | Insertar `r` en bucket vacío y buscar 12 en Skip List no iluminan ramas ficticias; árbol general visita sus 7 nodos en orden |
| A3 | Ordenamientos comparten variante y variables; Cola enseña puntero temporal, liberación y contrato booleano | Quick, Shell, Heap y Merge verificados en sus pasos discrepantes; Dequeue llega a `delete oldFront` y `return true` |
| A4 | Sin reproducción inicial ficticia; Pila muestra el tope; contar nodos ocupados | Pila muestra índice 3 / valor 16; AST muestra 7 nodos; reproductor inicialmente deshabilitado |
| A5 | Mencionar ejes únicamente en KD-tree | Búsqueda BST e inserción AVL sin texto espacial |
| A6 | Separar prefijo ordenado de posiciones definitivas | Insertion muestra ORDENADO y reserva FIJO para la finalización |
| A7 | Encabezado Ejecutando hasta el último evento | Pila, Cola, hashing y ordenamientos observados antes y al finalizar |
| C1 | Guardas de índices en Fenwick, Union-Find y pathfinding; Fenwick Java inicializa sus datos/agregados | Lectura de guardas y compilación; no ejecución nativa exhaustiva de entradas inválidas |
| C2 | Java, JavaScript y C++ procesan bytes UTF-8 | Bloque `á` muestra raíz `0x00003285` |
| V1 | Tokens de texto oscuro en guías y metadatos | Párrafos de las 20 guías; etiquetas B/B+/B*, grafos, matrices, polinomios y listas |
| V2 | Mantener rojo/negro y añadir etiquetas; seleccionar con contorno | Nodo negro activo conserva su fondo en claro y oscuro; se corrigió una regla tardía adicional hallada al repetir |
| V3 | Selector separado para interior de Prim | Interior `rgb(44,61,80)`, ya no blanco en oscuro |
| V4 | Chaining tiene desplazamiento propio y acceso por teclado | Bucket 7 completamente dentro del panel al llegar al final |
| V5 | Utilidades en flujo normal; badge fuera del canvas; banda reservada para títulos de grafos | Sudoku móvil sin badge encima; Kruskal sin intersección título/nodo B; acciones globales al pie sin tapar datos |
| V6 | SVG de ancho legible con desplazamiento; selectors de markers correctos | Móvil 390×844: escena 735 px, viewport 330 px, sin overflow del documento; flechas con color |
| V7 | Nombres accesibles independientes de texto oculto | Reproducir y Velocidad conservan nombre en móvil |

El formulario también incluye la categoría C++, textareas de crecimiento limitado y
documentación de selectores nativos. Se conservaron naranja, bordes redondeados y
memoria dinámica C++ con arreglos/punteros, sin vectores.

## Verificación ejecutada

- Recorrido manual dirigido en 26 páginas prácticas y revisión del texto de las 20 guías.
- Reproducciones en C++; comprobaciones Java específicas, incluyendo hashing.
- Claro/oscuro, viewport móvil, desplazamiento por teclado, apertura/cierre del formulario,
  selección de categoría C++, Escape y restauración de foco.
- Compilación de 310 ejemplos Java y 310 C++: correcta.
- Build de Vite: correcto.
- Generación y auditoría SEO: 174 URLs, canonicals, hreflang, JSON-LD, sitemap y robots correctos.
- Auditor estático de UI estricto: cero hallazgos.
- Lint de DESIGN.md: cero errores (avisos de tokens documentales no referenciados en frontmatter).
- Sintaxis de los scripts y `git diff --check`: correctas.
- Consola del recorrido observado: sin errores ni advertencias.

Los controles de límite del reproductor y el contrato de resúmenes se reflejaron en
las comprobaciones de regresión del repositorio. **No se ejecutó `npm run test` ni
la suite funcional/E2E completa.** La compilación no prueba todo el comportamiento
nativo, y esta revisión dirigida no certifica todas las entradas de las 86 páginas.

## Corrección de CI de la PR #67

La auditoría detectó que `current.value`, usado como expresión dentro de una impresión,
no encontraba `current->value` en C++. Se corrigió el buscador compartido para reconocer
fragmentos sintácticos equivalentes dentro de la operación seleccionada, sin recurrir
a aproximaciones semánticas ni eliminar la comprobación de la matriz poco poblada.
Se añadió una regresión que también exige mantener sin resaltar una expresión inexistente.

Después de la corrección pasaron `audit-functions.mjs` (86 temas, 310 acciones y 3100
comprobaciones funcionales) y `audit-structure-fidelity.mjs`.

La siguiente ejecución de CI pasó esos controles, seguridad y build, pero encontró
una expectativa E2E antigua en Dijkstra/A*: exigía éxito en el primer paso con el
reloj detenido. Se actualizó para exigir `Ejecutando` durante el recorrido y éxito
únicamente después de llegar al último evento, sin omitir la prueba.

La comprobación del final descubrió además un fallo real: los eventos de pathfinding
no llevan la bandera `completed`, por lo que el encabezado seguía en ejecución aun
con la ruta terminada. El reproductor ahora determina ese estado por la posición
en la secuencia, no por una bandera opcional de cada familia. La regresión recorre
los controles reales por teclado y exige el estado final y el botón Siguiente deshabilitado.
