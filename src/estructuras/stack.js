/* =========================================================
   MÓDULO: Pila (Stack)
   Se integra con app.js a través de registrarModulo(id, definicion)
   ========================================================= */

registrarModulo("pila", {
  nombre: "Pila (Stack)",
  complejidad: "Push/Pop/Peek: O(1)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
    // ---------------------------------------------------
    let datos = [10, 25, 8];
    const CAPACIDAD_MAX = 10;

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      push: [
        "void push(int valor) {",
        "    arr[top + 1] = valor;",
        "    top++;",
        "}",
      ],
      pop: [
        "int pop() {",
        "    if (isEmpty()) {",
        "        throw new RuntimeException();",
        "    }",
        "    int valor = arr[top];",
        "    top--;",
        "    return valor;",
        "}",
      ],
      peek: [
        "int peek() {",
        "    if (isEmpty()) {",
        "        throw new RuntimeException();",
        "    }",
        "    return arr[top];",
        "}",
      ],
      isEmpty: [
        "boolean isEmpty() {",
        "    return top == -1;",
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
    // Construcción del stage (visualización vertical)
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "pila-wrapper";

    const columna = document.createElement("div");
    columna.className = "pila-columna";
    wrapper.appendChild(columna);

    stage.appendChild(wrapper);

    function pintar(resaltados = {}) {
      columna.innerHTML = "";

      if (datos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "array-vacio";
        vacio.textContent = "Pila vacía";
        columna.appendChild(vacio);
        return;
      }

      // Se agregan en orden normal (base primero); el CSS (column-reverse)
      // se encarga de que el tope quede visualmente arriba.
      for (let i = 0; i < datos.length; i++) {
        const valor = datos[i];
        const celda = document.createElement("div");
        celda.className = "pila-celda";

        if (resaltados.activos && resaltados.activos.includes(i)) {
          celda.classList.add("celda-activa");
        }
        if (resaltados.descartados && resaltados.descartados.includes(i)) {
          celda.classList.add("celda-descartada");
        }
        if (resaltados.nuevo === i) {
          celda.classList.add("celda-nueva");
        }

        const valorEl = document.createElement("div");
        valorEl.className = "array-valor";
        valorEl.textContent = valor;
        celda.appendChild(valorEl);

        if (i === datos.length - 1) {
          const etiquetaTope = document.createElement("div");
          etiquetaTope.className = "pila-etiqueta-tope";
          etiquetaTope.textContent = "← TOPE";
          celda.appendChild(etiquetaTope);
        }

        columna.appendChild(celda);
      }
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="pila-input-valor" placeholder="Valor" />
      <button id="btn-push">Push</button>
      <button id="btn-pop">Pop</button>
      <button id="btn-peek">Peek</button>
      <button id="btn-isempty">¿Está vacía?</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#pila-input-valor");

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
    // Operación: Push
    // ---------------------------------------------------
    controles.querySelector("#btn-push").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (datos.length >= CAPACIDAD_MAX) return avisar("⚠ La pila alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.push;
      const pasos = [];

      pasos.push({
        descripcion: `Se va a apilar (push) el valor ${valor} sobre el tope actual.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `Push completado: ${valor} es ahora el nuevo tope de la pila.`,
        aplicar: () => {
          datos.push(valor);
          pintar({ nuevo: datos.length - 1 });
          pintarCodigo(codigo, 2);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
    });

    // ---------------------------------------------------
    // Operación: Pop
    // ---------------------------------------------------
    controles.querySelector("#btn-pop").addEventListener("click", () => {
      if (datos.length === 0) {
        const codigo = PSEUDOCODIGO.pop;
        return player.cargarPasos([
          {
            descripcion: "⚠ La pila está vacía: no se puede hacer pop (lanzaría una excepción).",
            aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
          },
        ]);
      }

      const indiceTope = datos.length - 1;
      const valorTope = datos[indiceTope];
      const codigo = PSEUDOCODIGO.pop;
      const pasos = [];

      pasos.push({
        descripcion: `Se va a desapilar (pop) el tope actual: ${valorTope}.`,
        aplicar: () => { pintar({ activos: [indiceTope] }); pintarCodigo(codigo, 4); },
      });

      pasos.push({
        descripcion: `Pop completado: se extrajo ${valorTope}. El nuevo tope es ${datos.length > 1 ? datos[indiceTope - 1] : "ninguno (pila vacía)"}.`,
        aplicar: () => {
          datos.pop();
          pintar({ descartados: [] });
          pintarCodigo(codigo, 5);
        },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Peek (ver el tope sin sacarlo)
    // ---------------------------------------------------
    controles.querySelector("#btn-peek").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.peek;

      if (datos.length === 0) {
        return player.cargarPasos([
          {
            descripcion: "⚠ La pila está vacía: no hay tope que observar (lanzaría una excepción).",
            aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
          },
        ]);
      }

      const indiceTope = datos.length - 1;
      const valorTope = datos[indiceTope];

      player.cargarPasos([
        {
          descripcion: `Peek: el valor en el tope de la pila es ${valorTope}, sin eliminarlo.`,
          aplicar: () => { pintar({ activos: [indiceTope] }); pintarCodigo(codigo, 3); },
        },
      ]);
    });

    // ---------------------------------------------------
    // Operación: isEmpty
    // ---------------------------------------------------
    controles.querySelector("#btn-isempty").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.isEmpty;
      const vacia = datos.length === 0;

      player.cargarPasos([
        {
          descripcion: vacia
            ? "isEmpty() devuelve true: la pila no tiene elementos."
            : `isEmpty() devuelve false: la pila tiene ${datos.length} elemento(s).`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
        },
      ]);
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      datos = [10, 25, 8];
      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Pila reiniciada a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Pila inicial con ${datos.length} elementos. El tope es ${datos[datos.length - 1]}. Usa push, pop, peek o isEmpty.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});