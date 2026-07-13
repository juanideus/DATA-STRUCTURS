/* =========================================================
   MÓDULO: Árbol Binario (Binary Search Tree)
   Se integra con app.js a través de registrarModulo(id, definicion)
   Cada nodo: menores a la izquierda, mayores a la derecha.
   ========================================================= */

registrarModulo("arbol-binario", {
  nombre: "Árbol Binario (BST)",
  complejidad: "Inserción/Búsqueda/Eliminación: O(log n) promedio · O(n) peor caso",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Modelo de datos: nodos con id, valor, izquierdo, derecho
    // ---------------------------------------------------
    let contadorId = 0;
    function crearNodo(valor) {
      return { id: contadorId++, valor, izquierdo: null, derecho: null };
    }

    function construirArbolInicial() {
      const r = crearNodo(8);
      r.izquierdo = crearNodo(3);
      r.derecho = crearNodo(12);
      r.izquierdo.izquierdo = crearNodo(1);
      r.izquierdo.derecho = crearNodo(5);
      r.derecho.derecho = crearNodo(15);
      return r;
    }

    let raiz = construirArbolInicial();
    const CAPACIDAD_MAX = 16;

    function contarNodos(nodo) {
      if (!nodo) return 0;
      return 1 + contarNodos(nodo.izquierdo) + contarNodos(nodo.derecho);
    }

    function encontrarPorValor(nodo, valor) {
      if (!nodo) return null;
      if (nodo.valor === valor) return nodo;
      return encontrarPorValor(nodo.izquierdo, valor) || encontrarPorValor(nodo.derecho, valor);
    }

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      insertar: [
        "void insertar(int valor) {",
        "    raiz = insertar(raiz, valor);",
        "}",
        "",
        "Nodo insertar(Nodo nodo, int valor) {",
        "    if (nodo == null) {",
        "        return new Nodo(valor);",
        "    }",
        "    if (valor < nodo.valor) {",
        "        nodo.izquierdo = insertar(nodo.izquierdo, valor);",
        "    } else if (valor > nodo.valor) {",
        "        nodo.derecho = insertar(nodo.derecho, valor);",
        "    }",
        "    return nodo;",
        "}",
      ],
      buscar: [
        "Nodo buscar(Nodo nodo, int valor) {",
        "    if (nodo == null) return null;",
        "    if (valor == nodo.valor) return nodo;",
        "    if (valor < nodo.valor) {",
        "        return buscar(nodo.izquierdo, valor);",
        "    }",
        "    return buscar(nodo.derecho, valor);",
        "}",
      ],
      eliminar: [
        "Nodo eliminar(Nodo nodo, int valor) {",
        "    if (nodo == null) return null;",
        "    if (valor < nodo.valor) {",
        "        nodo.izquierdo = eliminar(nodo.izquierdo, valor);",
        "    } else if (valor > nodo.valor) {",
        "        nodo.derecho = eliminar(nodo.derecho, valor);",
        "    } else {",
        "        if (nodo.izquierdo == null) return nodo.derecho;",
        "        if (nodo.derecho == null) return nodo.izquierdo;",
        "        Nodo sucesor = minimo(nodo.derecho);",
        "        nodo.valor = sucesor.valor;",
        "        nodo.derecho = eliminar(nodo.derecho, sucesor.valor);",
        "    }",
        "    return nodo;",
        "}",
      ],
      preorden: [
        "void preorden(Nodo nodo) {",
        "    if (nodo == null) return;",
        "    visitar(nodo);",
        "    preorden(nodo.izquierdo);",
        "    preorden(nodo.derecho);",
        "}",
      ],
      inorden: [
        "void inorden(Nodo nodo) {",
        "    if (nodo == null) return;",
        "    inorden(nodo.izquierdo);",
        "    visitar(nodo);",
        "    inorden(nodo.derecho);",
        "}",
      ],
      postorden: [
        "void postorden(Nodo nodo) {",
        "    if (nodo == null) return;",
        "    postorden(nodo.izquierdo);",
        "    postorden(nodo.derecho);",
        "    visitar(nodo);",
        "}",
      ],
      bfs: [
        "void porNiveles(Nodo raiz) {",
        "    Queue<Nodo> cola = new LinkedList<>();",
        "    cola.add(raiz);",
        "    while (!cola.isEmpty()) {",
        "        Nodo actual = cola.poll();",
        "        visitar(actual);",
        "        if (actual.izquierdo != null) cola.add(actual.izquierdo);",
        "        if (actual.derecho != null) cola.add(actual.derecho);",
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
    // Layout: posiciones (x, y) usando el método de hojas
    // (idéntico en espíritu al del árbol general, pero con
    // exactamente 2 hijos posibles por nodo).
    // ---------------------------------------------------
    const ANCHO_HOJA = 64;
    const ALTO_NIVEL = 90;

    function calcularLayout(nodo) {
      const posiciones = new Map();
      let cursorX = 0;

      function asignar(nodo, profundidad) {
        if (!nodo) return null;

        const hijos = [nodo.izquierdo, nodo.derecho].filter(Boolean);

        if (hijos.length === 0) {
          const x = cursorX * ANCHO_HOJA + ANCHO_HOJA / 2;
          cursorX++;
          posiciones.set(nodo.id, { x, y: profundidad * ALTO_NIVEL, nodo });
          return x;
        }

        const xIzq = nodo.izquierdo ? asignar(nodo.izquierdo, profundidad + 1) : null;
        const xDer = nodo.derecho ? asignar(nodo.derecho, profundidad + 1) : null;

        let x;
        if (xIzq !== null && xDer !== null) {
          x = (xIzq + xDer) / 2;
        } else if (xIzq !== null) {
          x = xIzq;
        } else {
          x = xDer;
        }

        posiciones.set(nodo.id, { x, y: profundidad * ALTO_NIVEL, nodo });
        return x;
      }

      asignar(nodo, 0);

      let maxX = 0;
      let maxY = 0;
      posiciones.forEach((p) => {
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      return { posiciones, ancho: maxX + ANCHO_HOJA, alto: maxY + 70 };
    }

    // ---------------------------------------------------
    // Construcción del stage (SVG líneas + nodos absolutos)
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "arbol-wrapper";
    stage.appendChild(wrapper);

    function pintar(resaltados = {}) {
      wrapper.innerHTML = "";

      if (!raiz) {
        const vacio = document.createElement("div");
        vacio.className = "array-vacio";
        vacio.textContent = "Árbol vacío";
        wrapper.appendChild(vacio);
        return;
      }

      const { posiciones, ancho, alto } = calcularLayout(raiz);

      wrapper.style.width = ancho + "px";
      wrapper.style.height = alto + 40 + "px";

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "arbol-svg");
      svg.setAttribute("width", ancho);
      svg.setAttribute("height", alto + 40);

      posiciones.forEach((pPadre) => {
        [pPadre.nodo.izquierdo, pPadre.nodo.derecho].forEach((hijo) => {
          if (!hijo) return;
          const pHijo = posiciones.get(hijo.id);
          const linea = document.createElementNS("http://www.w3.org/2000/svg", "line");
          linea.setAttribute("x1", pPadre.x);
          linea.setAttribute("y1", pPadre.y + 24);
          linea.setAttribute("x2", pHijo.x);
          linea.setAttribute("y2", pHijo.y + 24);
          linea.setAttribute("class", "arbol-linea");
          svg.appendChild(linea);
        });
      });

      wrapper.appendChild(svg);

      posiciones.forEach((p) => {
        const nodoEl = document.createElement("div");
        nodoEl.className = "arbol-nodo";
        nodoEl.style.left = p.x + "px";
        nodoEl.style.top = p.y + "px";

        if (resaltados.activos && resaltados.activos.includes(p.nodo.id)) {
          nodoEl.classList.add("celda-activa");
        }
        if (resaltados.visitados && resaltados.visitados.includes(p.nodo.id)) {
          nodoEl.classList.add("celda-descartada");
        }
        if (resaltados.nuevo === p.nodo.id) {
          nodoEl.classList.add("celda-nueva");
        }
        if (p.nodo.id === raiz.id) {
          nodoEl.classList.add("arbol-nodo-raiz");
        }

        const valorEl = document.createElement("div");
        valorEl.className = "array-valor";
        valorEl.textContent = p.nodo.valor;
        nodoEl.appendChild(valorEl);

        wrapper.appendChild(nodoEl);
      });
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="arbol-input-valor" placeholder="Valor" />
      <button id="btn-insertar">Insertar</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-eliminar">Eliminar</button>
      <button id="btn-preorden">Preorden</button>
      <button id="btn-inorden">Inorden</button>
      <button id="btn-postorden">Postorden</button>
      <button id="btn-bfs">Por niveles</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#arbol-input-valor");

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
    // Operación: Insertar (regla BST: menor → izquierda, mayor → derecha)
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertar;
      const pasos = [];

      if (!raiz) {
        pasos.push({
          descripcion: `El árbol está vacío: ${valor} se convierte en la raíz.`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 5); },
        });
        pasos.push({
          descripcion: `raiz apunta ahora al nuevo nodo con valor ${valor}.`,
          aplicar: () => {
            raiz = crearNodo(valor);
            pintar({ nuevo: raiz.id });
            pintarCodigo(codigo, 6);
          },
        });
        player.cargarPasos(pasos);
        inputValor.value = "";
        return;
      }

      // Recorrido animado comparando contra cada nodo, como en el Java real
      let actual = raiz;
      let yaExiste = false;
      while (true) {
        if (valor === actual.valor) {
          yaExiste = true;
          pasos.push({
            descripcion: `El valor ${valor} ya existe en el árbol (nodo ${actual.valor}). Un BST no admite duplicados.`,
            aplicar: () => { pintar({ activos: [actual.id] }); pintarCodigo(codigo, 8); },
          });
          break;
        } else if (valor < actual.valor) {
          pasos.push({
            descripcion: `${valor} < ${actual.valor}: se desciende hacia la izquierda.`,
            aplicar: () => { pintar({ activos: [actual.id] }); pintarCodigo(codigo, 9); },
          });
          if (!actual.izquierdo) {
            const padreFinal = actual;
            pasos.push({
              descripcion: `padre.izquierdo era null: aquí se insertará el nuevo nodo con valor ${valor}.`,
              aplicar: () => {
                const nuevo = crearNodo(valor);
                padreFinal.izquierdo = nuevo;
                pintar({ nuevo: nuevo.id });
                pintarCodigo(codigo, 6);
              },
            });
            break;
          }
          actual = actual.izquierdo;
        } else {
          pasos.push({
            descripcion: `${valor} > ${actual.valor}: se desciende hacia la derecha.`,
            aplicar: () => { pintar({ activos: [actual.id] }); pintarCodigo(codigo, 11); },
          });
          if (!actual.derecho) {
            const padreFinal = actual;
            pasos.push({
              descripcion: `padre.derecho era null: aquí se insertará el nuevo nodo con valor ${valor}.`,
              aplicar: () => {
                const nuevo = crearNodo(valor);
                padreFinal.derecho = nuevo;
                pintar({ nuevo: nuevo.id });
                pintarCodigo(codigo, 6);
              },
            });
            break;
          }
          actual = actual.derecho;
        }
      }

      player.cargarPasos(pasos);
      if (!yaExiste) inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Buscar (regla BST)
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const descartados = [];

      let actual = raiz;
      let encontrado = false;
      while (actual) {
        if (valor === actual.valor) {
          encontrado = true;
          pasos.push({
            descripcion: `${valor} == ${actual.valor}: nodo encontrado.`,
            aplicar: () => { pintar({ encontrado: actual.id, descartados: [...descartados] }); pintarCodigo(codigo, 2); },
          });
          break;
        } else if (valor < actual.valor) {
          pasos.push({
            descripcion: `${valor} < ${actual.valor}: se continúa la búsqueda hacia la izquierda.`,
            aplicar: () => { pintar({ activos: [actual.id], descartados: [...descartados] }); pintarCodigo(codigo, 4); },
          });
          descartados.push(actual.id);
          actual = actual.izquierdo;
        } else {
          pasos.push({
            descripcion: `${valor} > ${actual.valor}: se continúa la búsqueda hacia la derecha.`,
            aplicar: () => { pintar({ activos: [actual.id], descartados: [...descartados] }); pintarCodigo(codigo, 6); },
          });
          descartados.push(actual.id);
          actual = actual.derecho;
        }
      }

      if (!encontrado) {
        pasos.push({
          descripcion: `Se llegó a un puntero null: el valor ${valor} no está en el árbol.`,
          aplicar: () => { pintar({ descartados: [...descartados] }); pintarCodigo(codigo, 1); },
        });
      }

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Eliminar (con los 3 casos clásicos de BST)
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.eliminar;
      const nodoExiste = encontrarPorValor(raiz, valor);
      if (!nodoExiste) return avisar(`⚠ El valor ${valor} no existe en el árbol.`);

      const pasos = [];
      const recorridos = [];

      // Recorrido animado de localización (idéntico en espíritu a buscar)
      let actual = raiz;
      while (actual.valor !== valor) {
        if (valor < actual.valor) {
          pasos.push({
            descripcion: `${valor} < ${actual.valor}: se desciende hacia la izquierda para ubicar el nodo.`,
            aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 2); },
          });
          recorridos.push(actual.id);
          actual = actual.izquierdo;
        } else {
          pasos.push({
            descripcion: `${valor} > ${actual.valor}: se desciende hacia la derecha para ubicar el nodo.`,
            aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 4); },
          });
          recorridos.push(actual.id);
          actual = actual.derecho;
        }
      }

      const sinIzq = !actual.izquierdo;
      const sinDer = !actual.derecho;

      if (sinIzq && sinDer) {
        pasos.push({
          descripcion: `El nodo ${valor} es una hoja (sin hijos): se elimina directamente.`,
          aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 6); },
        });
      } else if (sinIzq) {
        pasos.push({
          descripcion: `El nodo ${valor} solo tiene hijo derecho: ese hijo toma su lugar.`,
          aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 6); },
        });
      } else if (sinDer) {
        pasos.push({
          descripcion: `El nodo ${valor} solo tiene hijo izquierdo: ese hijo toma su lugar.`,
          aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 7); },
        });
      } else {
        // Caso con dos hijos: buscar el sucesor (mínimo del subárbol derecho)
        let sucesor = actual.derecho;
        const caminoSucesor = [];
        while (sucesor.izquierdo) {
          caminoSucesor.push(sucesor.id);
          sucesor = sucesor.izquierdo;
        }

        pasos.push({
          descripcion: `El nodo ${valor} tiene dos hijos: se buscará su sucesor (el mínimo del subárbol derecho).`,
          aplicar: () => { pintar({ activos: [actual.id], descartados: [...recorridos] }); pintarCodigo(codigo, 8); },
        });

        caminoSucesor.forEach((id) => {
          pasos.push({
            descripcion: `Se desciende hacia la izquierda buscando el mínimo del subárbol derecho.`,
            aplicar: () => { pintar({ activos: [id], descartados: [...recorridos, actual.id] }); pintarCodigo(codigo, 8); },
          });
        });

        const valorSucesor = sucesor.valor;
        pasos.push({
          descripcion: `El sucesor es ${valorSucesor}. El valor del nodo ${valor} se reemplaza por ${valorSucesor}.`,
          aplicar: () => {
            actual.valor = valorSucesor;
            pintar({ activos: [actual.id], descartados: [...recorridos] });
            pintarCodigo(codigo, 9);
          },
        });

        pasos.push({
          descripcion: `Finalmente se elimina el nodo sucesor original (${valorSucesor}) de su posición en el subárbol derecho.`,
          aplicar: () => {
            actual.derecho = eliminarNodoInterno(actual.derecho, valorSucesor);
            pintar();
            pintarCodigo(codigo, 10);
          },
        });

        player.cargarPasos(pasos);
        inputValor.value = "";
        return;
      }

      // Casos hoja / un solo hijo: se aplica directo sobre el árbol
      pasos.push({
        descripcion: `Se reconecta el padre del nodo ${valor} con su reemplazo (o con null si era una hoja).`,
        aplicar: () => {
          raiz = eliminarNodoInterno(raiz, valor);
          pintar();
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // Lógica BST de eliminación real, usada internamente tras la animación
    function eliminarNodoInterno(nodo, valor) {
      if (!nodo) return null;
      if (valor < nodo.valor) {
        nodo.izquierdo = eliminarNodoInterno(nodo.izquierdo, valor);
      } else if (valor > nodo.valor) {
        nodo.derecho = eliminarNodoInterno(nodo.derecho, valor);
      } else {
        if (!nodo.izquierdo) return nodo.derecho;
        if (!nodo.derecho) return nodo.izquierdo;
        let sucesor = nodo.derecho;
        while (sucesor.izquierdo) sucesor = sucesor.izquierdo;
        nodo.valor = sucesor.valor;
        nodo.derecho = eliminarNodoInterno(nodo.derecho, sucesor.valor);
      }
      return nodo;
    }

    // ---------------------------------------------------
    // Operación: Preorden
    // ---------------------------------------------------
    controles.querySelector("#btn-preorden").addEventListener("click", () => {
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.preorden;
      const pasos = [];
      const visitados = [];
      const orden = [];

      function recorrer(nodo) {
        if (!nodo) return;
        pasos.push({
          descripcion: `Se visita el nodo ${nodo.valor} (preorden: nodo → izquierdo → derecho).`,
          aplicar: () => {
            visitados.push(nodo.id);
            orden.push(nodo.valor);
            pintar({ activos: [nodo.id], visitados: visitados.filter((id) => id !== nodo.id) });
            pintarCodigo(codigo, 2);
          },
        });
        recorrer(nodo.izquierdo);
        recorrer(nodo.derecho);
      }
      recorrer(raiz);

      pasos.push({
        descripcion: `Recorrido preorden completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 0); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Inorden
    // ---------------------------------------------------
    controles.querySelector("#btn-inorden").addEventListener("click", () => {
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.inorden;
      const pasos = [];
      const visitados = [];
      const orden = [];

      function recorrer(nodo) {
        if (!nodo) return;
        recorrer(nodo.izquierdo);
        pasos.push({
          descripcion: `Se visita el nodo ${nodo.valor} (inorden: izquierdo → nodo → derecho).`,
          aplicar: () => {
            visitados.push(nodo.id);
            orden.push(nodo.valor);
            pintar({ activos: [nodo.id], visitados: visitados.filter((id) => id !== nodo.id) });
            pintarCodigo(codigo, 3);
          },
        });
        recorrer(nodo.derecho);
      }
      recorrer(raiz);

      pasos.push({
        descripcion: `Recorrido inorden completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 0); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Postorden
    // ---------------------------------------------------
    controles.querySelector("#btn-postorden").addEventListener("click", () => {
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.postorden;
      const pasos = [];
      const visitados = [];
      const orden = [];

      function recorrer(nodo) {
        if (!nodo) return;
        recorrer(nodo.izquierdo);
        recorrer(nodo.derecho);
        pasos.push({
          descripcion: `Se visita el nodo ${nodo.valor} (postorden: izquierdo → derecho → nodo).`,
          aplicar: () => {
            visitados.push(nodo.id);
            orden.push(nodo.valor);
            pintar({ activos: [nodo.id], visitados: visitados.filter((id) => id !== nodo.id) });
            pintarCodigo(codigo, 4);
          },
        });
      }
      recorrer(raiz);

      pasos.push({
        descripcion: `Recorrido postorden completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 0); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: BFS (por niveles)
    // ---------------------------------------------------
    controles.querySelector("#btn-bfs").addEventListener("click", () => {
      if (!raiz) return avisar("⚠ El árbol está vacío.");

      const codigo = PSEUDOCODIGO.bfs;
      const pasos = [];
      const visitados = [];
      const orden = [];

      pasos.push({
        descripcion: `Se inicia el recorrido por niveles: se encola la raíz (${raiz.valor}).`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 2); },
      });

      const cola = [raiz];
      while (cola.length > 0) {
        const actual = cola.shift();
        pasos.push({
          descripcion: `Se desencola y visita el nodo ${actual.valor}.`,
          aplicar: () => {
            visitados.push(actual.id);
            orden.push(actual.valor);
            pintar({ activos: [actual.id], visitados: visitados.filter((id) => id !== actual.id) });
            pintarCodigo(codigo, 5);
          },
        });
        if (actual.izquierdo) cola.push(actual.izquierdo);
        if (actual.derecho) cola.push(actual.derecho);
      }

      pasos.push({
        descripcion: `Recorrido por niveles completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 1); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      contadorId = 0;
      raiz = construirArbolInicial();
      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Árbol binario reiniciado a su estructura inicial.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Árbol binario (BST) inicial con ${contarNodos(raiz)} nodos. La raíz es ${raiz.valor}. Solo ingresa un valor: el árbol decide automáticamente si va a la izquierda o derecha.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});