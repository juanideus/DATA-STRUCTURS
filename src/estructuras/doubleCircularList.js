/* =========================================================
   MÓDULO: Lista Circular Doble (Doubly Circular Linked List)
   Se integra con app.js a través de registrarModulo(id, definicion)
   El último nodo conecta su next al primero, y el primero conecta
   su prev al último: cierre circular en ambas direcciones.
   ========================================================= */

registrarModulo("lista-circular-doble", {
  nombre: "Lista Circular Doble",
  complejidad: "Acceso: O(n) · Inserción/Eliminación en cabeza o cola: O(1)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
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
        "        nuevo.prev = nuevo;",
        "        head = nuevo;",
        "        return;",
        "    }",
        "    Nodo ultimo = head.prev;",
        "    nuevo.next = head;",
        "    nuevo.prev = ultimo;",
        "    ultimo.next = nuevo;",
        "    head.prev = nuevo;",
        "    head = nuevo;",
        "}",
      ],
      insertarFinal: [
        "void insertarFinal(int valor) {",
        "    Nodo nuevo = new Nodo(valor);",
        "    if (head == null) {",
        "        nuevo.next = nuevo;",
        "        nuevo.prev = nuevo;",
        "        head = nuevo;",
        "        return;",
        "    }",
        "    Nodo ultimo = head.prev;",
        "    ultimo.next = nuevo;",
        "    nuevo.prev = ultimo;",
        "    nuevo.next = head;",
        "    head.prev = nuevo;",
        "}",
      ],
      eliminarInicio: [
        "void eliminarInicio() {",
        "    if (head == null) return;",
        "    if (head.next == head) {",
        "        head = null;",
        "        return;",
        "    }",
        "    Nodo ultimo = head.prev;",
        "    Nodo nuevoHead = head.next;",
        "    ultimo.next = nuevoHead;",
        "    nuevoHead.prev = ultimo;",
        "    head = nuevoHead;",
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
        span.textContent = texto || " ";
        elCodigo.appendChild(span);
      });
    }

    // ---------------------------------------------------
    // Construcción del stage (nodos + flechas dobles + curvas next/prev)
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "lista-wrapper lista-wrapper-doble-circular";

    const fila = document.createElement("div");
    fila.className = "lista-fila";
    wrapper.appendChild(fila);

    stage.appendChild(wrapper);

    function pintar(resaltados = {}) {
      fila.innerHTML = "";

      if (nodos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "array-vacio";
        vacio.textContent = "Lista circular doble vacía (head == null)";
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
          const flechaDoble = document.createElement("div");
          flechaDoble.className = "lista-flecha-doble";
          flechaDoble.innerHTML = `<span class="flecha-prev">⟸</span><span class="flecha-next">⟹</span>`;
          grupo.appendChild(flechaDoble);
        }

        fila.appendChild(grupo);
      });

      // Curvas SVG circulares: una arriba (next: último→head) y
      // otra abajo (prev: head→último).
      requestAnimationFrame(() => dibujarCurvasCirculares());
    }

    // ---------------------------------------------------
    // Dibuja dos curvas SVG: arriba (next del último hacia head)
    // y abajo (prev del head hacia el último). Sin etiqueta TAIL.
    // ---------------------------------------------------
    let svgArriba = null;
    let svgAbajo = null;

    function construirCurva(xInicio, xFin, yBase, alturaCurva, haciaArriba) {
      const yControl = haciaArriba ? yBase - alturaCurva : yBase + alturaCurva;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", haciaArriba ? "lista-svg-circular lista-svg-circular-arriba" : "lista-svg-circular lista-svg-circular-abajo");

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${xInicio} ${yBase} C ${xInicio} ${yControl}, ${xFin} ${yControl}, ${xFin} ${yBase}`;
      path.setAttribute("d", d);
      path.setAttribute("class", haciaArriba ? "lista-path-circular" : "lista-path-circular lista-path-circular-prev");
      path.setAttribute("marker-end", haciaArriba ? "url(#flecha-circular-punta-arriba)" : "url(#flecha-circular-punta-abajo)");

      const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
      defs.innerHTML = haciaArriba
        ? `<marker id="flecha-circular-punta-arriba" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="lista-flecha-punta" />
          </marker>`
        : `<marker id="flecha-circular-punta-abajo" viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" class="lista-flecha-punta lista-flecha-punta-prev" />
          </marker>`;

      svg.appendChild(defs);
      svg.appendChild(path);
      return svg;
    }

    function dibujarCurvasCirculares() {
      if (svgArriba) { svgArriba.remove(); svgArriba = null; }
      if (svgAbajo) { svgAbajo.remove(); svgAbajo = null; }

      const todosLosNodos = fila.querySelectorAll(".lista-nodo");
      if (todosLosNodos.length < 1) return;

      const primero = todosLosNodos[0];
      const ultimo = todosLosNodos[todosLosNodos.length - 1];

      const rectFila = wrapper.getBoundingClientRect();
      const rectPrimero = primero.getBoundingClientRect();
      const rectUltimo = ultimo.getBoundingClientRect();

      const soloUnNodo = todosLosNodos.length === 1;

      const xUltimo = soloUnNodo
        ? rectUltimo.left + rectUltimo.width * 0.78 - rectFila.left
        : rectUltimo.left + rectUltimo.width / 2 - rectFila.left;
      const xPrimero = soloUnNodo
        ? rectPrimero.left + rectPrimero.width * 0.22 - rectFila.left
        : rectPrimero.left + rectPrimero.width / 2 - rectFila.left;

      const yArriba = rectUltimo.top - rectFila.top;
      const yAbajo = rectUltimo.bottom - rectFila.top;
      const altura = soloUnNodo ? 34 : 46;

      // Curva de arriba: next del último → head (entra por arriba del primero)
      svgArriba = construirCurva(xUltimo, xPrimero, yArriba, altura, true);
      svgArriba.setAttribute("width", rectFila.width);
      svgArriba.setAttribute("height", yArriba + 4);
      svgArriba.style.top = "0px";
      wrapper.appendChild(svgArriba);

      // Curva de abajo: prev del head → último (entra por abajo del último)
      svgAbajo = construirCurva(xPrimero, xUltimo, 0, altura, false);
      svgAbajo.setAttribute("width", rectFila.width);
      svgAbajo.setAttribute("height", altura + 4);
      svgAbajo.style.top = yAbajo + "px";
      wrapper.appendChild(svgAbajo);
    }

    window.addEventListener("resize", () => {
      if (fila.querySelector(".lista-nodo")) dibujarCurvasCirculares();
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
      player.cargarPasos([{ descripcion: mensaje, aplicar: () => pintar() }]);
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
          descripcion: `La lista está vacía: el nuevo nodo (${valor}) se enlaza a sí mismo (next y prev apuntan a sí mismo) y se convierte en head.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 3); },
        });
        pasos.push({
          descripcion: `head ahora apunta al nuevo nodo.`,
          aplicar: () => {
            nodos.unshift(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 5);
          },
        });
      } else {
        pasos.push({
          descripcion: `Se ubica el último nodo (${nodos[nodos.length - 1]}) a través de head.prev, ya que la lista es circular.`,
          aplicar: () => { pintar({ activos: [nodos.length - 1] }); pintarCodigo(codigo, 8); },
        });

        pasos.push({
          descripcion: `El nuevo nodo (${valor}) se enlaza: su next apunta al head actual, y su prev apunta al último nodo.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 10); },
        });

        pasos.push({
          descripcion: `Se reconecta: el último nodo apunta su next al nuevo nodo, y el head actual apunta su prev al nuevo nodo.`,
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
          descripcion: `head ahora apunta al nuevo nodo.`,
          aplicar: () => {
            nodos.push(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 5);
          },
        });
      } else {
        pasos.push({
          descripcion: `Se ubica el último nodo actual (${nodos[nodos.length - 1]}) a través de head.prev.`,
          aplicar: () => { pintar({ activos: [nodos.length - 1] }); pintarCodigo(codigo, 8); },
        });

        pasos.push({
          descripcion: `El último nodo enlaza su next hacia el nuevo nodo (${valor}), y el nuevo nodo enlaza su prev hacia el último.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 10); },
        });

        pasos.push({
          descripcion: `El nuevo nodo enlaza su next hacia head, y head enlaza su prev hacia el nuevo nodo, cerrando el ciclo.`,
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
          descripcion: `Lista circular doble vacía.`,
          aplicar: () => {
            nodos.shift();
            pintar();
            pintarCodigo(codigo, 3);
          },
        });
      } else {
        pasos.push({
          descripcion: `Se eliminará el head actual (valor ${valorHead}). Se ubica el último nodo (head.prev) y el nuevo head (head.next).`,
          aplicar: () => { pintar({ activos: [0, nodos.length - 1] }); pintarCodigo(codigo, 6); },
        });

        pasos.push({
          descripcion: `Se reconectan los punteros: el último nodo apunta su next al nuevo head, y el nuevo head apunta su prev al último.`,
          aplicar: () => { pintar({ activos: [1] }); pintarCodigo(codigo, 9); },
        });

        pasos.push({
          descripcion: `head ahora apunta al nodo ${nodos[1]}, cerrando el ciclo sin el nodo eliminado.`,
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
      if (nodos.length === 0) return avisar("⚠ La lista circular doble está vacía.");

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
          descripcion: "Lista circular doble reiniciada a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Lista circular doble inicial con ${nodos.length} nodos. head apunta a ${nodos[0]}. El último nodo conecta su next hacia head, y head conecta su prev hacia el último.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});