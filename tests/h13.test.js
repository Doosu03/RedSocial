const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class ElementoFalso {
    constructor(etiqueta = "div") {
        this.tagName = etiqueta.toUpperCase();
        this.value = "";
        this.textContent = "";
        this.style = {};
        this.children = [];
        this.eventos = {};
        this._innerHTML = "";
        this.classList = { add() {}, remove() {}, contains() { return false; } };
    }

    get innerHTML() { return this._innerHTML; }
    set innerHTML(valor) {
        this._innerHTML = valor;
        if (valor === "") this.children = [];
    }

    addEventListener(tipo, funcion) { this.eventos[tipo] = funcion; }
    ejecutarEvento(tipo) { this.eventos[tipo]({ preventDefault() {} }); }
    appendChild(elemento) { this.children.push(elemento); return elemento; }
    setAttribute() {}
    focus() {}
    setSelectionRange() {}
    reset() {}
}

function crearContexto(almacenamiento = new Map()) {
    const elementos = new Map();
    const contexto = vm.createContext({
        console,
        setTimeout(funcion) { funcion(); },
        localStorage: {
            getItem(clave) {
                return almacenamiento.has(clave)
                    ? almacenamiento.get(clave)
                    : null;
            },
            setItem(clave, valor) { almacenamiento.set(clave, valor); }
        },
        document: {
            getElementById(id) {
                if (!elementos.has(id)) elementos.set(id, new ElementoFalso());
                return elementos.get(id);
            },
            createElement(etiqueta) { return new ElementoFalso(etiqueta); }
        },
        window: { confirm() { return true; } }
    });

    const codigo = fs.readFileSync(
        path.join(__dirname, "..", "js", "app.js"),
        "utf8"
    );
    vm.runInContext(codigo, contexto);

    return { contexto, almacenamiento, elementos };
}

const publicacionesNuevas = [
    {
        id: 1,
        nombre: "Ana",
        mensaje: "Ciencias",
        fecha: "2026-01-01T10:00:00.000Z",
        reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
        comentarios: []
    },
    {
        id: 2,
        nombre: "Luis",
        mensaje: "Matemáticas",
        fecha: "2026-03-01T10:00:00.000Z",
        reacciones: { meGusta: 1, meEncanta: 2, meDivierte: 3 },
        comentarios: []
    },
    {
        id: 3,
        nombre: "Sofía",
        mensaje: "Ciencias y arte",
        fecha: "2026-02-01T10:00:00.000Z",
        reacciones: { meGusta: 4, meEncanta: 5, meDivierte: 6 },
        comentarios: []
    }
];

function establecerPublicaciones(contexto, datos = publicacionesNuevas) {
    contexto.datos = datos;
    vm.runInContext(
        "publicaciones = JSON.parse(JSON.stringify(datos)); mostrarPublicaciones();",
        contexto
    );
}

function reaccionar(contexto, id, tipo, veces = 1) {
    contexto.idPrueba = id;
    contexto.tipoPrueba = tipo;
    contexto.vecesPrueba = veces;
    vm.runInContext(
        "for (let i = 0; i < vecesPrueba; i += 1) " +
        "agregarReaccion(idPrueba, tipoPrueba);",
        contexto
    );
}

// Dos reacciones de cada tipo actualizan solamente su contador.
{
    const { contexto, elementos } = crearContexto();
    establecerPublicaciones(contexto, [publicacionesNuevas[0]]);

    reaccionar(contexto, 1, "meGusta", 2);
    reaccionar(contexto, 1, "meEncanta", 2);
    reaccionar(contexto, 1, "meDivierte", 2);

    assert.deepEqual(
        JSON.parse(vm.runInContext(
            "JSON.stringify(publicaciones[0].reacciones)",
            contexto
        )),
        { meGusta: 2, meEncanta: 2, meDivierte: 2 }
    );
    assert.equal(elementos.get("total-me-gusta").textContent, 2);
    assert.equal(elementos.get("total-me-encanta").textContent, 2);
    assert.equal(elementos.get("total-me-divierte").textContent, 2);
}

// Reaccionar a la segunda de tres no cambia las demás.
{
    const { contexto } = crearContexto();
    establecerPublicaciones(contexto);
    const antes = vm.runInContext("JSON.stringify(publicaciones)", contexto);

    reaccionar(contexto, 2, "meEncanta");

    const despues = JSON.parse(
        vm.runInContext("JSON.stringify(publicaciones)", contexto)
    );
    const originales = JSON.parse(antes);

    assert.deepEqual(despues[0], originales[0]);
    assert.equal(despues[1].reacciones.meEncanta, 3);
    assert.deepEqual(despues[2], originales[2]);
}

// LocalStorage conserva todas las cantidades después de recargar.
{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);
    establecerPublicaciones(primeraCarga.contexto);
    reaccionar(primeraCarga.contexto, 2, "meDivierte", 2);

    const recarga = crearContexto(almacenamiento);
    assert.equal(
        vm.runInContext("publicaciones[1].reacciones.meDivierte", recarga.contexto),
        5
    );
}

// Datos antiguos con solo meGusta se migran y reciben ceros.
{
    const datosAntiguos = [{
        id: 20,
        nombre: "Antigua",
        mensaje: "Publicación anterior",
        fecha: "2025-01-01T10:00:00.000Z",
        meGusta: 7,
        meGustaActivo: true,
        comentarios: []
    }];
    const almacenamiento = new Map([
        ["publicacionesRedSocial", JSON.stringify(datosAntiguos)]
    ]);
    const { contexto } = crearContexto(almacenamiento);

    assert.deepEqual(
        JSON.parse(vm.runInContext(
            "JSON.stringify(publicaciones[0].reacciones)",
            contexto
        )),
        { meGusta: 7, meEncanta: 0, meDivierte: 0 }
    );
    assert.equal(vm.runInContext("publicaciones[0].meGusta", contexto), undefined);
}

// Buscar u ordenar y luego reaccionar actualiza el id correcto.
{
    const { contexto, elementos } = crearContexto();
    establecerPublicaciones(contexto);

    elementos.get("buscador").value = "ciencias";
    elementos.get("buscador").ejecutarEvento("input");
    elementos.get("orden-publicaciones").value = "antiguas";
    elementos.get("orden-publicaciones").ejecutarEvento("change");

    reaccionar(contexto, 3, "meGusta");

    assert.equal(vm.runInContext("publicaciones[0].reacciones.meGusta", contexto), 0);
    assert.equal(vm.runInContext("publicaciones[1].reacciones.meGusta", contexto), 1);
    assert.equal(vm.runInContext("publicaciones[2].reacciones.meGusta", contexto), 5);
}

console.log("H13: 5 pruebas completadas correctamente.");
