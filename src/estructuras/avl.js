/* =========================================================
   MÓDULO: Árbol AVL
   Se integra con app.js a través de registrarModulo(id, definicion)
   BST auto-balanceado: tras insertar/eliminar se verifica el
   factor de balance de cada ancestro y se rota si es necesario.
   ========================================================= */

registrarModulo("avl", {
  nombre: "Árbol AVL",
  complejidad: "Inserción/Búsqueda/Eliminación: O(log n) garantizado",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Modelo de datos: nodos con id, valor, izquierdo, derecho, altura
    // ---------------------------------------------------
    let contadorId = 0;
    function crearNodo(valor) {
      return { id: contadorId++, valor, izquierdo: null, derecho: null, altura: 1 };
    }

    function altura(nodo) {
      return nodo ? nodo.altura : 0;
    }

    function actualizarAltura(nodo) {
      nodo.altura = 1 + Math.max(altura(nodo.izquierdo), altura(nodo.derecho));
    }

    function factorBalance(nodo) {
      return nodo ? altura(nodo.izquierdo) - altura(nodo.derecho) : 0;
    }

    function construirArbolInicial() {
      // Se construye insertando en orden con la misma lógica AVL,
      // así el árbol inicial ya queda balanceado de forma realista.
      let r = null;
      [30, 15, 45, 10, 20, 40, 50, 5].forEach((v) => {
        r = insertarInterno(r, v);
      });
      return r;
    }

    const CAPACIDAD_MAX = 16;

    function contarNodos(nodo) {
      if (!nodo) return 0;
      return 1 + contarNodos(nodo.izquierdo) + contarNodos(nodo.derecho);
    }

    function encontrarPorValor(nodo, valor) {
      if (!nodo) return null;
      if (nodo.valor === valor) return nodo;
      return valor < nodo.valor
        ? encontrarPorValor(nodo.izquierdo, valor)
        : encontrarPorValor(nodo.derecho, valor);
    }

    // ---------------------------------------------------
    // Rotaciones (lógica real, usada tanto para construir
    // el árbol inicial como para animar inserciones/eliminaciones)
    // ---------------------------------------------------
    function rotarDerecha(y) {
      const x = y.izquierdo;
      const t2 = x.derecho;
      x.derecho = y;
      y.izquierdo = t2;
      actualizarAltura(y);
      actualizarAltura(x);
      return x;
    }

    function rotarIzquierda(x) {
      const y = x.derecho;
      const t2 = y.izquierdo;
      y.izquierdo = x;
      x.derecho = t2;
      actualizarAltura(x);
      actualizarAltura(y);
      return y;
    }

    function balancear(nodo) {
      actualizarAltura(nodo);
      const fb = factorBalance(nodo);

      if (fb > 1) {
        if (factorBalance(nodo.izquierdo) < 0) {
          nodo.izquierdo = rotarIzquierda(nodo.izquierdo); // caso izquierda-derecha
        }
        return rotarDerecha(nodo); // caso izquierda-izquierda
      }
      if (fb < -1) {
        if (factorBalance(nodo.derecho) > 0) {
          nodo.derecho = rotarDerecha(nodo.derecho); // caso derecha-izquierda
        }
        return rotarIzquierda(nodo); // caso derecha-derecha
      }
      return nodo;
    }

    function insertarInterno(nodo, valor) {
      if (!nodo) return crearNodo(valor);
      if (valor < nodo.valor) nodo.izquierdo = insertarInterno(nodo.izquierdo, valor);
      else if (valor > nodo.valor) nodo.derecho = insertarInterno(nodo.derecho, valor);
      else return nodo; // sin duplicados
      return balancear(nodo);
    }

    function minimoNodo(nodo) {
      while (nodo.izquierdo) nodo = nodo.izquierdo;
      return nodo;
    }

    function eliminarInterno(nodo, valor) {
      if (!nodo) return null;
      if (valor < nodo.valor) {
        nodo.izquierdo = eliminarInterno(nodo.izquierdo, valor);
      } else if (valor > nodo.valor) {
        nodo.derecho = eliminarInterno(nodo.derecho, valor);
      } else {
        if (!nodo.izquierdo) return nodo.derecho;
        if (!nodo.derecho) return nodo.izquierdo;
        const sucesor = minimoNodo(nodo.derecho);
        nodo.valor = sucesor.valor;
        nodo.derecho = eliminarInterno(nodo.derecho, sucesor.valor);
      }
      return balancear(nodo);
    }

    let raiz = construirArbolInicial();

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      insertar: [
        "Nodo insertar(Nodo nodo, int valor) {",
        "    if (nodo == null) return new Nodo(valor);",
        "    if (valor < nodo.valor) {",
        "        nodo.izquierdo = insertar(nodo.izquierdo, valor);",
        "    } else if (valor > nodo.valor) {",
        "        nodo.derecho = insertar(nodo.derecho, valor);",
        "    } else return nodo;",
        "    return balancear(nodo);",
        "}",
      ],
      balancear: [
        "Nodo balancear(Nodo nodo) {",
        "    actualizarAltura(nodo);",
        "    int fb = balance(nodo);",
        "    if (fb > 1) {",
        "        if (balance(nodo.izquierdo) < 0) {",
        "            nodo.izquierdo = rotarIzquierda(nodo.izquierdo);",
        "        }",
        "        return rotarDerecha(nodo);",
        "    }",
        "    if (fb < -1) {",
        "        if (balance(nodo.derecho) > 0) {",
        "            nodo.derecho = rotarDerecha(nodo.derecho);",
        "        }",
        "        return rotarIzquierda(nodo);",
        "    }",
        "    return nodo;",
        "}",
      ],
      rotarDerecha: [
        "Nodo rotarDerecha(Nodo y) {",
        "    Nodo x = y.izquierdo;",
        "    Nodo t2 = x.derecho;",
        "    x.derecho = y;",
        "    y.izquierdo = t2;",
        "    return x;",
        "}",
      ],
      rotarIzquierda: [
        "Nodo rotarIzquierda(Nodo x) {",
        "    Nodo y = x.derecho;",
        "    Nodo t2 = y.izquierdo;",
        "    y.izquierdo = x;",
        "    x.derecho = t2;",
        "    return y;",
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
        "        Nodo s = minimo(nodo.derecho);",
        "        nodo.valor = s.valor;",
        "        nodo.derecho = eliminar(nodo.derecho, s.valor);",
        "    }",
        "    return balancear(nodo);",
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
    // Layout (idéntico en espíritu al de BST/Árbol General)
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
        if (xIzq !== null && xDer !== null) x = (xIzq + xDer) / 2;
        else x = xIzq !== null ? xIzq : xDer;

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
        vacio.textContent = "Árbol AVL vacío";
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
        if (resaltados.rotando && resaltados.rotando.includes(p.nodo.id)) {
          nodoEl.classList.add("celda-encontrada");
        }
        if (p.nodo.id === raiz.id) {
          nodoEl.classList.add("arbol-nodo-raiz");
        }

        const valorEl = document.createElement("div");
        valorEl.className = "array-valor";
        valorEl.textContent = p.nodo.valor;
        nodoEl.appendChild(valorEl);

        const fbEl = document.createElement("div");
        fbEl.className = "arbol-factor-balance";
        fbEl.textContent = `fb: ${factorBalance(p.nodo)}`;
        nodoEl.appendChild(fbEl);

        wrapper.appendChild(nodoEl);
      });
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="avl-input-valor" placeholder="Valor" />
      <button id="btn-insertar">Insertar</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-eliminar">Eliminar</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#avl-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function avisar(mensaje) {
      player.cargarPasos([{ descripcion: mensaje, aplicar: () => pintar() }]);
    }

    // Nombre del tipo de rotación, solo para describir el paso al usuario
    function nombreRotacion(fb, fbHijo) {
      if (fb > 1) return fbHijo < 0 ? "izquierda-derecha (doble)" : "izquierda-izquierda (simple)";
      return fbHijo > 0 ? "derecha-izquierda (doble)" : "derecha-derecha (simple)";
    }

    // ---------------------------------------------------
    // Operación: Insertar (BST + rebalanceo animado)
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");
      if (encontrarPorValor(raiz, valor)) return avisar(`⚠ El valor ${valor} ya existe. Un AVL (BST) no admite duplicados.`);

      const codigo = PSEUDOCODIGO.insertar;
      const codigoBal = PSEUDOCODIGO.balancear;
      const pasos = [];
      const camino = [];

      // 1. Descenso BST animado, igual que en arbolBinario.js
      function insertarConPasos(nodo, profundidad) {
        if (!nodo) {
          pasos.push({
            descripcion: `Se llegó a un puntero null: aquí se inserta el nuevo nodo con valor ${valor}.`,
            aplicar: () => { pintar({ activos: [...camino] }); pintarCodigo(codigo, 1); },
          });
          const nuevo = crearNodo(valor);
          pasos.push({
            descripcion: `Nodo ${valor} insertado como hoja.`,
            aplicar: () => { pintar({ nuevo: nuevo.id, activos: [...camino] }); pintarCodigo(codigo, 1); },
          });
          return nuevo;
        }

        if (valor < nodo.valor) {
          pasos.push({
            descripcion: `${valor} < ${nodo.valor}: se desciende a la izquierda.`,
            aplicar: () => { pintar({ activos: [...camino, nodo.id] }); pintarCodigo(codigo, 3); },
          });
          camino.push(nodo.id);
          nodo.izquierdo = insertarConPasos(nodo.izquierdo, profundidad + 1);
        } else {
          pasos.push({
            descripcion: `${valor} > ${nodo.valor}: se desciende a la derecha.`,
            aplicar: () => { pintar({ activos: [...camino, nodo.id] }); pintarCodigo(codigo, 5); },
          });
          camino.push(nodo.id);
          nodo.derecho = insertarConPasos(nodo.derecho, profundidad + 1);
        }
        camino.pop();

        // 2. Rebalanceo: se evalúa el factor de balance al volver de la recursión
        actualizarAltura(nodo);
        const fb = factorBalance(nodo);

        pasos.push({
          descripcion: `Al subir por ${nodo.valor}, se recalcula su altura y factor de balance (fb = ${fb}).`,
          aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigoBal, 2); },
        });

        if (fb > 1 || fb < -1) {
          const hijoCritico = fb > 1 ? nodo.izquierdo : nodo.derecho;
          const fbHijo = factorBalance(hijoCritico);
          const tipoRotacion = nombreRotacion(fb, fbHijo);

          pasos.push({
            descripcion: `¡Desbalance detectado en ${nodo.valor} (fb = ${fb})! Se requiere una rotación ${tipoRotacion}.`,
            aplicar: () => { pintar({ rotando: [nodo.id, hijoCritico.id] }); pintarCodigo(codigoBal, fb > 1 ? 3 : 9); },
          });

          let nuevaRaizSubarbol;
          if (fb > 1 && fbHijo < 0) {
            nodo.izquierdo = rotarIzquierda(nodo.izquierdo);
            pasos.push({
              descripcion: `Rotación izquierda previa sobre ${hijoCritico.valor} (caso doble).`,
              aplicar: () => { pintar({ rotando: [nodo.id] }); pintarCodigo(codigoBal, 4); },
            });
            nuevaRaizSubarbol = rotarDerecha(nodo);
            pasos.push({
              descripcion: `Rotación derecha sobre ${nodo.valor}: ${nuevaRaizSubarbol.valor} sube a esta posición.`,
              aplicar: () => { pintar({ nuevo: nuevaRaizSubarbol.id }); pintarCodigo(codigoBal, 7); },
            });
          } else if (fb > 1) {
            nuevaRaizSubarbol = rotarDerecha(nodo);
            pasos.push({
              descripcion: `Rotación derecha (simple) sobre ${nodo.valor}: ${nuevaRaizSubarbol.valor} sube a esta posición.`,
              aplicar: () => { pintar({ nuevo: nuevaRaizSubarbol.id }); pintarCodigo(codigoBal, 7); },
            });
          } else if (fb < -1 && fbHijo > 0) {
            nodo.derecho = rotarDerecha(nodo.derecho);
            pasos.push({
              descripcion: `Rotación derecha previa sobre ${hijoCritico.valor} (caso doble).`,
              aplicar: () => { pintar({ rotando: [nodo.id] }); pintarCodigo(codigoBal, 10); },
            });
            nuevaRaizSubarbol = rotarIzquierda(nodo);
            pasos.push({
              descripcion: `Rotación izquierda sobre ${nodo.valor}: ${nuevaRaizSubarbol.valor} sube a esta posición.`,
              aplicar: () => { pintar({ nuevo: nuevaRaizSubarbol.id }); pintarCodigo(codigoBal, 13); },
            });
          } else {
            nuevaRaizSubarbol = rotarIzquierda(nodo);
            pasos.push({
              descripcion: `Rotación izquierda (simple) sobre ${nodo.valor}: ${nuevaRaizSubarbol.valor} sube a esta posición.`,
              aplicar: () => { pintar({ nuevo: nuevaRaizSubarbol.id }); pintarCodigo(codigoBal, 13); },
            });
          }

          return nuevaRaizSubarbol;
        }

        return nodo;
      }

      raiz = insertarConPasos(raiz, 0);

      pasos.push({
        descripcion: `Inserción de ${valor} completada. El árbol AVL permanece balanceado (todos los fb entre -1 y 1).`,
        aplicar: () => pintar(),
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Buscar
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
            descripcion: `${valor} < ${actual.valor}: se continúa hacia la izquierda.`,
            aplicar: () => { pintar({ activos: [actual.id], descartados: [...descartados] }); pintarCodigo(codigo, 4); },
          });
          descartados.push(actual.id);
          actual = actual.izquierdo;
        } else {
          pasos.push({
            descripcion: `${valor} > ${actual.valor}: se continúa hacia la derecha.`,
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
    // Operación: Eliminar (con rebalanceo posterior)
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (!raiz) return avisar("⚠ El árbol está vacío.");
      if (!encontrarPorValor(raiz, valor)) return avisar(`⚠ El valor ${valor} no existe en el árbol.`);

      const codigo = PSEUDOCODIGO.eliminar;
      const codigoBal = PSEUDOCODIGO.balancear;
      const pasos = [];

      pasos.push({
        descripcion: `Se eliminará el valor ${valor}. Tras eliminar, se recalculan alturas y se rebalancea cada ancestro si es necesario.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 0); },
      });

      function eliminarConPasos(nodo) {
        if (!nodo) return null;

        if (valor < nodo.valor) {
          pasos.push({
            descripcion: `${valor} < ${nodo.valor}: se desciende a la izquierda buscando el nodo.`,
            aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigo, 2); },
          });
          nodo.izquierdo = eliminarConPasos(nodo.izquierdo);
        } else if (valor > nodo.valor) {
          pasos.push({
            descripcion: `${valor} > ${nodo.valor}: se desciende a la derecha buscando el nodo.`,
            aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigo, 4); },
          });
          nodo.derecho = eliminarConPasos(nodo.derecho);
        } else {
          if (!nodo.izquierdo) {
            pasos.push({
              descripcion: `Nodo ${nodo.valor} encontrado, sin hijo izquierdo: se reemplaza por su hijo derecho.`,
              aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigo, 7); },
            });
            return nodo.derecho;
          }
          if (!nodo.derecho) {
            pasos.push({
              descripcion: `Nodo ${nodo.valor} encontrado, sin hijo derecho: se reemplaza por su hijo izquierdo.`,
              aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigo, 8); },
            });
            return nodo.izquierdo;
          }
          const sucesor = minimoNodo(nodo.derecho);
          pasos.push({
            descripcion: `Nodo ${nodo.valor} tiene dos hijos: su sucesor (mínimo del subárbol derecho) es ${sucesor.valor}.`,
            aplicar: () => { pintar({ activos: [nodo.id], encontrado: sucesor.id }); pintarCodigo(codigo, 9); },
          });
          nodo.valor = sucesor.valor;
          pasos.push({
            descripcion: `El valor de ${valor} se reemplaza por ${sucesor.valor}; ahora se elimina ese sucesor de su posición original.`,
            aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigo, 10); },
          });
          nodo.derecho = eliminarConPasos(nodo.derecho);
        }

        actualizarAltura(nodo);
        const fb = factorBalance(nodo);

        pasos.push({
          descripcion: `Al subir por ${nodo.valor}, se recalcula su factor de balance (fb = ${fb}).`,
          aplicar: () => { pintar({ activos: [nodo.id] }); pintarCodigo(codigoBal, 2); },
        });

        if (fb > 1 || fb < -1) {
          const hijoCritico = fb > 1 ? nodo.izquierdo : nodo.derecho;
          const fbHijo = factorBalance(hijoCritico);
          const tipoRotacion = nombreRotacion(fb, fbHijo);

          pasos.push({
            descripcion: `¡Desbalance detectado en ${nodo.valor} (fb = ${fb})! Se requiere una rotación ${tipoRotacion}.`,
            aplicar: () => { pintar({ rotando: [nodo.id, hijoCritico.id] }); pintarCodigo(codigoBal, fb > 1 ? 3 : 9); },
          });

          let nuevaRaizSubarbol;
          if (fb > 1 && fbHijo < 0) {
            nodo.izquierdo = rotarIzquierda(nodo.izquierdo);
            nuevaRaizSubarbol = rotarDerecha(nodo);
          } else if (fb > 1) {
            nuevaRaizSubarbol = rotarDerecha(nodo);
          } else if (fb < -1 && fbHijo > 0) {
            nodo.derecho = rotarDerecha(nodo.derecho);
            nuevaRaizSubarbol = rotarIzquierda(nodo);
          } else {
            nuevaRaizSubarbol = rotarIzquierda(nodo);
          }

          pasos.push({
            descripcion: `Rotación completada: ${nuevaRaizSubarbol.valor} sube a esta posición del árbol.`,
            aplicar: () => { pintar({ nuevo: nuevaRaizSubarbol.id }); pintarCodigo(codigoBal, 14); },
          });

          return nuevaRaizSubarbol;
        }

        return nodo;
      }

      raiz = eliminarConPasos(raiz);

      pasos.push({
        descripcion: `Eliminación de ${valor} completada. El árbol AVL permanece balanceado.`,
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
      raiz = construirArbolInicial();
      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Árbol AVL reiniciado a su estructura inicial.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Árbol AVL inicial con ${contarNodos(raiz)} nodos, ya balanceado. La raíz es ${raiz.valor}. El factor de balance (fb) de cada nodo se muestra debajo de su valor.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});