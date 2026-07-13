    const elNombreEstructura = document.getElementById("nombre-estructura");
    const elComplejidad = document.getElementById("complejidad");
    const elStage = document.getElementById("stage");
    const elLog = document.getElementById("log");
    const elPanelOperaciones = document.getElementById("panel-operaciones");
    const elBtnPrev = document.getElementById("btn-prev");
    const elBtnPlay = document.getElementById("btn-play");
    const elBtnNext = document.getElementById("btn-next");
    const elVelocidad = document.getElementById("velocidad");
    const elNavLinks = document.querySelectorAll("#nav-list a");

    class StepPlayer {
    constructor() {
        this.steps = [];
        this.index = -1;
        this.playing = false;
        this.timer = null;
    }

    cargarPasos(steps) {
        this.detener();
        this.steps = steps;
        this.index = -1;
        elLog.innerHTML = "";
        this.steps.forEach((paso) => {
        const div = document.createElement("div");
        div.textContent = paso.descripcion;
        elLog.appendChild(div);
        });
        this.siguiente();
    }

    siguiente() {
        if (this.index >= this.steps.length - 1) { this.pausa(); return; }
        this.index++;
        this._aplicarPasoActual();
    }

    anterior() {
        if (this.index <= 0) return;
        this.index--;
        this._aplicarPasoActual();
    }

    _aplicarPasoActual() {
        const paso = this.steps[this.index];
        if (!paso) return;
        paso.aplicar();
        [...elLog.children].forEach((div, i) => div.classList.toggle("paso-actual", i === this.index));
        elLog.children[this.index]?.scrollIntoView({ block: "nearest" });
    }

    play() {
        if (this.playing) return;
        this.playing = true;
        elBtnPlay.textContent = "⏸";
        this._tick();
    }

    pausa() {
        this.playing = false;
        elBtnPlay.textContent = "▶";
        clearTimeout(this.timer);
    }

    detener() {
        this.pausa();
        this.index = -1;
    }

    _tick() {
        if (!this.playing) return;
        if (this.index >= this.steps.length - 1) { this.pausa(); return; }
        this.siguiente();
        const velocidad = Number(elVelocidad.value);
        const demora = 1100 - velocidad * 100;
        this.timer = setTimeout(() => this._tick(), demora);
    }
    }

    const player = new StepPlayer();

    elBtnPrev.addEventListener("click", () => { player.pausa(); player.anterior(); });
    elBtnNext.addEventListener("click", () => { player.pausa(); player.siguiente(); });
    elBtnPlay.addEventListener("click", () => player.playing ? player.pausa() : player.play());

    const modulos = {};
    function registrarModulo(id, definicion) { modulos[id] = definicion; }

    elNavLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        elNavLinks.forEach((a) => a.classList.remove("activo"));
        link.classList.add("activo");
        cargarModulo(link.dataset.id);
    });
    });

    function cargarModulo(id) {
    const mod = modulos[id];
    if (!mod) { console.warn(`Módulo "${id}" no registrado todavía`); return; }

    player.detener();
    elNombreEstructura.textContent = mod.nombre;
    elComplejidad.textContent = mod.complejidad;
    elStage.innerHTML = "";
    elLog.innerHTML = "";
    elPanelOperaciones.innerHTML = "";

    mod.iniciar({ stage: elStage, controles: elPanelOperaciones, player });
    }

    document.addEventListener("DOMContentLoaded", () => {
    cargarModulo("array");
    });