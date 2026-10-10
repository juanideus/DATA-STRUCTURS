---
version: alpha
name: DSA Lab
description: Laboratorio educativo de estructuras de datos con estados visibles y código Java/C++.
colors:
  primary: "#ef5a36"
  background: "#f4f0e8"
  surface: "#faf8f3"
  text: "#1f2825"
  darkBackground: "#121a26"
  darkSurface: "#1c2736"
  darkText: "#edf3f8"
typography:
  sans:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif'
  mono:
    fontFamily: '"DM Mono", monospace'
rounded:
  DEFAULT: "8px"
omitted:
  - section: spacing
    reason: La geometría sigue las reglas existentes por tipo de visualización, no una nueva escala global.
components:
  visualizer: {}
  player: {}
  reportForm: {}
---

# DSA Lab

## Overview

Un cuaderno de laboratorio interactivo para estudiantes de Estructuras de Datos.
La firma del producto es ver cambiar nodos, arreglos y punteros junto a explicaciones concretas.
El catálogo es una herramienta; la bienvenida presenta esa herramienta. Idiomas: español e inglés.
Se conserva la identidad existente, el naranja y los bordes redondeados, sin rebranding.

## Colors

Los valores canónicos están en `src/styles.css` (`:root`) y `src/accessibility.css`
(`html[data-dark-mode]`). Este documento los refleja, no genera CSS.
`primary` corresponde a `--orange`; background/surface/text a `--paper/--cream/--ink`.
El modo oscuro cambia superficies y contraste, no el significado de colores semánticos.
Rojo/negro de árboles siempre se conserva y se acompaña con texto.

## Typography

System UI para lectura y controles; DM Mono para código, índices y datos técnicos.
No reducir diagramas hasta volver ilegibles sus etiquetas: usar desplazamiento propio.

## Layout

Dos paneles en escritorio y una columna en móvil. El documento conserva su desplazamiento.
Los diagramas densos son dueños de su overflow. Ayuda, reportes y preferencias van en
flujo normal, sin tapar variables ni botones. Los indicadores de paso tienen una fila propia.

## Elevation & Depth

Superficies y bordes distinguen paneles; evitar añadir brillo al naranja.
Las superposiciones quedan reservadas a diálogos, no a anotaciones de datos.

## Shapes

Conservar las esquinas redondeadas existentes. Los nodos mantienen su forma pedagógica.

## Components

App es dueño del reproductor; Visualizer de las escenas; OperationsPanel y VariablesPanel
de estados y explicaciones. No simular ejecución sin una operación preparada.
Las trazas exactas resaltan líneas equivalentes. Sin correspondencia, no resaltar otra
por aproximación. Los resúmenes de estados se etiquetan explícitamente.
Completado significa último evento, no preparación de la operación.

BugReporter es dueño de validación y envío. Sus selectores y el de velocidad son nativos:
se acepta la geometría y el teclado del sistema operativo. Textareas crecen hasta un límite
y luego desplazan su contenido. Diálogos usan el manejo de foco compartido existente.
Lucide mantiene la familia de iconos. Los controles solo con icono tienen nombre accesible.
El movimiento enseña cambios y respeta reducción de movimiento.

## Do's and Don'ts

- Conservar SEO, rutas y el contrato de memoria dinámica con punteros/arreglos C++.
- Usar texto además de color para información semántica.
- No inventar ramas, iteraciones ni líneas ejecutadas.
- No tapar estructuras con botones de utilidad o badges.
