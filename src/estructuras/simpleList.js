/* =========================================================
   MÓDULO: Lista Simple (Singly Linked List)
   Se integra con app.js a través de registrarModulo(id, definicion)
   ========================================================= */

registrarModulo("lista-simple", {
  nombre: "Lista Simple (Linked List)",
  complejidad: "Acceso: O(n) · Inserción/Eliminación en cabeza: O(1) · En cola: O(n)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
    // Cada nodo: { valor }. El "next" es implícito por posición en el array.
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
        "    nuevo.next = head;",
        "    head = nuevo;",
        "}",
      ],
      insertarFinal: [
        "void insertarFinal(int valor) {",
        "    Nodo nuevo = new Nodo(valor);",
        "    if (head == null) {",
        "        head = nuevo;",
        "        return;",
        "    }",
        "    Nodo actual = head;",
        "    while (actual.next != null) {",
        "        actual = actual.next;",
        "    }",
        "    actual.next = nuevo;",
        "}",
      ],
      eliminarInicio: [
        "void eliminarInicio() {",
        "    if (head == null) return;",
        "    head = head.next;",
        "}",
      ],
      eliminarValor: [
        "void eliminar(int valor) {",
        "    Nodo actual = head;",
        "    Nodo anterior = null;",
        "    while (actual != null) {",
        "        if (actual.valor == valor) {",
        "            if (anterior == null) head = actual.next;",
        "            else anterior.next = actual.next;",
        "            return;",
        "        }",
        "        anterior = actual;",
        "        actual = actual.next;",
        "    }",
        "}",
      ],
      buscar: [
        "Nodo buscar(int valor) {",
        "    Nodo actual = head;",
        "    while (actual != null) {",
        "        if (actual.valor == valor) {",
        "            return actual;",
        "        }",
        "        actual = actual.next;",
        "    }",
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
    // Construcción del stage (nodos + flechas + NULL final)
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
        vacio.textContent = "Lista vacía (head → NULL)";
        fila.appendChild(vacio);
        return;
      }

      nodos.forEach((valor, i) => {
        const grupo = document.createElement("div");
        grupo.className = "lista-grupo";

        const nodo = document.createElement("div");
        nodo.className = "lista-nodo";

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

        const flecha = document.createElement("div");
        flecha.className = "lista-flecha";
        flecha.textContent = "→";
        grupo.appendChild(flecha);

        fila.appendChild(grupo);
      });

      const nullEl = document.createElement("div");
      nullEl.className = "lista-null";
      nullEl.textContent = "NULL";
      fila.appendChild(nullEl);
    }

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
      <button id="btn-eliminar-valor">Eliminar valor</button>
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

      pasos.push({
        descripcion: `Se crea un nuevo nodo con valor ${valor} y su next apuntará al head actual.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `El nuevo nodo se convierte en el head de la lista.`,
        aplicar: () => {
          nodos.unshift(valor);
          pintar({ nuevo: 0 });
          pintarCodigo(codigo, 3);
        },
      });

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
          descripcion: `La lista está vacía: el nuevo nodo ${valor} se convierte directamente en head.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 3); },
        });
        pasos.push({
          descripcion: `Nodo insertado como head.`,
          aplicar: () => {
            nodos.push(valor);
            pintar({ nuevo: 0 });
            pintarCodigo(codigo, 3);
          },
        });
      } else {
        // Animar el recorrido hasta el último nodo
        for (let i = 0; i < nodos.length; i++) {
          const esUltimo = i === nodos.length - 1;
          pasos.push({
            descripcion: esUltimo
              ? `actual llega al nodo ${nodos[i]}, cuyo next es NULL: aquí se enlazará el nuevo nodo.`
              : `actual avanza al nodo ${nodos[i]} (actual.next != null, se sigue recorriendo).`,
            aplicar: () => { pintar({ activos: [i] }); pintarCodigo(codigo, esUltimo ? 7 : 8); },
          });
        }

        pasos.push({
          descripcion: `Se enlaza: el último nodo apunta ahora a un nuevo nodo con valor ${valor}.`,
          aplicar: () => {
            nodos.push(valor);
            pintar({ nuevo: nodos.length - 1 });
            pintarCodigo(codigo, 10);
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

      pasos.push({
        descripcion: `Se eliminará el head actual (valor ${valorHead}).`,
        aplicar: () => { pintar({ activos: [0] }); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `head ahora apunta a head.next. ${nodos.length > 1 ? `El nuevo head es ${nodos[1]}.` : "La lista queda vacía."}`,
        aplicar: () => {
          nodos.shift();
          pintar();
          pintarCodigo(codigo, 2);
        },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Eliminar por valor
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar-valor").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido para eliminar.");
      if (nodos.length === 0) return avisar("⚠ La lista está vacía.");

      const codigo = PSEUDOCODIGO.eliminarValor;
      const pasos = [];
      const recorridos = [];

      let indiceEncontrado = -1;
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i] === valor) {
          indiceEncontrado = i;
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) == ${valor}: se encontró el nodo a eliminar.`,
            aplicar: () => { pintar({ activos: [i], descartados: [...recorridos] }); pintarCodigo(codigo, 4); },
          });
          break;
        } else {
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) ≠ ${valor}. Se avanza: anterior = actual, actual = actual.next.`,
            aplicar: () => { pintar({ activos: [i], descartados: [...recorridos] }); pintarCodigo(codigo, 7); },
          });
          recorridos.push(i);
        }
      }

      if (indiceEncontrado === -1) {
        pasos.push({
          descripcion: `Se recorrió toda la lista (actual llegó a NULL) y no se encontró el valor ${valor}.`,
          aplicar: () => { pintar({ descartados: [...recorridos] }); pintarCodigo(codigo, 8); },
        });
      } else {
        const eraHead = indiceEncontrado === 0;
        pasos.push({
          descripcion: eraHead
            ? `Como no había nodo anterior, head pasa a apuntar a actual.next.`
            : `anterior.next se reasigna para apuntar a actual.next, saltando el nodo eliminado.`,
          aplicar: () => {
            nodos.splice(indiceEncontrado, 1);
            pintar();
            pintarCodigo(codigo, eraHead ? 5 : 6);
          },
        });
      }

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Buscar valor
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido para buscar.");
      if (nodos.length === 0) return avisar("⚠ La lista está vacía.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const descartados = [];

      pasos.push({
        descripcion: `Se inicia el recorrido desde head buscando el valor ${valor}.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      let encontradoEn = -1;
      for (let i = 0; i < nodos.length; i++) {
        if (nodos[i] === valor) {
          encontradoEn = i;
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) == ${valor}: nodo encontrado.`,
            aplicar: () => { pintar({ encontrado: i, descartados: [...descartados] }); pintarCodigo(codigo, 3); },
          });
          break;
        } else {
          pasos.push({
            descripcion: `actual.valor (${nodos[i]}) ≠ ${valor}. actual = actual.next.`,
            aplicar: () => { pintar({ activos: [i], descartados: [...descartados] }); pintarCodigo(codigo, 4); },
          });
          descartados.push(i);
        }
      }

      if (encontradoEn === -1) {
        pasos.push({
          descripcion: `actual llegó a NULL: el valor ${valor} no está en la lista.`,
          aplicar: () => { pintar({ descartados: [...descartados] }); pintarCodigo(codigo, 6); },
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
          descripcion: "Lista reiniciada a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Lista simple inicial con ${nodos.length} nodos. head apunta a ${nodos[0]}. Usa los controles para insertar, eliminar o buscar.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});