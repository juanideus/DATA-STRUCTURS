/* =========================================================
   MÓDULO: Array (Arreglo)
   Se integra con app.js a través de registrarModulo(id, definicion)
   ========================================================= */

registrarModulo("array", {
  nombre: "Array (Arreglo)",
  complejidad: "Acceso: O(1) · Búsqueda: O(n) · Inserción/Eliminación: O(n)",

  iniciar({ stage, controles, player }) {
    // ---------------------------------------------------
    // Estado interno del módulo
    // ---------------------------------------------------
    let datos = [12, 45, 7, 23, 56, 3];
    const CAPACIDAD_MAX = 12;

    const elCodigo = document.getElementById("codigo-contenido");

    // ---------------------------------------------------
    // Código Java por operación (para el panel #codigo)
    // ---------------------------------------------------
    const PSEUDOCODIGO = {
      insertarFinal: [
        "void insertarFinal(int valor) {",
        "    arr[size] = valor;",
        "    size++;",
        "}",
      ],
      insertarIndice: [
        "void insertarEn(int i, int valor) {",
        "    for (int k = size; k > i; k--) {",
        "        arr[k] = arr[k - 1];",
        "    }",
        "    arr[i] = valor;",
        "    size++;",
        "}",
      ],
      eliminar: [
        "int eliminarEn(int i) {",
        "    int valor = arr[i];",
        "    for (int k = i; k < size - 1; k++) {",
        "        arr[k] = arr[k + 1];",
        "    }",
        "    size--;",
        "    return valor;",
        "}",
      ],
      buscar: [
        "int buscar(int valor) {",
        "    for (int i = 0; i < size; i++) {",
        "        if (arr[i] == valor) {",
        "            return i;",
        "        }",
        "    }",
        "    return -1;",
        "}",
      ],
      actualizar: [
        "void actualizar(int i, int valor) {",
        "    arr[i] = valor;",
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
    // Construcción del stage (visualización)
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
        vacio.textContent = "Array vacío";
        fila.appendChild(vacio);
        return;
      }

      datos.forEach((valor, i) => {
        const celda = document.createElement("div");
        celda.className = "array-celda";

        if (resaltados.activos && resaltados.activos.includes(i)) {
          celda.classList.add("celda-activa");
        }
        if (resaltados.encontrado === i) {
          celda.classList.add("celda-encontrada");
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

        const indiceEl = document.createElement("div");
        indiceEl.className = "array-indice";
        indiceEl.textContent = i;

        celda.appendChild(valorEl);
        celda.appendChild(indiceEl);
        fila.appendChild(celda);
      });
    }

    pintar();
    pintarCodigo(["// Selecciona una operación", "// para ver el pseudocódigo"]);

    // ---------------------------------------------------
    // Panel de operaciones — fila simple (input + botones)
    // ---------------------------------------------------
    controles.innerHTML = `
      <input type="number" id="arr-input-valor" placeholder="Valor" />
      <input type="number" id="arr-input-indice" placeholder="Índice" min="0" />
      <button id="btn-insertar-final">Insertar al final</button>
      <button id="btn-insertar-indice">Insertar en índice</button>
      <button id="btn-eliminar">Eliminar</button>
      <button id="btn-buscar">Buscar</button>
      <button id="btn-actualizar">Actualizar</button>
      <button id="btn-reiniciar">Reiniciar</button>
    `;

    const inputValor = controles.querySelector("#arr-input-valor");
    const inputIndice = controles.querySelector("#arr-input-indice");

    function leerValor() {
      const v = Number(inputValor.value);
      return Number.isFinite(v) && inputValor.value !== "" ? v : null;
    }

    function leerIndice() {
      const i = Number(inputIndice.value);
      return Number.isFinite(i) && inputIndice.value !== "" ? i : null;
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
    // Operación: Insertar al final
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-final").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (datos.length >= CAPACIDAD_MAX) return avisar("⚠ El array alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertarFinal;
      const pasos = [];

      pasos.push({
        descripcion: `Se va a insertar ${valor} al final del array (índice ${datos.length}).`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `Insertado: ahora datos[${datos.length}] = ${valor}.`,
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
    // Operación: Insertar en índice
    // ---------------------------------------------------
    controles.querySelector("#btn-insertar-indice").addEventListener("click", () => {
      const valor = leerValor();
      const indice = leerIndice();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (indice === null) return avisar("⚠ Ingresa un índice válido.");
      if (indice < 0 || indice > datos.length) return avisar(`⚠ Índice fuera de rango (0 a ${datos.length}).`);
      if (datos.length >= CAPACIDAD_MAX) return avisar("⚠ El array alcanzó su capacidad máxima de visualización.");

      const codigo = PSEUDOCODIGO.insertarIndice;
      const pasos = [];

      pasos.push({
        descripcion: `Se insertará ${valor} en el índice ${indice}. Los elementos desde ese punto se desplazarán a la derecha.`,
        aplicar: () => { pintar({ activos: [indice] }); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `Insertado: datos[${indice}] = ${valor}.`,
        aplicar: () => {
          datos.splice(indice, 0, valor);
          pintar({ nuevo: indice });
          pintarCodigo(codigo, 3);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
      inputIndice.value = "";
    });

    // ---------------------------------------------------
    // Operación: Eliminar en índice
    // ---------------------------------------------------
    controles.querySelector("#btn-eliminar").addEventListener("click", () => {
      const indice = leerIndice();
      if (indice === null) return avisar("⚠ Ingresa un índice válido.");
      if (datos.length === 0) return avisar("⚠ El array está vacío.");
      if (indice < 0 || indice > datos.length - 1) return avisar(`⚠ Índice fuera de rango (0 a ${datos.length - 1}).`);

      const valorEliminado = datos[indice];
      const codigo = PSEUDOCODIGO.eliminar;
      const pasos = [];

      pasos.push({
        descripcion: `Se eliminará el valor ${valorEliminado} en el índice ${indice}.`,
        aplicar: () => { pintar({ descartados: [indice] }); pintarCodigo(codigo, 1); },
      });

      pasos.push({
        descripcion: `Eliminado. Los elementos posteriores se desplazan una posición a la izquierda.`,
        aplicar: () => {
          datos.splice(indice, 1);
          pintar();
          pintarCodigo(codigo, 4);
        },
      });

      player.cargarPasos(pasos);
      inputIndice.value = "";
    });

    // ---------------------------------------------------
    // Operación: Buscar valor (búsqueda lineal animada)
    // ---------------------------------------------------
    controles.querySelector("#btn-buscar").addEventListener("click", () => {
      const valor = leerValor();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido para buscar.");
      if (datos.length === 0) return avisar("⚠ El array está vacío.");

      const codigo = PSEUDOCODIGO.buscar;
      const pasos = [];
      const descartados = [];

      pasos.push({
        descripcion: `Iniciando búsqueda lineal del valor ${valor}.`,
        aplicar: () => { pintar(); pintarCodigo(codigo, 1); },
      });

      let encontradoEn = -1;
      for (let i = 0; i < datos.length; i++) {
        if (datos[i] === valor) {
          encontradoEn = i;
          pasos.push({
            descripcion: `datos[${i}] = ${datos[i]} → ¡Coincidencia! Valor encontrado en el índice ${i}.`,
            aplicar: () => { pintar({ encontrado: i, descartados: [...descartados] }); pintarCodigo(codigo, 3); },
          });
          break;
        } else {
          pasos.push({
            descripcion: `datos[${i}] = ${datos[i]} ≠ ${valor}. Se continúa buscando.`,
            aplicar: () => { pintar({ activos: [i], descartados: [...descartados] }); pintarCodigo(codigo, 2); },
          });
          descartados.push(i);
        }
      }

      if (encontradoEn === -1) {
        pasos.push({
          descripcion: `Se recorrió todo el array y no se encontró el valor ${valor}.`,
          aplicar: () => { pintar({ descartados: [...descartados] }); pintarCodigo(codigo, 5); },
        });
      }

      player.cargarPasos(pasos);
    });

    // ---------------------------------------------------
    // Operación: Actualizar en índice
    // ---------------------------------------------------
    controles.querySelector("#btn-actualizar").addEventListener("click", () => {
      const valor = leerValor();
      const indice = leerIndice();
      if (valor === null) return avisar("⚠ Ingresa un valor numérico válido.");
      if (indice === null) return avisar("⚠ Ingresa un índice válido.");
      if (datos.length === 0) return avisar("⚠ El array está vacío.");
      if (indice < 0 || indice > datos.length - 1) return avisar(`⚠ Índice fuera de rango (0 a ${datos.length - 1}).`);

      const valorAnterior = datos[indice];
      const codigo = PSEUDOCODIGO.actualizar;
      const pasos = [];

      pasos.push({
        descripcion: `Se actualizará datos[${indice}] (valor actual: ${valorAnterior}) a ${valor}.`,
        aplicar: () => { pintar({ activos: [indice] }); pintarCodigo(codigo, 0); },
      });

      pasos.push({
        descripcion: `Actualizado: datos[${indice}] = ${valor}.`,
        aplicar: () => {
          datos[indice] = valor;
          pintar({ nuevo: indice });
          pintarCodigo(codigo, 1);
        },
      });

      player.cargarPasos(pasos);
      inputValor.value = "";
      inputIndice.value = "";
    });

    // ---------------------------------------------------
    // Operación: Reiniciar
    // ---------------------------------------------------
    controles.querySelector("#btn-reiniciar").addEventListener("click", () => {
      datos = [12, 45, 7, 23, 56, 3];
      pintarCodigo(["// Selecciona una operación", "// para ver el pseudocódigo"]);
      player.cargarPasos([
        {
          descripcion: "Array reiniciado a sus valores iniciales.",
          aplicar: () => pintar(),
        },
      ]);
    });

    // ---------------------------------------------------
    // Paso inicial al cargar el módulo
    // ---------------------------------------------------
    player.cargarPasos([
      {
        descripcion: `Array inicial con ${datos.length} elementos. Usa los controles para insertar, eliminar, buscar o actualizar valores.`,
        aplicar: () => pintar(),
      },
    ]);
  },
});