/* =========================================================
   MÓDULO: Árbol Binario (genérico, sin orden BST)
   Se integra con app.js a través de registrarModulo(id, definicion)
   Cada nodo tiene como máximo 2 hijos: izquierdo y derecho.
   ========================================================= */

registrarModulo("arbol-binario", {
  nombre: "Árbol Binario",
  complejidad: "Inserción: O(1) (con padre conocido) · Recorridos: O(n)",

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
      insertarIzq: [
        "class Nodo {",
        "    int valor;",
        "    Nodo izquierdo, derecho;",
        "}",
        "",
        "void insertarIzquierdo(Nodo padre, int valor) {",
        "    padre.izquierdo = new Nodo(valor);",
        "}",
      ],
      insertarDer: [
        "class Nodo {",
        "    int valor;",
        "    Nodo izquierdo, derecho;",
        "}",
        "",
        "void insertarDerecho(Nodo padre, int valor) {",
        "    padre.derecho = new Nodo(valor);",
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
      <input type="number" id="arbol-input-padre" placeholder="Valor del padre" />
      <input type="number" id="arbol-input-valor" placeholder="Valor nuevo" />
      <button id="btn-insertar-izq">Insertar izquierdo</button>
      <button id="btn-insertar-der">Insertar derecho</button>
      <button id="btn-preorden">Preorden</button>
      <button id="btn-inorden">Inorden</button>
      <button id="btn-postorden">Postorden</button>
      <button id="btn-bfs">Por niveles</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputPadre = controles.querySelector("#arbol-input-padre");
    const inputValor = controles.querySelector("#arbol-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function leerValorPadre() {
      const v = Number(inputPadre.value);
      return Number.isFinite(v) && inputPadre.value !== "" ? v : null;
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
    // Operación: Insertar como hijo izquierdo
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-izq").addEventListener("click", () => {
      const valor = leerValor();
      const valorPadre = leerValorPadre();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      if (!raiz) {
        if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima.");
        raiz = crearNodo(valor);
        return player.cargarPasos([
          { descripcion: `El árbol estaba vacío: ${valor} se convierte en la raíz.`, aplicar: () => pintar({ nuevo: raiz.id }) },
        ]);
      }

      if (valorPadre === null) return avisar("⚠ Ingresa el valor del nodo padre.");
      if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");

      const padre = encontrarPorValor(raiz, valorPadre);
      if (!padre) return avisar(`⚠ No se encontró ningún nodo con valor ${valorPadre}.`);
      if (padre.izquierdo) return avisar(`⚠ El nodo ${valorPadre} ya tiene un hijo izquierdo (${padre.izquierdo.valor}).`);

      const codigo = PSEUDOCODIGO.insertarIzq;
      const pasos = [];

      pasos.push({
        descripcion: `Se ubica el nodo padre (${padre.valor}) y se preparará su hijo izquierdo.`,
        aplicar: () => { pintar({ activos: [padre.id] }); pintarCodigo(codigo, 5); },
      });

      pasos.push({
        descripcion: `padre.izquierdo apunta ahora a un nuevo nodo con valor ${valor}.`,
        aplicar: () => {
          const nuevo = crearNodo(valor);
          padre.izquierdo = nuevo;
          pintar({ nuevo: nuevo.id });
          pintarCodigo(codigo, 6);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
      inputPadre.value = "";
    });

    // ---------------------------------------------------
    // Operación: Insertar como hijo derecho
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-der").addEventListener("click", () => {
      const valor = leerValor();
      const valorPadre = leerValorPadre();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");

      if (!raiz) {
        if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima.");
        raiz = crearNodo(valor);
        return player.cargarPasos([
          { descripcion: `El árbol estaba vacío: ${valor} se convierte en la raíz.`, aplicar: () => pintar({ nuevo: raiz.id }) },
        ]);
      }

      if (valorPadre === null) return avisar("⚠ Ingresa el valor del nodo padre.");
      if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");

      const padre = encontrarPorValor(raiz, valorPadre);
      if (!padre) return avisar(`⚠ No se encontró ningún nodo con valor ${valorPadre}.`);
      if (padre.derecho) return avisar(`⚠ El nodo ${valorPadre} ya tiene un hijo derecho (${padre.derecho.valor}).`);

      const codigo = PSEUDOCODIGO.insertarDer;
      const pasos = [];

      pasos.push({
        descripcion: `Se ubica el nodo padre (${padre.valor}) y se preparará su hijo derecho.`,
        aplicar: () => { pintar({ activos: [padre.id] }); pintarCodigo(codigo, 5); },
      });

      pasos.push({
        descripcion: `padre.derecho apunta ahora a un nuevo nodo con valor ${valor}.`,
        aplicar: () => {
          const nuevo = crearNodo(valor);
          padre.derecho = nuevo;
          pintar({ nuevo: nuevo.id });
          pintarCodigo(codigo, 6);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
      inputPadre.value = "";
    });

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
        descripcion: `Árbol binario inicial con ${contarNodos(raiz)} nodos. La raíz es ${raiz.valor}. Indica el valor del padre y si quieres insertar a la izquierda o derecha.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});