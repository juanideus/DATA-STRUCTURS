/* =========================================================
   MÓDULO: Árbol B+ (orden 4)
   Se integra con app.js a través de registrarModulo(id, definicion)
   - Máx 3 claves / 4 hijos por nodo.
   - Las claves internas solo guían la búsqueda.
   - Todos los valores reales viven en las hojas, enlazadas entre sí.
   ========================================================= */

registrarModulo("bplus-tree", {
  nombre: "Árbol B+ (orden 4)",
  complejidad: "Inserción/Búsqueda/Eliminación: O(log n)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Configuración del orden del árbol
    // ---------------------------------------------------
    const ORDEN = 4;
    const MAX_CLAVES = ORDEN - 1; // 3
    const MIN_CLAVES = Math.ceil(ORDEN / 2) - 1; // 1
    const CAPACIDAD_MAX = 24;

    let contadorId = 0;
    function crearNodo(esHoja) {
      return { id: contadorId++, esHoja, claves: [], hijos: [], siguiente: null, padre: null };
    }

    let raiz = crearNodo(true);

    function contarClavesTotal(nodo) {
      if (!nodo) return 0;
      if (nodo.esHoja) return nodo.claves.length;
      return nodo.hijos.reduce((acc, h) => acc + contarClavesTotal(h), 0);
    }

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java (representativo; un B+ real usa más estructuras
    // auxiliares, pero esto refleja la lógica esencial)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      buscar: [
        "Nodo buscarHoja(Nodo nodo, int clave) {",
        "    if (nodo.esHoja) return nodo;",
        "    int i = 0;",
        "    while (i < nodo.claves.size() &&",
        "           clave >= nodo.claves.get(i)) i++;",
        "    return buscarHoja(nodo.hijos.get(i), clave);",
        "}",
      ],
      insertar: [
        "void insertar(int clave) {",
        "    Nodo hoja = buscarHoja(raiz, clave);",
        "    insertarOrdenado(hoja.claves, clave);",
        "    if (hoja.claves.size() > MAX_CLAVES) {",
        "        dividir(hoja);",
        "    }",
        "}",
      ],
      dividirHoja: [
        "void dividirHoja(Nodo hoja) {",
        "    int mid = ceil(hoja.claves.size() / 2.0);",
        "    Nodo nueva = new Nodo(esHoja=true);",
        "    nueva.claves = hoja.claves.subList(mid, fin);",
        "    nueva.siguiente = hoja.siguiente;",
        "    hoja.siguiente = nueva;",
        "    promoverClave(nueva.claves.get(0), hoja, nueva);",
        "}",
      ],
      dividirInterno: [
        "void dividirInterno(Nodo nodo) {",
        "    int mid = nodo.claves.size() / 2;",
        "    int claveSubida = nodo.claves.get(mid);",
        "    Nodo nuevo = new Nodo(esHoja=false);",
        "    nuevo.claves = nodo.claves.subList(mid+1, fin);",
        "    nuevo.hijos = nodo.hijos.subList(mid+1, fin);",
        "    promoverClave(claveSubida, nodo, nuevo);",
        "}",
      ],
      eliminar: [
        "void eliminar(int clave) {",
        "    Nodo hoja = buscarHoja(raiz, clave);",
        "    hoja.claves.remove(clave);",
        "    if (hoja != raiz) rebalancear(hoja);",
        "}",
      ],
      rebalancear: [
        "void rebalancear(Nodo nodo) {",
        "    if (nodo.claves.size() >= MIN_CLAVES) return;",
        "    Nodo izq = hermanoIzquierdo(nodo);",
        "    Nodo der = hermanoDerecho(nodo);",
        "    if (izq != null && izq.claves.size() > MIN_CLAVES) {",
        "        redistribuirDesde(izq, nodo);",
        "    } else if (der != null && der.claves.size() > MIN_CLAVES) {",
        "        redistribuirDesde(der, nodo);",
        "    } else {",
        "        fusionar(nodo, izq != null ? izq : der);",
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

    // =====================================================
    // LÓGICA REAL DEL B+ TREE (validada de forma aislada)
    // =====================================================
    function buscarHoja(nodo, clave) {
      if (nodo.esHoja) return nodo;
      let i = 0;
      while (i < nodo.claves.length && clave >= nodo.claves[i]) i++;
      return buscarHoja(nodo.hijos[i], clave);
    }

    function insertarEnHojaOrdenado(hoja, clave) {
      let i = 0;
      while (i < hoja.claves.length && hoja.claves[i] < clave) i++;
      hoja.claves.splice(i, 0, clave);
    }

    function dividirHoja(hoja) {
      const mid = Math.ceil(hoja.claves.length / 2);
      const nueva = crearNodo(true);
      nueva.claves = hoja.claves.splice(mid);
      nueva.siguiente = hoja.siguiente;
      hoja.siguiente = nueva;
      return { claveSubida: nueva.claves[0], nuevoNodo: nueva };
    }

    function dividirInterno(nodo) {
      const mid = Math.floor(nodo.claves.length / 2);
      const claveSubida = nodo.claves[mid];
      const nuevo = crearNodo(false);
      nuevo.claves = nodo.claves.splice(mid + 1);
      nodo.claves.splice(mid);
      nuevo.hijos = nodo.hijos.splice(mid + 1);
      nuevo.hijos.forEach((h) => (h.padre = nuevo));
      return { claveSubida, nuevoNodo: nuevo };
    }

    // Inserción "silenciosa" (sin animación), usada para construir
    // el árbol inicial y para reiniciar. Reutiliza la misma lógica
    // real de inserción y división en cascada.
    function insertarValorCompleto(valor) {
      const hoja = buscarHoja(raiz, valor);
      if (hoja.claves.includes(valor)) return;
      insertarEnHojaOrdenado(hoja, valor);
      if (hoja.claves.length <= MAX_CLAVES) return;

      let { claveSubida, nuevoNodo } = dividirHoja(hoja);
      let actual = hoja;
      let nuevo = nuevoNodo;

      while (true) {
        const padre = actual.padre;
        if (!padre) {
          const nuevaRaiz = crearNodo(false);
          nuevaRaiz.claves = [claveSubida];
          nuevaRaiz.hijos = [actual, nuevo];
          actual.padre = nuevaRaiz;
          nuevo.padre = nuevaRaiz;
          raiz = nuevaRaiz;
          return;
        }

        const idx = padre.hijos.indexOf(actual);
        padre.claves.splice(idx, 0, claveSubida);
        padre.hijos.splice(idx + 1, 0, nuevo);
        nuevo.padre = padre;

        if (padre.claves.length <= MAX_CLAVES) return;

        const div = dividirInterno(padre);
        claveSubida = div.claveSubida;
        nuevo = div.nuevoNodo;
        actual = padre;
      }
    }

    // Construye el árbol inicial con datos de ejemplo, usando la
    // misma lógica real de inserción (sin animar).
    [10, 20, 30, 40, 50, 60, 70, 80].forEach((v) => insertarValorCompleto(v));

    function indiceEnPadre(nodo) {
      return nodo.padre.hijos.indexOf(nodo);
    }

    function actualizarClaveAncestro(hoja) {
      let actual = hoja;
      const primeraClave = hoja.claves[0];
      if (primeraClave === undefined) return;
      let padre = actual.padre;
      while (padre) {
        const idx = padre.hijos.indexOf(actual);
        if (idx > 0) {
          padre.claves[idx - 1] = primeraClave;
          return;
        }
        actual = padre;
        padre = actual.padre;
      }
    }

    function minimoEnHoja(nodo) {
      while (!nodo.esHoja) nodo = nodo.hijos[0];
      return nodo;
    }

    function rebalancearDesde(nodo) {
      if (nodo === raiz) {
        if (!nodo.esHoja && nodo.claves.length === 0 && nodo.hijos.length === 1) {
          raiz = nodo.hijos[0];
          raiz.padre = null;
        }
        return;
      }

      if (nodo.claves.length >= MIN_CLAVES) {
        if (nodo.esHoja) actualizarClaveAncestro(nodo);
        return;
      }

      const padre = nodo.padre;
      const idx = indiceEnPadre(nodo);
      const hermanoIzq = idx > 0 ? padre.hijos[idx - 1] : null;
      const hermanoDer = idx < padre.hijos.length - 1 ? padre.hijos[idx + 1] : null;

      if (hermanoIzq && hermanoIzq.claves.length > MIN_CLAVES) {
        if (nodo.esHoja) {
          nodo.claves.unshift(hermanoIzq.claves.pop());
          padre.claves[idx - 1] = nodo.claves[0];
        } else {
          nodo.claves.unshift(padre.claves[idx - 1]);
          padre.claves[idx - 1] = hermanoIzq.claves.pop();
          const hijoMovido = hermanoIzq.hijos.pop();
          hijoMovido.padre = nodo;
          nodo.hijos.unshift(hijoMovido);
        }
        return;
      }

      if (hermanoDer && hermanoDer.claves.length > MIN_CLAVES) {
        if (nodo.esHoja) {
          nodo.claves.push(hermanoDer.claves.shift());
          padre.claves[idx] = hermanoDer.claves[0];
        } else {
          nodo.claves.push(padre.claves[idx]);
          padre.claves[idx] = hermanoDer.claves.shift();
          const hijoMovido = hermanoDer.hijos.shift();
          hijoMovido.padre = nodo;
          nodo.hijos.push(hijoMovido);
        }
        return;
      }

      if (hermanoIzq) {
        if (nodo.esHoja) {
          hermanoIzq.claves.push(...nodo.claves);
          hermanoIzq.siguiente = nodo.siguiente;
        } else {
          hermanoIzq.claves.push(padre.claves[idx - 1], ...nodo.claves);
          hermanoIzq.hijos.push(...nodo.hijos);
          nodo.hijos.forEach((h) => (h.padre = hermanoIzq));
        }
        padre.claves.splice(idx - 1, 1);
        padre.hijos.splice(idx, 1);
        rebalancearDesde(padre);
      } else if (hermanoDer) {
        if (nodo.esHoja) {
          nodo.claves.push(...hermanoDer.claves);
          nodo.siguiente = hermanoDer.siguiente;
        } else {
          nodo.claves.push(padre.claves[idx], ...hermanoDer.claves);
          nodo.hijos.push(...hermanoDer.hijos);
          hermanoDer.hijos.forEach((h) => (h.padre = nodo));
        }
        padre.claves.splice(idx, 1);
        padre.hijos.splice(idx + 1, 1);
        rebalancearDesde(padre);
      }
    }

    // =====================================================
    // LAYOUT: posiciones de cada nodo (estilo árbol N-ario)
    // =====================================================
    const ALTO_NIVEL = 100;

    function calcularLayout(nodo) {
      const posiciones = new Map();
      let cursorX = 0;

      function anchoNodo(n) {
        return Math.max(n.claves.length, 1) * 36 + 20;
      }

      function asignar(nodo, profundidad) {
        if (nodo.esHoja) {
          const ancho = anchoNodo(nodo);
          const x = cursorX + ancho / 2;
          cursorX += ancho + 24;
          posiciones.set(nodo.id, { x, y: profundidad * ALTO_NIVEL, nodo, ancho });
          return x;
        }
        const xHijos = nodo.hijos.map((h) => asignar(h, profundidad + 1));
        const x = (xHijos[0] + xHijos[xHijos.length - 1]) / 2;
        const ancho = anchoNodo(nodo);
        posiciones.set(nodo.id, { x, y: profundidad * ALTO_NIVEL, nodo, ancho });
        return x;
      }

      asignar(nodo, 0);

      let maxX = 0;
      let maxY = 0;
      posiciones.forEach((p) => {
        maxX = Math.max(maxX, p.x + p.ancho / 2);
        maxY = Math.max(maxY, p.y);
      });

      return { posiciones, ancho: maxX + 30, alto: maxY + 80 };
    }

    // ---------------------------------------------------
    // Construcción del stage
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "bplus-wrapper";
    stage.appendChild(wrapper);

    function crearCajaNodo(p, resaltados) {
      const nodoEl = document.createElement("div");
      nodoEl.className = "bplus-nodo" + (p.nodo.esHoja ? " bplus-hoja" : " bplus-interno");
      nodoEl.style.left = p.x + "px";
      nodoEl.style.top = p.y + "px";
      nodoEl.style.width = p.ancho + "px";

      if (resaltados.activos && resaltados.activos.includes(p.nodo.id)) {
        nodoEl.classList.add("celda-activa");
      }
      if (resaltados.encontrado === p.nodo.id) {
        nodoEl.classList.add("celda-encontrada");
      }
      if (resaltados.nuevo === p.nodo.id) {
        nodoEl.classList.add("celda-nueva");
      }

      if (p.nodo.claves.length === 0) {
        const vacioEl = document.createElement("div");
        vacioEl.className = "bplus-clave-vacia";
        vacioEl.textContent = "·";
        nodoEl.appendChild(vacioEl);
      } else {
        p.nodo.claves.forEach((clave, i) => {
          const claveEl = document.createElement("div");
          claveEl.className = "bplus-clave";
          if (resaltados.claveActiva && resaltados.claveActiva.nodoId === p.nodo.id && resaltados.claveActiva.indice === i) {
            claveEl.classList.add("bplus-clave-resaltada");
          }
          claveEl.textContent = clave;
          nodoEl.appendChild(claveEl);
        });
      }

      return nodoEl;
    }

    function pintar(resaltados = {}) {
      wrapper.innerHTML = "";

      const { posiciones, ancho, alto } = calcularLayout(raiz);
      wrapper.style.width = ancho + "px";
      wrapper.style.height = alto + 30 + "px";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "arbol-svg");
      svg.setAttribute("width", ancho);
      svg.setAttribute("height", alto + 30);

      // Líneas padre → hijo
      posiciones.forEach((pPadre) => {
        if (pPadre.nodo.esHoja) return;
        pPadre.nodo.hijos.forEach((hijo) => {
          const pHijo = posiciones.get(hijo.id);
          const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
          linea.setAttribute("x1", pPadre.x);
          linea.setAttribute("y1", pPadre.y + 22);
          linea.setAttribute("x2", pHijo.x);
          linea.setAttribute("y2", pHijo.y + 22);
          linea.setAttribute("class", "arbol-linea");
          svg.appendChild(linea);
        });
      });

      // Líneas punteadas entre hojas consecutivas (lista enlazada de hojas)
      posiciones.forEach((p) => {
        if (p.nodo.esHoja && p.nodo.siguiente) {
          const pSig = posiciones.get(p.nodo.siguiente.id);
          if (pSig) {
            const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
            linea.setAttribute("x1", p.x + p.ancho / 2);
            linea.setAttribute("y1", p.y + 22);
            linea.setAttribute("x2", pSig.x - pSig.ancho / 2);
            linea.setAttribute("y2", pSig.y + 22);
            linea.setAttribute("class", "bplus-linea-hojas");
            svg.appendChild(linea);
          }
        }
      });

      wrapper.appendChild(svg);

      posiciones.forEach((p) => {
        wrapper.appendChild(crearCajaNodo(p, resaltados));
      });
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="bplus-input-valor" placeholder="Valor" />
      <button id="btn-insertar">Insertar</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-eliminar">Eliminar</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#bplus-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function avisar(mensaje) {
      player.cargarPasos([{ descripcion: mensaje, aplicar: () => pintar() }]);
    }

    // ---------------------------------------------------
    // Operación: Insertar (con división animada)
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (contarClavesTotal(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");

      const hojaExistente = buscarHoja(raiz, valor);
      if (hojaExistente.claves.includes(valor)) return avisar(`⚠ La clave ${valor} ya existe en el árbol.`);

      const codigoBuscar = PSEUDOCODIGO.buscar;
      const codigoInsertar = PSEUDOCODIGO.insertar;
      const pasos = [];

      // Animar el descenso de búsqueda de la hoja destino
      let actual = raiz;
      const camino = [];
      while (!actual.esHoja) {
        camino.push(actual.id);
        let i = 0;
        while (i < actual.claves.length && valor >= actual.claves[i]) i++;
        pasos.push({
          descripcion: `En el nodo [${actual.claves.join(", ")}]: se elige el hijo #${i} para continuar el descenso.`,
          aplicar: () => { pintar({ activos: [...camino] }); pintarCodigo(codigoBuscar, 4); },
        });
        actual = actual.hijos[i];
      }
      const hoja = actual;

      pasos.push({
        descripcion: `Se llega a la hoja [${hoja.claves.join(", ") || "vacía"}]: aquí se insertará ${valor} en orden.`,
        aplicar: () => { pintar({ activos: [...camino, hoja.id] }); pintarCodigo(codigoInsertar, 2); },
      });

      insertarEnHojaOrdenado(hoja, valor);

      pasos.push({
        descripcion: `Clave ${valor} insertada. La hoja queda: [${hoja.claves.join(", ")}].`,
        aplicar: () => { pintar({ nuevo: hoja.id, activos: [...camino] }); pintarCodigo(codigoInsertar, 2); },
      });

      // Si se excede la capacidad, dividir hacia arriba en cascada
      if (hoja.claves.length > MAX_CLAVES) {
        pasos.push({
          descripcion: `La hoja superó el máximo de ${MAX_CLAVES} claves: debe dividirse.`,
          aplicar: () => { pintar({ activos: [hoja.id] }); pintarCodigo(PSEUDOCODIGO.dividirHoja, 3); },
        });

        const { claveSubida, nuevoNodo } = dividirHoja(hoja);

        pasos.push({
          descripcion: `La hoja se divide en dos: [${hoja.claves.join(", ")}] y [${nuevoNodo.claves.join(", ")}]. La clave ${claveSubida} sube al padre.`,
          aplicar: () => { pintar({ activos: [hoja.id, nuevoNodo.id] }); pintarCodigo(PSEUDOCODIGO.dividirHoja, 5); },
        });

        let nodoActual = hoja;
        let nodoNuevo = nuevoNodo;
        let claveASubir = claveSubida;

        while (true) {
          const padre = nodoActual.padre;

          if (!padre) {
            const nuevaRaiz = crearNodo(false);
            nuevaRaiz.claves = [claveASubir];
            nuevaRaiz.hijos = [nodoActual, nodoNuevo];
            nodoActual.padre = nuevaRaiz;
            nodoNuevo.padre = nuevaRaiz;
            raiz = nuevaRaiz;

            pasos.push({
              descripcion: `No había padre (era la raíz): se crea una nueva raíz con la clave ${claveASubir}.`,
              aplicar: () => { pintar({ nuevo: nuevaRaiz.id }); pintarCodigo(PSEUDOCODIGO.dividirHoja, 6); },
            });
            break;
          }

          const idx = padre.hijos.indexOf(nodoActual);
          padre.claves.splice(idx, 0, claveASubir);
          padre.hijos.splice(idx + 1, 0, nodoNuevo);
          nodoNuevo.padre = padre;

          pasos.push({
            descripcion: `La clave ${claveASubir} se inserta en el nodo padre, junto al nuevo puntero.`,
            aplicar: () => { pintar({ activos: [padre.id] }); pintarCodigo(PSEUDOCODIGO.dividirInterno, 5); },
          });

          if (padre.claves.length <= MAX_CLAVES) break;

          pasos.push({
            descripcion: `El nodo padre también superó el máximo de claves: se divide igualmente.`,
            aplicar: () => { pintar({ activos: [padre.id] }); pintarCodigo(PSEUDOCODIGO.dividirInterno, 1); },
          });

          const div = dividirInterno(padre);
          claveASubir = div.claveSubida;
          nodoNuevo = div.nuevoNodo;
          nodoActual = padre;

          pasos.push({
            descripcion: `División interna: la clave ${claveASubir} sube un nivel más.`,
            aplicar: () => { pintar({ activos: [nodoActual.id, nodoNuevo.id] }); pintarCodigo(PSEUDOCODIGO.dividirInterno, 5); },
          });
        }
      }

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Buscar
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const camino = [];

      let actual = raiz;
      while (!actual.esHoja) {
        camino.push(actual.id);
        let i = 0;
        while (i < actual.claves.length && valor >= actual.claves[i]) i++;
        pasos.push({
          descripcion: `En el nodo [${actual.claves.join(", ")}]: ${valor} dirige hacia el hijo #${i}.`,
          aplicar: () => { pintar({ activos: [...camino] }); pintarCodigo(codigo, 4); },
        });
        actual = actual.hijos[i];
      }

      const encontrado = actual.claves.includes(valor);
      pasos.push({
        descripcion: encontrado
          ? `Se llega a la hoja [${actual.claves.join(", ")}]: la clave ${valor} está presente.`
          : `Se llega a la hoja [${actual.claves.join(", ")}]: la clave ${valor} no está en el árbol.`,
        aplicar: () => {
          if (encontrado) pintar({ encontrado: actual.id, activos: [...camino] });
          else pintar({ activos: [...camino, actual.id] });
          pintarCodigo(codigo, 0);
        },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Eliminar (con redistribución/fusión animada)
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      const hoja = buscarHoja(raiz, valor);
      if (!hoja.claves.includes(valor)) return avisar(`⚠ La clave ${valor} no existe en el árbol.`);

      const codigo = PSEUDOCODIGO.eliminar;
      const codigoReb = PSEUDOCODIGO.rebalancear;
      const pasos = [];

      pasos.push({
        descripcion: `Se localiza la hoja que contiene ${valor}: [${hoja.claves.join(", ")}].`,
        aplicar: () => { pintar({ activos: [hoja.id] }); pintarCodigo(codigo, 1); },
      });

      const idx = hoja.claves.indexOf(valor);
      hoja.claves.splice(idx, 1);

      pasos.push({
        descripcion: `Clave ${valor} eliminada. La hoja queda: [${hoja.claves.join(", ") || "vacía"}].`,
        aplicar: () => { pintar({ activos: [hoja.id] }); pintarCodigo(codigo, 2); },
      });

      if (hoja === raiz) {
        pasos.push({
          descripcion: `La hoja eliminada es la raíz: no se requiere rebalanceo adicional.`,
          aplicar: () => pintar(),
        });
        player.cargarPasos(pasos);
        inputValor.value = "";
        return;
      }

      function rebalancearConPasos(nodo) {
        if (nodo === raiz) {
          if (!nodo.esHoja && nodo.claves.length === 0 && nodo.hijos.length === 1) {
            pasos.push({
              descripcion: `La raíz quedó sin claves y con un solo hijo: ese hijo se convierte en la nueva raíz.`,
              aplicar: () => {
                raiz = nodo.hijos[0];
                raiz.padre = null;
                pintar();
              },
            });
          }
          return;
        }

        if (nodo.claves.length >= MIN_CLAVES) {
          if (nodo.esHoja) actualizarClaveAncestro(nodo);
          pasos.push({
            descripcion: `El nodo [${nodo.claves.join(", ")}] cumple el mínimo de ${MIN_CLAVES} clave(s): no se requiere rebalanceo.`,
            aplicar: () => pintar({ activos: [nodo.id] }),
          });
          return;
        }

        pasos.push({
          descripcion: `El nodo [${nodo.claves.join(", ") || "vacío"}] quedó por debajo del mínimo (${MIN_CLAVES}): se debe rebalancear.`,
          aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigoReb, 1); },
        });

        const padre = nodo.padre;
        const idx2 = indiceEnPadre(nodo);
        const hermanoIzq = idx2 > 0 ? padre.hijos[idx2 - 1] : null;
        const hermanoDer = idx2 < padre.hijos.length - 1 ? padre.hijos[idx2 + 1] : null;

        if (hermanoIzq && hermanoIzq.claves.length > MIN_CLAVES) {
          pasos.push({
            descripcion: `El hermano izquierdo [${hermanoIzq.claves.join(", ")}] tiene de sobra: se redistribuye una clave hacia ${nodo.esHoja ? "la hoja" : "el nodo"}.`,
            aplicar: () => { pintar({ activos: [hermanoIzq.id, nodo.id] }); pintarCodigo(codigoReb, 4); },
          });
          if (nodo.esHoja) {
            nodo.claves.unshift(hermanoIzq.claves.pop());
            padre.claves[idx2 - 1] = nodo.claves[0];
          } else {
            nodo.claves.unshift(padre.claves[idx2 - 1]);
            padre.claves[idx2 - 1] = hermanoIzq.claves.pop();
            const hijoMovido = hermanoIzq.hijos.pop();
            hijoMovido.padre = nodo;
            nodo.hijos.unshift(hijoMovido);
          }
          pasos.push({
            descripcion: `Redistribución completada: [${nodo.claves.join(", ")}].`,
            aplicar: () => pintar({ nuevo: nodo.id }),
          });
          return;
        }

        if (hermanoDer && hermanoDer.claves.length > MIN_CLAVES) {
          pasos.push({
            descripcion: `El hermano derecho [${hermanoDer.claves.join(", ")}] tiene de sobra: se redistribuye una clave hacia ${nodo.esHoja ? "la hoja" : "el nodo"}.`,
            aplicar: () => { pintar({ activos: [hermanoDer.id, nodo.id] }); pintarCodigo(codigoReb, 6); },
          });
          if (nodo.esHoja) {
            nodo.claves.push(hermanoDer.claves.shift());
            padre.claves[idx2] = hermanoDer.claves[0];
          } else {
            nodo.claves.push(padre.claves[idx2]);
            padre.claves[idx2] = hermanoDer.claves.shift();
            const hijoMovido = hermanoDer.hijos.shift();
            hijoMovido.padre = nodo;
            nodo.hijos.push(hijoMovido);
          }
          pasos.push({
            descripcion: `Redistribución completada: [${nodo.claves.join(", ")}].`,
            aplicar: () => pintar({ nuevo: nodo.id }),
          });
          return;
        }

        // Fusión
        if (hermanoIzq) {
          pasos.push({
            descripcion: `Ningún hermano tiene de sobra: se fusiona con el hermano izquierdo [${hermanoIzq.claves.join(", ")}].`,
            aplicar: () => { pintar({ activos: [hermanoIzq.id, nodo.id] }); pintarCodigo(codigoReb, 8); },
          });
          if (nodo.esHoja) {
            hermanoIzq.claves.push(...nodo.claves);
            hermanoIzq.siguiente = nodo.siguiente;
          } else {
            hermanoIzq.claves.push(padre.claves[idx2 - 1], ...nodo.claves);
            hermanoIzq.hijos.push(...nodo.hijos);
            nodo.hijos.forEach((h) => (h.padre = hermanoIzq));
          }
          padre.claves.splice(idx2 - 1, 1);
          padre.hijos.splice(idx2, 1);

          pasos.push({
            descripcion: `Fusión completada: [${hermanoIzq.claves.join(", ")}]. Se continúa verificando el padre.`,
            aplicar: () => pintar(),
          });

          rebalancearConPasos(padre);
        } else if (hermanoDer) {
          pasos.push({
            descripcion: `Ningún hermano tiene de sobra: se fusiona con el hermano derecho [${hermanoDer.claves.join(", ")}].`,
            aplicar: () => { pintar({ activos: [nodo.id, hermanoDer.id] }); pintarCodigo(codigoReb, 8); },
          });
          if (nodo.esHoja) {
            nodo.claves.push(...hermanoDer.claves);
            nodo.siguiente = hermanoDer.siguiente;
          } else {
            nodo.claves.push(padre.claves[idx2], ...hermanoDer.claves);
            nodo.hijos.push(...hermanoDer.hijos);
            hermanoDer.hijos.forEach((h) => (h.padre = nodo));
          }
          padre.claves.splice(idx2, 1);
          padre.hijos.splice(idx2 + 1, 1);

          pasos.push({
            descripcion: `Fusión completada: [${nodo.claves.join(", ")}]. Se continúa verificando el padre.`,
            aplicar: () => pintar(),
          });

          rebalancearConPasos(padre);
        }
      }

      rebalancearConPasos(hoja);

      pasos.push({
        descripcion: `Eliminación de ${valor} completada.`,
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
      raiz = crearNodo(true);
      [10, 20, 30, 40, 50, 60, 70, 80].forEach((v) => insertarValorCompleto(v));

      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        { descripcion: "Árbol B+ reiniciado a su estructura inicial.", aplicar: () => pintar() },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Árbol B+ de orden ${ORDEN} (máx ${MAX_CLAVES} claves por nodo). Las hojas (abajo) están enlazadas entre sí y contienen todos los valores; los nodos internos solo guían la búsqueda.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});