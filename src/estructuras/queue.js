/* =========================================================
   MÓDULO: Cola (Queue)
   Se integra con app.js a través de registrarModulo(id, definicion)
   ========================================================= */

registrarModulo("cola", {
  nombre: "Cola (Queue)",
  complejidad: "Enqueue/Dequeue/Peek: O(1)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
    // ---------------------------------------------------
    let datos = [12, 7, 30];
    const CAPACIDAD_MAX = 10;

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      enqueue: [
        "void enqueue(int valor) {",
        "    arr[back] = valor;",
        "    back++;",
        "}",
      ],
      dequeue: [
        "int dequeue() {",
        "    if (isEmpty()) {",
        "        throw new RuntimeException();",
        "    }",
        "    int valor = arr[front];",
        "    front++;",
        "    return valor;",
        "}",
      ],
      peek: [
        "int peek() {",
        "    if (isEmpty()) {",
        "        throw new RuntimeException();",
        "    }",
        "    return arr[front];",
        "}",
      ],
      isEmpty: [
        "boolean isEmpty() {",
        "    return front == back;",
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
    // Construcción del stage (reutiliza clases array-*)
    // ---------------------------------------------------
    const wrapper = document.createElement("div");
    wrapper.className = "array-wrapper";

    const fila = document.createElement("div");
    fila.className = "array-fila";
    wrapper.appendChild(fila);

    stage.appendChild(wrapper);

    function pintar(resaltados = {}) {
      fila.innerHTML = "";

      if (datos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "array-vacio";
        vacio.textContent = "Cola vacía";
        fila.appendChild(vacio);
        return;
      }

      datos.forEach((valor, i) => {
        const celda = document.createElement("div");
        celda.className = "array-celda";

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

        const etiquetaEl = document.createElement("div");
        etiquetaEl.className = "array-indice";
        if (i === 0 && i === datos.length - 1) {
          etiquetaEl.textContent = "FRONT / BACK";
        } else if (i === 0) {
          etiquetaEl.textContent = "FRONT";
        } else if (i === datos.length - 1) {
          etiquetaEl.textContent = "BACK";
        } else {
          etiquetaEl.textContent = "";
        }

        celda.appendChild(valorEl);
        celda.appendChild(etiquetaEl);
        fila.appendChild(celda);
      });
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el código"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="cola-input-valor" placeholder="Valor" />
      <button id="btn-enqueue">Enqueue</button>
      <button id="btn-dequeue">Dequeue</button>
      <button id="btn-peek">Peek</button>
      <button id="btn-isempty">¿Está vacía?</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#cola-input-valor");

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
    // Operación: Enqueue
    // ---------------------------------------------------
    controles.querySelector("#btn-enqueue").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (datos.length >= CAPACIDAD_MAX) return avisar("⚠ La cola alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.enqueue;
      const pasos = [];

      pasos.push({
        descripcion: `Se va a encolar (enqueue) el valor ${valor} al final de la cola.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `Enqueue completado: ${valor} es ahora el nuevo BACK de la cola.`,
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
    // Operación: Dequeue
    // ---------------------------------------------------
    controles.querySelector("#btn-dequeue").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.dequeue;

      if (datos.length === 0) {
        return player.cargarPasos([
          {
            descripcion: "⚠ La cola está vacía: no se puede hacer dequeue (lanzaría una excepción).",
            aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
          },
        ]);
      }

      const valorFront = datos[0];
      const pasos = [];

      pasos.push({
        descripcion: `Se va a desencolar (dequeue) el FRONT actual: ${valorFront}.`,
        aplicar: () => { pintar({ activos: [0] }); pintarCodigo(codigo, 4); },
      });

      pasos.push({
        descripcion: `Dequeue completado: se extrajo ${valorFront}. ${datos.length > 1 ? `El nuevo FRONT es ${datos[1]}.` : "La cola queda vacía."}`,
        aplicar: () => {
          datos.shift();
          pintar();
          pintarCodigo(codigo, 5);
        },
      });

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Peek (ver el front sin sacarlo)
    // ---------------------------------------------------
    controles.querySelector("#btn-peek").addEventListener("click", () => {
      const codigo = PSEUDOCODIGO.peek;

      if (datos.length === 0) {
        return player.cargarPasos([
          {
            descripcion: "⚠ La cola está vacía: no hay FRONT que observar (lanzaría una excepción).",
            aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
          },
        ]);
      }

      const valorFront = datos[0];

      player.cargarPasos([
        {
          descripcion: `Peek: el valor en el FRONT de la cola es ${valorFront}, sin eliminarlo.`,
          aplicar: () => { pintar({ activos: [0] }); pintarCodigo(codigo, 3); },
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
            ? "isEmpty() devuelve true: la cola no tiene elementos."
            : `isEmpty() devuelve false: la cola tiene ${datos.length} elemento(s).`,
          aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
        },
      ]);
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      datos = [12, 7, 30];
      pintarCodigo(["// Selecciona una operación", "// para ver el código"]);
      player.cargarPasos([
        {
          descripcion: "Cola reiniciada a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Cola inicial con ${datos.length} elementos. El FRONT es ${datos[0]} y el BACK es ${datos[datos.length - 1]}. Usa enqueue, dequeue, peek o isEmpty.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});