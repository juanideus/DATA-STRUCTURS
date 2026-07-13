/* =========================================================
   MÓDULO: Árbol General (N-ario sin límite fijo)
   Se integra con app.js a través de registrarModulo(id, definicion)
   Cada nodo puede tener cualquier cantidad de hijos.
   ========================================================= */

registrarModulo("arbol-general", {
  nombre: "Árbol General",
  complejidad: "Inserción: O(1) (con padre conocido) · Recorridos: O(n)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Modelo de datos: nodos reales con id, valor e hijos
    // ---------------------------------------------------
    let contadorId = 0;
    function crearNodo(valor) {
      return { id: contadorId++, valor, hijos: [] };
    }

    let raiz = crearNodo(1);
    raiz.hijos.push(crearNodo(2));
    raiz.hijos.push(crearNodo(3));
    raiz.hijos.push(crearNodo(4));
    raiz.hijos[0].hijos.push(crearNodo(5));
    raiz.hijos[0].hijos.push(crearNodo(6));
    raiz.hijos[2].hijos.push(crearNodo(7));

    const CAPACIDAD_MAX = 16;

    function contarNodos(nodo) {
      if (!nodo) return 0;
      return 1 + nodo.hijos.reduce((acc, h) => acc + contarNodos(h), 0);
    }

    function buscarNodoPorId(nodo, id) {
      if (!nodo) return null;
      if (nodo.id === id) return nodo;
      for (const hijo of nodo.hijos) {
        const encontrado = buscarNodoPorId(hijo, id);
        if (encontrado) return encontrado;
      }
      return null;
    }

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      insertar: [
        "class Nodo {",
        "    int valor;",
        "    List<Nodo> hijos;",
        "}",
        "",
        "void insertarHijo(Nodo padre, int valor) {",
        "    Nodo nuevo = new Nodo(valor);",
        "    padre.hijos.add(nuevo);",
        "}",
      ],
      preorden: [
        "void preorden(Nodo nodo) {",
        "    if (nodo == null) return;",
        "    visitar(nodo);",
        "    for (Nodo hijo : nodo.hijos) {",
        "        preorden(hijo);",
        "    }",
        "}",
      ],
      postorden: [
        "void postorden(Nodo nodo) {",
        "    if (nodo == null) return;",
        "    for (Nodo hijo : nodo.hijos) {",
        "        postorden(hijo);",
        "    }",
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
        "        for (Nodo hijo : actual.hijos) {",
        "            cola.add(hijo);",
        "        }",
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
    // Layout: calcula posición (x, y) de cada nodo
    // Algoritmo simple tipo "reingold-tilford" reducido:
    // los hijos se reparten el ancho ocupado por sus hojas.
    // ---------------------------------------------------
    const ANCHO_HOJA = 70;
    const ALTO_NIVEL = 90;

    function calcularLayout(nodo) {
      const posiciones = new Map();
      let cursorX = 0;

      function asignar(nodo, profundidad) {
        if (nodo.hijos.length === 0) {
          const x = cursorX * ANCHO_HOJA + ANCHO_HOJA / 2;
          cursorX++;
          posiciones.set(nodo.id, { x, y: profundidad * ALTO_NIVEL, nodo });
          return x;
        }
        const xHijos = nodo.hijos.map((h) => asignar(h, profundidad + 1));
        const x = (xHijos[0] + xHijos[xHijos.length - 1]) / 2;
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

      // SVG con las líneas padre-hijo
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "arbol-svg");
      svg.setAttribute("width", ancho);
      svg.setAttribute("height", alto + 40);

      posiciones.forEach((pPadre) => {
        pPadre.nodo.hijos.forEach((hijo) => {
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

      // Nodos posicionados de forma absoluta sobre el SVG
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
      <input type="number" id="arbol-input-padre" placeholder="ID del padre" />
      <input type="number" id="arbol-input-valor" placeholder="Valor" />
      <button id="btn-insertar">Insertar hijo</button>
      <button id="btn-preorden">Preorden</button>
      <button id="btn-postorden">Postorden</button>
      <button id="btn-bfs">Por niveles (BFS)</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputPadre = controles.querySelector("#arbol-input-padre");
    const inputValor = controles.querySelector("#arbol-input-valor");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function leerIdPadre() {
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
    // Operación: Insertar hijo
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar").addEventListener("click", () => {
      const valor = leerValor();
      const idPadre = leerIdPadre();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (idPadre === null) return avisar("⚠ Ingresa el ID del nodo padre (lo ves dentro de cada nodo dibujado, es el mismo valor mostrado).");
      if (contarNodos(raiz) >= CAPACIDAD_MAX) return avisar("⚠ El árbol alcanzó su capacidad máxima de visualización.");

      const padre = encontrarPorValorMostrado(idPadre);
      if (!padre) return avisar(`⚠ No se encontró ningún nodo con valor ${idPadre} para usar como padre.`);

      const codigo = PSEUDOCODIGO.insertar;
      const pasos = [];

      pasos.push({
        descripcion: `Se creará un nuevo nodo con valor ${valor}.`,
        aplicar: () => { pintar({ activos: [padre.id] }); pintarCodigo(codigo, 6); },
      });

      pasos.push({
        descripcion: `El nuevo nodo se agrega a la lista de hijos del nodo ${padre.valor}.`,
        aplicar: () => {
          const nuevo = crearNodo(valor);
          padre.hijos.push(nuevo);
          pintar({ nuevo: nuevo.id });
          pintarCodigo(codigo, 7);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
      inputPadre.value = "";
    });

    // Busca un nodo por el valor que se muestra en pantalla (UX: el usuario
    // identifica nodos por su valor visible, no por el id interno).
    function encontrarPorValorMostrado(valor) {
      let resultado = null;
      function recorrer(nodo) {
        if (resultado) return;
        if (nodo.valor === valor) { resultado = nodo; return; }
        nodo.hijos.forEach(recorrer);
      }
      recorrer(raiz);
      return resultado;
    }

    // ---------------------------------------------------
    // Operación: Preorden (raíz, luego cada hijo en orden)
    // ---------------------------------------------------
    controles.querySelector("#btn-preorden").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.preorden;
      const pasos = [];
      const visitados = [];
      const orden = [];

      function recorrer(nodo) {
        pasos.push({
          descripcion: `Se visita el nodo ${nodo.valor} (preorden: primero el nodo, luego sus hijos).`,
          aplicar: () => {
            visitados.push(nodo.id);
            orden.push(nodo.valor);
            pintar({ activos: [nodo.id], visitados: visitados.filter((id) => id !== nodo.id) });
            pintarCodigo(codigo, 2);
          },
        });
        nodo.hijos.forEach((hijo) => recorrer(hijo));
      }
      recorrer(raiz);

      pasos.push({
        descripcion: `Recorrido preorden completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 1); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Postorden (cada hijo en orden, luego la raíz)
    // ---------------------------------------------------
    controles.querySelector("#btn-postorden").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.postorden;
      const pasos = [];
      const visitados = [];
      const orden = [];

      function recorrer(nodo) {
        nodo.hijos.forEach((hijo) => recorrer(hijo));
        pasos.push({
          descripcion: `Se visita el nodo ${nodo.valor} (postorden: después de visitar todos sus hijos).`,
          aplicar: () => {
            visitados.push(nodo.id);
            orden.push(nodo.valor);
            pintar({ activos: [nodo.id], visitados: visitados.filter((id) => id !== nodo.id) });
            pintarCodigo(codigo, 5);
          },
        });
      }
      recorrer(raiz);

      pasos.push({
        descripcion: `Recorrido postorden completo: [${orden.join(", ")}]`,
        aplicar: () => { pintar({ visitados: [...visitados] }); pintarCodigo(codigo, 1); },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: BFS (por niveles)
    // ---------------------------------------------------
    controles.querySelector("#btn-bfs").addEventListener("click", () => {
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
          descripcion: `Se desencola y visita el nodo ${actual.valor}. Sus hijos se encolan a continuación.`,
          aplicar: () => {
            visitados.push(actual.id);
            orden.push(actual.valor);
            pintar({ activos: [actual.id], visitados: visitados.filter((id) => id !== actual.id) });
            pintarCodigo(codigo, 5);
          },
        });
        actual.hijos.forEach((hijo) => cola.push(hijo));
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
      raiz = crearNodo(1);
      raiz.hijos.push(crearNodo(2));
      raiz.hijos.push(crearNodo(3));
      raiz.hijos.push(crearNodo(4));
      raiz.hijos[0].hijos.push(crearNodo(5));
      raiz.hijos[0].hijos.push(crearNodo(6));
      raiz.hijos[2].hijos.push(crearNodo(7));

      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Árbol general reiniciado a su estructura inicial.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Árbol general inicial con ${contarNodos(raiz)} nodos. La raíz es ${raiz.valor}. Para insertar, usa el valor de un nodo existente como "ID del padre".`,
        aplicar: () => pintar(),
      },
    ]);
  },
});