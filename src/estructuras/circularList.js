/* =========================================================
   MÓDULO: Lista Circular Simple (Circular Linked List)
   Se integra con app.js a través de registrarModulo(id, definicion)
   ========================================================= */

registrarModulo("lista-circular-simple", {
  nombre: "Lista Circular Simple",
  complejidad: "Acceso: O(n) · Inserción/Eliminación en cabeza: O(1) · En cola: O(n)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
    // Cada nodo: { valor }. El último nodo enlaza de vuelta a head (no a NULL).
    // ---------------------------------------------------
    let nodos = [10, 25, 8, 17];
    const CAPACIDAD_MAX = 10;

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      insertarInicio: [
        "void insertarInicio(int valor) {",
        "    Nodo nuevo = new Nodo(valor);",
        "    if (head == null) {",
        "        nuevo.next = nuevo;",
        "        head = nuevo;",
        "        return;",
        "    }",
        "    Nodo ultimo = head;",
        "    while (ultimo.next != head) {",
        "        ultimo = ultimo.next;",
        "    }",
        "    nuevo.next = head;",
        "    ultimo.next = nuevo;",
        "    head = nuevo;",
        "}",
      ],
      insertarFinal: [
        "void insertarFinal(int valor) {",
        "    Nodo nuevo = new Nodo(valor);",
        "    if (head == null) {",
        "        nuevo.next = nuevo;",
        "        head = nuevo;",
        "        return;",
        "    }",
        "    Nodo actual = head;",
        "    while (actual.next != head) {",
        "        actual = actual.next;",
        "    }",
        "    actual.next = nuevo;",
        "    nuevo.next = head;",
        "}",
      ],
      eliminarInicio: [
        "void eliminarInicio() {",
        "    if (head == null) return;",
        "    if (head.next == head) {",
        "        head = null;",
        "        return;",
        "    }",
        "    Nodo ultimo = head;",
        "    while (ultimo.next != head) {",
        "        ultimo = ultimo.next;",
        "    }",
        "    head = head.next;",
        "    ultimo.next = head;",
        "}",
      ],
      buscar: [
        "Nodo buscar(int valor) {",
        "    if (head == null) return null;",
        "    Nodo actual = head;",
        "    do {",
        "        if (actual.valor == valor) {",
        "            return actual;",
        "        }",
        "        actual = actual.next;",
        "    } while (actual != head);",
        "    return null;",
        "}",
      ],
    };

    function pintarCodigo(lineas, lineaActiva = -1) {
      if (!elCodigo) return;
      elCodigo.innerHTML = "";
      lineas.forEach((texto, i) => {
        const span = document.createElement("span");
        span.className = "linea-codigo" + (i === lineaActiva ? " activa" : "");
        span.textContent = texto;
        elCodigo.appendChild(span);
      });
    }

    // ---------------------------------------------------
    // Construcción del stage (nodos + flecha de cierre circular)
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "lista-wrapper";

    const fila = document.createElement("div");
    fila.className = "lista-fila";
    wrapper.appendChild(fila);

    stage.appendChild(wrapper);

    function pintar(resaltados = {}) {
      fila.innerHTML = "";

      if (nodos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "array-vacio";
        vacio.textContent = "Lista circular vacía (head == null)";
        fila.appendChild(vacio);
        return;
      }

      nodos.forEach((valor, i) => {
        const grupo = document.createElement("div");
        grupo.className = "lista-grupo";

        const nodo = document.createElement("div");
        nodo.className = "lista-nodo";
        nodo.dataset.indice = i;

        if (resaltados.activos && resaltados.activos.includes(i)) {
          nodo.classList.add("celda-activa");
        }
        if (resaltados.encontrado === i) {
          nodo.classList.add("celda-encontrada");
        }
        if (resaltados.descartados && resaltados.descartados.includes(i)) {
          nodo.classList.add("celda-descartada");
        }
        if (resaltados.nuevo === i) {
          nodo.classList.add("celda-nueva");
        }

        const valorEl = document.createElement("div");
        valorEl.className = "array-valor";
        valorEl.textContent = valor;
        nodo.appendChild(valorEl);

        if (i === 0) {
          const etiquetaHead = document.createElement("div");
          etiquetaHead.className = "lista-etiqueta-head";
          etiquetaHead.textContent = "HEAD";
          nodo.appendChild(etiquetaHead);
        }

        grupo.appendChild(nodo);

        const esUltimo = i === nodos.length - 1;
        if (!esUltimo) {
          const flecha = document.createElement("div");
          flecha.className = "lista-flecha";
          flecha.textContent = "→";
          grupo.appendChild(flecha);
        }

        fila.appendChild(grupo);
      });

      // Flecha curva real (SVG) desde el último nodo hasta el head
      requestAnimationFrame(() => dibujarFlechaCircular());
    }

    // ---------------------------------------------------
    // Dibuja una curva SVG que sale por arriba del último nodo
    // y entra por arriba del primer nodo (head), cerrando el ciclo.
    // ---------------------------------------------------
    let svgCircular = null;

    function dibujarFlechaCircular() {
      if (svgCircular) {
        svgCircular.remove();
        svgCircular = null;
      }

      const todosLosNodos = fila.querySelectorAll(".lista-nodo");
      if (todosLosNodos.length < 1) return;

      const primero = todosLosNodos[0];
      const ultimo = todosLosNodos[todosLosNodos.length - 1];

      const rectFila = wrapper.getBoundingClientRect();
      const rectPrimero = primero.getBoundingClientRect();
      const rectUltimo = ultimo.getBoundingClientRect();

      const soloUnNodo = todosLosNodos.length === 1;

      const xInicio = soloUnNodo
        ? rectUltimo.left + rectUltimo.width * 0.78 - rectFila.left
        : rectUltimo.left + rectUltimo.width / 2 - rectFila.left;
      const xFin = soloUnNodo
        ? rectPrimero.left + rectPrimero.width * 0.22 - rectFila.left
        : rectPrimero.left + rectPrimero.width / 2 - rectFila.left;
      const yBase = rectUltimo.top - rectFila.top;

      const alturaCurva = soloUnNodo ? 34 : 46;
      const yControl = yBase - alturaCurva;

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "lista-svg-circular");
      svg.setAttribute("width", rectFila.width);
      svg.setAttribute("height", yBase + 4);

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${xInicio} ${yBase} C ${xInicio} ${yControl}, ${xFin} ${yControl}, ${xFin} ${yBase}`;
      path.setAttribute("d", d);
      path.setAttribute("class", "lista-path-circular");
      path.setAttribute("marker-end", "url(#flecha-circular-punta)");

      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = `
        <marker id="flecha-circular-punta" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="lista-flecha-punta" />
        </marker>
      `;

      svg.appendChild(defs);
      svg.appendChild(path);
      wrapper.appendChild(svg);
      svgCircular = svg;
    }

    window.addEventListener("resize", () => {
      if (fila.querySelector(".lista-nodo")) dibujarFlechaCircular();
    });

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="lista-input-valor" placeholder="Valor" />
      <button id="btn-insertar-inicio">Insertar al inicio</button>
      <button id="btn-insertar-final">Insertar al final</button>
      <button id="btn-eliminar-inicio">Eliminar inicio</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#lista-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function avisar(mensaje) {
      player.cargarPasos([
        {
          descripcion: mensaje,
          aplicar: () => pintar(),
        },
      ]);
    }

    // ---------------------------------------------------
    // Operación: Insertar al inicio
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-inicio").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (nodos.length >= CAPACIDAD_MAX) return avisar("⚠ La lista alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertarInicio;
      const pasos = [];

      if (nodos.length === 0) {
        pasos.push({
          descripcion: `La lista está vacía: el nuevo nodo (${valor}) se enlaza a sí mismo y se convierte en head.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 3); },
        });
        pasos.push({
          descripcion: `head ahora apunta al nuevo nodo, que se enlaza a sí mismo.`,
          aplicar: () => {
            nodos.unshift(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 4);
          },
        });
      } else {
        for (let i = 0; i < nodos.length; i++) {
          const esUltimo = i === nodos.length - 1;
          pasos.push({
            descripcion: esUltimo
              ? `ultimo llega al nodo ${nodos[i]}, cuyo next ya apunta de vuelta a head: aquí se reconectará.`
              : `ultimo avanza al nodo ${nodos[i]} (ultimo.next != head, se sigue recorriendo).`,
            aplicar: () => { pintar({ activos: [i] }); pintarCodigo(codigo, esUltimo ? 8 : 9); },
          });
        }

        pasos.push({
          descripcion: `El nuevo nodo (${valor}) apunta al head actual, y el último nodo se reconecta hacia el nuevo nodo.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 12); },
        });

        pasos.push({
          descripcion: `El nuevo nodo se convierte en el nuevo head de la lista circular.`,
          aplicar: () => {
            nodos.unshift(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 13);
          },
        });
      }

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Insertar al final
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-final").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (nodos.length >= CAPACIDAD_MAX) return avisar("⚠ La lista alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertarFinal;
      const pasos = [];

      if (nodos.length === 0) {
        pasos.push({
          descripcion: `La lista está vacía: el nuevo nodo (${valor}) se enlaza a sí mismo y se convierte en head.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 3); },
        });
        pasos.push({
          descripcion: `head ahora apunta al nuevo nodo, que se enlaza a sí mismo.`,
          aplicar: () => {
            nodos.push(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 4);
          },
        });
      } else {
        for (let i = 0; i < nodos.length; i++) {
          const esUltimo = i === nodos.length - 1;
          pasos.push({
            descripcion: esUltimo
              ? `actual llega al nodo ${nodos[i]}, cuyo next apunta de vuelta a head: aquí se enlazará el nuevo nodo.`
              : `actual avanza al nodo ${nodos[i]} (actual.next != head, se sigue recorriendo).`,
            aplicar: () => { pintar({ activos: [i] }); pintarCodigo(codigo, esUltimo ? 8 : 9); },
          });
        }

        pasos.push({
          descripcion: `Se enlaza: actual.next apunta al nuevo nodo (${valor}), y el nuevo nodo.next vuelve a apuntar a head.`,
          aplicar: () => {
            nodos.push(valor);
            pintar({ nuevo: nodos.length - 1 });
            pintarCodigo(codigo, 12);
          },
        });
      }

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Eliminar inicio (head)
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar-inicio").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.eliminarInicio;

      if (nodos.length === 0) {
        return player.cargarPasos([
          {
            descripcion: "⚠ La lista está vacía: no hay head para eliminar.",
            aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
          },
        ]);
      }

      const valorHead = nodos[0];
      const pasos = [];

      if (nodos.length === 1) {
        pasos.push({
          descripcion: `head.next apunta a sí mismo: es el único nodo. Al eliminarlo, head queda en null.`,
          aplicar: () => { pintar({ activos: [0] }); pintarCodigo(codigo, 2); },
        });
        pasos.push({
          descripcion: `Lista circular vacía.`,
          aplicar: () => {
            nodos.shift();
            pintar();
            pintarCodigo(codigo, 3);
          },
        });
      } else {
        pasos.push({
          descripcion: `Se eliminará el head actual (valor ${valorHead}). Se debe ubicar el último nodo para reconectarlo.`,
          aplicar: () => { pintar({ activos: [0] }); pintarCodigo(codigo, 6); },
        });

        for (let i = 0; i < nodos.length - 1; i++) {
          pasos.push({
            descripcion: `ultimo avanza al nodo ${nodos[i]} (ultimo.next != head, se sigue recorriendo).`,
            aplicar: () => { pintar({ activos: [i] }); pintarCodigo(codigo, 7); },
          });
        }

        pasos.push({
          descripcion: `head ahora apunta a head.next (${nodos[1]}), y el último nodo se reconecta hacia el nuevo head.`,
          aplicar: () => {
            nodos.shift();
            pintar();
            pintarCodigo(codigo, 10);
          },
        });
      }

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Buscar valor
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido para buscar.");
      if (nodos.length === 0) return avisar("⚠ La lista circular está vacía.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const descartados = [];

      pasos.push({
        descripcion: `Se inicia el recorrido desde head buscando el valor ${valor}. La condición de parada es volver a head.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 2); },
      });

      let encontradoEn = -1;
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i] === valor) {
          encontradoEn = i;
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) == ${valor}: nodo encontrado.`,
            aplicar: () => { pintar({ encontrado: i, descartados: [...descartados] }); pintarCodigo(codigo, 4); },
          });
          break;
        } else {
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) ≠ ${valor}. actual = actual.next.`,
            aplicar: () => { pintar({ activos: [i], descartados: [...descartados] }); pintarCodigo(codigo, 6); },
          });
          descartados.push(i);
        }
      }

      if (encontradoEn === -1) {
        pasos.push({
          descripcion: `actual volvió a head sin encontrar el valor ${valor}: no está en la lista.`,
          aplicar: () => { pintar({ descartados: [...descartados] }); pintarCodigo(codigo, 7); },
        });
      }

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      nodos = [10, 25, 8, 17];
      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Lista circular reiniciada a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Lista circular simple inicial con ${nodos.length} nodos. head apunta a ${nodos[0]}, y el último nodo apunta de vuelta a head.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});