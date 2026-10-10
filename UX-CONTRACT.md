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
