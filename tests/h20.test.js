const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class ElementoFalso {
    constructor(etiqueta = "div") {
        this.tagName = etiqueta.toUpperCase();
        this.value = "";
        this.checked = false;
        this.textContent = "";
        this.style = {};
        this.children = [];
        this.eventos = {};
        this.atributos = {};
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
    setAttribute(nombre, valor) { this.atributos[nombre] = valor; }
    focus() {}
    setSelectionRange() {}
    reset() {}
}

function crearContexto(
    almacenamiento = new Map(),
    confirmacion = { respuesta: true }
) {
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
            setItem(clave, valor) { almacenamiento.set(clave, valor); },
            removeItem(clave) { almacenamiento.delete(clave); }
        },
        document: {
            getElementById(id) {
                if (!elementos.has(id)) elementos.set(id, new ElementoFalso());
                return elementos.get(id);
            },
            createElement(etiqueta) { return new ElementoFalso(etiqueta); }
        },
        window: { confirm() { return confirmacion.respuesta; } }
    });

    const codigo = fs.readFileSync(
        path.join(__dirname, "..", "js", "app.js"),
        "utf8"
    );
    vm.runInContext(codigo, contexto);

    return { contexto, almacenamiento, elementos, confirmacion };
}

const DATOS = [
    {
        id: 1,
        nombre: "Ana",
        mensaje: "Primera publicación",
        fecha: "2026-01-01T10:00:00.000Z",
        etiqueta: "General",
        reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
        favorita: false,
        reporte: null,
        comentarios: []
    },
    {
        id: 2,
        nombre: "Luis",
        mensaje: "Segunda publicación de estudio",
        fecha: "2026-02-01T10:00:00.000Z",
        etiqueta: "Estudio",
        reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
        favorita: false,
        reporte: null,
        comentarios: []
    },
    {
        id: 3,
        nombre: "Sofía",
        mensaje: "Tercera publicación de estudio",
        fecha: "2026-03-01T10:00:00.000Z",
        etiqueta: "Estudio",
        reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
        favorita: false,
        reporte: null,
        comentarios: []
    }
];

function cargarDatos(contexto) {
    contexto.datos = DATOS;
    vm.runInContext(
        "publicaciones = JSON.parse(JSON.stringify(datos)); mostrarPublicaciones();",
        contexto
    );
}

function leerPublicaciones(contexto) {
    return JSON.parse(vm.runInContext("JSON.stringify(publicaciones)", contexto));
}

// Reportar la segunda publicación la conserva visible y la lista en Moderación.
{
    const { contexto, elementos } = crearContexto();
    cargarDatos(contexto);

    vm.runInContext('guardarReporte(2, "Ofensivo")', contexto);

    const actuales = leerPublicaciones(contexto);
    assert.equal(actuales[0].reporte, null);
    assert.equal(actuales[1].reporte.motivo, "Ofensivo");
    assert.equal(actuales[2].reporte, null);
    assert.equal(elementos.get("lista-publicaciones").children.length, 3);
    assert.equal(elementos.get("lista-moderacion").children.length, 1);
    assert.equal(
        elementos.get("lista-moderacion").children[0].children[0].textContent,
        "Luis"
    );

    // Repetir la confirmación no crea ni reemplaza el reporte.
    const fechaOriginal = actuales[1].reporte.fecha;
    vm.runInContext('guardarReporte(2, "Spam")', contexto);
    const despues = leerPublicaciones(contexto);
    assert.equal(despues[1].reporte.motivo, "Ofensivo");
    assert.equal(despues[1].reporte.fecha, fechaOriginal);
}

// Cancelar antes de confirmar no guarda nada.
{
    const { contexto, almacenamiento } = crearContexto();
    cargarDatos(contexto);

    vm.runInContext("iniciarReporte(2); cancelarReporte();", contexto);

    assert.equal(leerPublicaciones(contexto)[1].reporte, null);
    assert.equal(
        almacenamiento.has("publicacionesRedSocial"),
        false
    );
}

// Descartar quita el reporte, no la publicación.
{
    const { contexto, elementos } = crearContexto();
    cargarDatos(contexto);
    vm.runInContext('guardarReporte(2, "Spam"); descartarReporte(2);', contexto);

    assert.equal(leerPublicaciones(contexto).length, 3);
    assert.equal(leerPublicaciones(contexto)[1].reporte, null);
    assert.equal(elementos.get("lista-publicaciones").children.length, 3);
    assert.equal(elementos.get("lista-moderacion").children.length, 0);
}

// Eliminar desde Moderación persiste y no reaparece al recargar.
{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);
    cargarDatos(primeraCarga.contexto);
    vm.runInContext(
        'guardarReporte(2, "Otro"); eliminarDesdeModeracion(2);',
        primeraCarga.contexto
    );

    const recarga = crearContexto(almacenamiento);
    assert.deepEqual(
        leerPublicaciones(recarga.contexto).map(function (publicacion) {
            return publicacion.id;
        }),
        [1, 3]
    );
    assert.equal(recarga.elementos.get("lista-moderacion").children.length, 0);
}

// Buscar y ordenar antes de reportar sigue usando el id, no la posición.
{
    const { contexto, elementos } = crearContexto();
    cargarDatos(contexto);

    elementos.get("buscador").value = "estudio";
    elementos.get("buscador").ejecutarEvento("input");
    elementos.get("orden-publicaciones").value = "antiguas";
    elementos.get("orden-publicaciones").ejecutarEvento("change");

    vm.runInContext('guardarReporte(3, "Spam")', contexto);

    const actuales = leerPublicaciones(contexto);
    assert.equal(actuales[0].reporte, null);
    assert.equal(actuales[1].reporte, null);
    assert.equal(actuales[2].reporte.motivo, "Spam");
}

console.log("H20: 5 pruebas completadas correctamente.");
