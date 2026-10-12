# Contrato de interacción de DSA Lab

La aplicación es un laboratorio local de estados educativos, no un sistema CRUD de usuarios.
Identidad visual y tokens: [DESIGN.md](DESIGN.md). Contexto: [README.md](README.md).
El servicio de reportes valida los datos en `report/src/validation.js`.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Select nativo en App y BugReporter | DESIGN.md | native | Teclado y popup en navegador |
| Form | BugReporter y validación de reportes | report/src/validation.js | reporte | Campos inválidos, foco, recuperación |
| Scrollbar | src/styles.css | DESIGN.md | overflow propio de diagramas | Estilos calculados y móvil |
| Toast | Estado inline de OperationsPanel y BugReporter | Componentes compartidos | success / error / running | Región viva y finalización |

## Estados

La reproducción requiere una operación preparada. Antes de eso, el código no tiene línea activa.
Una traza exacta refleja eventos de la operación; un resumen se identifica como tal y no inventa ramas.
El estado completado se presenta solamente en el último evento. Las entradas inválidas mantienen
la estructura anterior y muestran una indicación útil. Una nueva operación parte del resultado
de la anterior, aunque su reproducción estuviera pausada.

Los selectores conservan el popup nativo del sistema. Los diálogos conservan foco, Escape y
restauración del foco mediante el hook compartido. Ningún acceso global tapa contenido.

## Variante de árbol enhebrado de la asignatura

Decisión del usuario, aclarada mediante el esquema de la asignatura: `root` es una cabecera
amarilla separada de los nodos con datos. `root.left` enlaza el primer nodo con datos y
`root.right` vuelve a `root` con `rightThread = false`. En vacío, `root.left = root` y
`leftThread = true`; en no vacío, `leftThread = false`. El menor tiene `left` hacia la
cabecera y el mayor tiene `right` hacia ella; los demás hilos apuntan al vecino inorden.
Un único nodo con datos cierra ambos hilos hacia la cabecera, no hacia sí mismo.
Java, C++, pseudocódigo, escenas y explicaciones muestran esta misma variante.
Inorden empieza en `leftMost(root.left)` y termina al regresar a `root`, sin visitarla.
Buscar devuelve la cabecera si la clave no existe. Eliminar reconecta antes de liberar el
nodo y nunca libera la cabecera; el destructor C++ libera sus datos y luego la cabecera.
