/* =========================================================
   MÓDULO: Skip List
   Se integra con app.js a través de registrarModulo(id, definicion)
   Lista enlazada con múltiples niveles; cada nodo se "promueve"
   a un nivel superior con probabilidad 50% (algoritmo de Pugh).
   ========================================================= */

registrarModulo("skip-list", {
  nombre: "Skip List",
  complejidad: "Búsqueda/Inserción/Eliminación: O(log n) esperado",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Configuración
    // ---------------------------------------------------
    const MAX_NIVEL = 4; // niveles 0..3
    const PROBABILIDAD = 0.5;
    const CAPACIDAD_MAX = 16;

    let contadorId = 0;
    function crearNodo(valor, nivel) {
      return { id: contadorId++, valor, siguiente: new Array(nivel + 1).fill(null), nivel };
    }

    function nivelAleatorio() {
      let nivel = 0;
      while (Math.random() < PROBABILIDAD && nivel < MAX_NIVEL - 1) nivel++;
      return nivel;
    }

    // Inserción con nivel forzado (no aleatorio), usada solo para
    // construir un estado inicial/demo que siempre luzca repartido
    // en varios niveles. Las inserciones del usuario sí son 100% azar.
    function insertarConNivelFijo(valor, nivelForzado) {
      const actualizar = new Array(MAX_NIVEL).fill(cabeza);
      let actual = cabeza;
      for (let i = nivelActual; i >= 0; i--) {
        while (actual.siguiente[i] && actual.siguiente[i].valor < valor) actual = actual.siguiente[i];
        actualizar[i] = actual;
      }
      if (nivelForzado > nivelActual) {
        for (let i = nivelActual + 1; i <= nivelForzado; i++) actualizar[i] = cabeza;
        nivelActual = nivelForzado;
      }
      const nuevo = crearNodo(valor, nivelForzado);
      for (let i = 0; i <= nivelForzado; i++) {
        nuevo.siguiente[i] = actualizar[i].siguiente[i];
        actualizar[i].siguiente[i] = nuevo;
      }
    }

    // Datos de ejemplo con niveles fijos, garantizando que la demo
    // siempre se vea repartida en los 4 niveles desde el primer render.
    const DATOS_INICIALES = [
      { valor: 3, nivel: 0 },
      { valor: 5, nivel: 3 },
      { valor: 9, nivel: 2 },
      { valor: 14, nivel: 1 },
      { valor: 17, nivel: 0 },
      { valor: 20, nivel: 2 },
    ];

    function construirEstadoInicial() {
      DATOS_INICIALES.forEach(({ valor, nivel }) => insertarConNivelFijo(valor, nivel));
    }

    // Nodo cabecera: existe en todos los niveles, no tiene valor real (-∞)
    let nivelActual = 0;
    let cabeza = crearNodo(-Infinity, MAX_NIVEL - 1);

    function contarNodos() {
      let n = 0;
      let actual = cabeza.siguiente[0];
      while (actual) { n++; actual = actual.siguiente[0]; }
      return n;
    }

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      buscar: [
        "Nodo buscar(int valor) {",
        "    Nodo actual = cabeza;",
        "    for (int i = nivelActual; i >= 0; i--) {",
        "        while (actual.next[i] != null &&",
        "               actual.next[i].valor < valor) {",
        "            actual = actual.next[i];",
        "        }",
        "    }",
        "    actual = actual.next[0];",
        "    if (actual != null && actual.valor == valor) return actual;",
        "    return null;",
        "}",
      ],
      insertar: [
        "void insertar(int valor) {",
        "    Nodo[] actualizar = new Nodo[MAX_NIVEL];",
        "    Nodo actual = cabeza;",
        "    for (int i = nivelActual; i >= 0; i--) {",
        "        while (actual.next[i] != null &&",
        "               actual.next[i].valor < valor) {",
        "            actual = actual.next[i];",
        "        }",
        "        actualizar[i] = actual;",
        "    }",
        "    int nivelNuevo = nivelAleatorio();",
        "    Nodo nuevo = new Nodo(valor, nivelNuevo);",
        "    for (int i = 0; i <= nivelNuevo; i++) {",
        "        nuevo.next[i] = actualizar[i].next[i];",
        "        actualizar[i].next[i] = nuevo;",
        "    }",
        "}",
      ],
      eliminar: [
        "void eliminar(int valor) {",
        "    Nodo[] actualizar = new Nodo[MAX_NIVEL];",
        "    Nodo actual = cabeza;",
        "    for (int i = nivelActual; i >= 0; i--) {",
        "        while (actual.next[i] != null &&",
        "               actual.next[i].valor < valor) {",
        "            actual = actual.next[i];",
        "        }",
        "        actualizar[i] = actual;",
        "    }",
        "    actual = actual.next[0];",
        "    if (actual == null || actual.valor != valor) return;",
        "    for (int i = 0; i <= nivelActual; i++) {",
        "        if (actualizar[i].next[i] != actual) break;",
        "        actualizar[i].next[i] = actual.next[i];",
        "    }",
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
    // Construcción del stage: una fila por nivel (de arriba=más
    // alto hacia abajo=nivel 0), con nodos alineados por columna.
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "skip-wrapper";
    stage.appendChild(wrapper);

    function listaOrdenadaValores() {
      const out = [];
      let actual = cabeza.siguiente[0];
      while (actual) { out.push(actual); actual = actual.siguiente[0]; }
      return out;
    }

    function pintar(resaltados = {}) {
      wrapper.innerHTML = "";

      const nodos = listaOrdenadaValores();

      const filaTabla = document.createElement("div");
      filaTabla.className = "skip-tabla";

      // Una fila visual por nivel, de MAX_NIVEL-1 (arriba) a 0 (abajo)
      for (let nivel = MAX_NIVEL - 1; nivel >= 0; nivel--) {
        const fila = document.createElement("div");
        fila.className = "skip-fila";

        const etiquetaNivel = document.createElement("div");
        etiquetaNivel.className = "skip-etiqueta-nivel";
        etiquetaNivel.textContent = `Nivel ${nivel}`;
        fila.appendChild(etiquetaNivel);

        const pista = document.createElement("div");
        pista.className = "skip-pista";

        // Cabecera (HEAD) — presente en todos los niveles
        const headEl = document.createElement("div");
        headEl.className = "skip-nodo skip-head";
        if (nivel > nivelActual) headEl.classList.add("skip-nodo-inactivo");
        if (resaltados.activos && resaltados.activos.includes("head-" + nivel)) {
          headEl.classList.add("celda-activa");
        }
        headEl.textContent = "HEAD";
        pista.appendChild(headEl);

        nodos.forEach((nodo) => {
          if (nodo.nivel >= nivel && nivel <= nivelActual) {
            const nodoEl = document.createElement("div");
            nodoEl.className = "skip-nodo";

            if (resaltados.activos && resaltados.activos.includes(nodo.id + "-" + nivel)) {
              nodoEl.classList.add("celda-activa");
            }
            if (resaltados.encontrado === nodo.id) {
              nodoEl.classList.add("celda-encontrada");
            }
            if (resaltados.descartados && resaltados.descartados.includes(nodo.id)) {
              nodoEl.classList.add("celda-descartada");
            }
            if (resaltados.nuevo === nodo.id) {
              nodoEl.classList.add("celda-nueva");
            }

            nodoEl.textContent = nodo.valor;
            pista.appendChild(nodoEl);
          } else {
            // Espaciador invisible para mantener alineación de columnas
            const espaciador = document.createElement("div");
            espaciador.className = "skip-espaciador";
            pista.appendChild(espaciador);
          }
        });

        // NULL final
        const nullEl = document.createElement("div");
        nullEl.className = "skip-nodo skip-null";
        nullEl.textContent = "NULL";
        pista.appendChild(nullEl);

        fila.appendChild(pista);
        filaTabla.appendChild(fila);
      }

      wrapper.appendChild(filaTabla);
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="skip-input-valor" placeholder="Valor" />
      <button id="btn-insertar">Insertar</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-eliminar">Eliminar</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#skip-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function avisar(mensaje) {
      player.cargarPasos([{ descripcion: mensaje, aplicar: () => pintar() }]);
    }

    // ---------------------------------------------------
    // Operación: Buscar
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const descartados = [];

      let actual = cabeza;
      for (let i = nivelActual; i >= 0; i--) {
        const idActual = actual === cabeza ? "head-" + i : actual.id + "-" + i;
        pasos.push({
          descripcion: `En el nivel ${i}, posicionado en ${actual === cabeza ? "HEAD" : actual.valor}.`,
          aplicar: () => { pintar({ activos: [idActual], descartados: [...descartados] }); pintarCodigo(codigo, 2); },
        });

        while (actual.siguiente[i] && actual.siguiente[i].valor < valor) {
          if (actual !== cabeza) descartados.push(actual.id);
          actual = actual.siguiente[i];
          pasos.push({
            descripcion: `${actual.valor} < ${valor}: se avanza horizontalmente en el nivel ${i}.`,
            aplicar: () => { pintar({ activos: [actual.id + "-" + i], descartados: [...descartados] }); pintarCodigo(codigo, 4); },
          });
        }
      }

      const candidato = actual.siguiente[0];
      const encontrado = candidato && candidato.valor === valor;

      pasos.push({
        descripcion: encontrado
          ? `Se desciende al nivel 0: el siguiente nodo es ${candidato.valor}, que coincide con ${valor}.`
          : `Se desciende al nivel 0: ${candidato ? `el siguiente nodo es ${candidato.valor}, no coincide` : "no hay más nodos"}. El valor ${valor} no está en la lista.`,
        aplicar: () => {
          if (encontrado) pintar({ encontrado: candidato.id, descartados: [...descartados] });
          else pintar({ descartados: [...descartados] });
          pintarCodigo(codigo, encontrado ? 9 : 10);
        },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Insertar
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (contarNodos() >= CAPACIDAD_MAX) return avisar("⚠ La lista alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertar;
      const pasos = [];
      const actualizar = new Array(MAX_NIVEL).fill(cabeza);
      const recorridos = [];

      let actual = cabeza;
      for (let i = nivelActual; i >= 0; i--) {
        pasos.push({
          descripcion: `Se busca el punto de inserción en el nivel ${i}.`,
          aplicar: () => { pintar({ activos: [...recorridos] }); pintarCodigo(codigo, 5); },
        });

        while (actual.siguiente[i] && actual.siguiente[i].valor < valor) {
          actual = actual.siguiente[i];
          const idActual = actual.id + "-" + i;
          recorridos.push(idActual);
          pasos.push({
            descripcion: `${actual.valor} < ${valor}: se avanza en el nivel ${i}.`,
            aplicar: () => { pintar({ activos: [...recorridos] }); pintarCodigo(codigo, 6); },
          });
        }
        actualizar[i] = actual;
      }

      const siguienteCero = actual.siguiente[0];
      if (siguienteCero && siguienteCero.valor === valor) {
        return avisar(`⚠ El valor ${valor} ya existe en la Skip List.`);
      }

      const nivelNuevo = nivelAleatorio();
      pasos.push({
        descripcion: `Se determina aleatoriamente el nivel del nuevo nodo (50% de probabilidad por nivel): nivel ${nivelNuevo}.`,
        aplicar: () => { pintar({ activos: [...recorridos] }); pintarCodigo(codigo, 10); },
      });

      if (nivelNuevo > nivelActual) {
        for (let i = nivelActual + 1; i <= nivelNuevo; i++) actualizar[i] = cabeza;
        pasos.push({
          descripcion: `El nuevo nodo supera el nivel actual de la lista: la lista crece hasta el nivel ${nivelNuevo}.`,
          aplicar: () => pintar(),
        });
        nivelActual = nivelNuevo;
      }

      const nuevo = crearNodo(valor, nivelNuevo);
      for (let i = 0; i <= nivelNuevo; i++) {
        nuevo.siguiente[i] = actualizar[i].siguiente[i];
        actualizar[i].siguiente[i] = nuevo;
      }

      pasos.push({
        descripcion: `Nodo ${valor} insertado, presente en los niveles 0 a ${nivelNuevo}.`,
        aplicar: () => { pintar({ nuevo: nuevo.id }); pintarCodigo(codigo, 14); },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Eliminar
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      const codigo = PSEUDOCODIGO.eliminar;
      const pasos = [];
      const actualizar = new Array(MAX_NIVEL).fill(cabeza);
      const recorridos = [];

      let actual = cabeza;
      for (let i = nivelActual; i >= 0; i--) {
        while (actual.siguiente[i] && actual.siguiente[i].valor < valor) {
          actual = actual.siguiente[i];
          recorridos.push(actual.id);
          pasos.push({
            descripcion: `${actual.valor} < ${valor}: se avanza en el nivel ${i} buscando el nodo a eliminar.`,
            aplicar: () => { pintar({ activos: [actual.id + "-" + i], descartados: [...recorridos] }); pintarCodigo(codigo, 4); },
          });
        }
        actualizar[i] = actual;
      }

      const objetivo = actual.siguiente[0];
      if (!objetivo || objetivo.valor !== valor) {
        return avisar(`⚠ El valor ${valor} no existe en la Skip List.`);
      }

      pasos.push({
        descripcion: `Se localiza el nodo ${valor}: se eliminará de todos los niveles en los que aparece.`,
        aplicar: () => { pintar({ activos: [objetivo.id] }); pintarCodigo(codigo, 11); },
      });

      for (let i = 0; i <= nivelActual; i++) {
        if (actualizar[i].siguiente[i] !== objetivo) break;
        actualizar[i].siguiente[i] = objetivo.siguiente[i];
      }

      pasos.push({
        descripcion: `Nodo ${valor} eliminado de todos sus niveles.`,
        aplicar: () => pintar(),
      });

      while (nivelActual > 0 && !cabeza.siguiente[nivelActual]) {
        nivelActual--;
      }

      pasos.push({
        descripcion: `Eliminación completada. La lista mantiene ${nivelActual + 1} nivel(es) activo(s).`,
        aplicar: () => pintar(),
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      contadorId = 0;
      nivelActual = 0;
      cabeza = crearNodo(-Infinity, MAX_NIVEL - 1);
      construirEstadoInicial();

      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        { descripcion: "Skip List reiniciada a su estructura inicial.", aplicar: () => pintar() },
      ]);
    });

    // ---------------------------------------------------
    // Construcción inicial (silenciosa, niveles fijos para demo)
    // ---------------------------------------------------
    construirEstadoInicial();
    pintar();

    // ---------------------------------------------------
    // Paso inicial
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Skip List inicial con ${contarNodos()} nodos en ${nivelActual + 1} nivel(es), repartidos a propósito para ilustrar la estructura. Las nuevas inserciones sí decidirán su nivel al azar (50% de probabilidad por nivel).`,
        aplicar: () => pintar(),
      },
    ]);
  },
});