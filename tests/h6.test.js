const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class ElementoFalso {
    constructor() {
        this.value = "";
        this.textContent = "";
        this.innerHTML = "";
        this.style = {};
        this.classList = {
            add() {},
            remove() {}
        };
    }

    addEventListener() {}
    appendChild() {}
    setAttribute() {}
    focus() {}
    setSelectionRange() {}
    reset() {}
}

function crearContexto() {
    const almacenamiento = new Map();
    const elementos = new Map();

    const contexto = vm.createContext({
        console,
        setTimeout(funcion) {
            funcion();
        },
        localStorage: {
            getItem(clave) {
                return almacenamiento.has(clave)
                    ? almacenamiento.get(clave)
                    : null;
            },
            setItem(clave, valor) {
                almacenamiento.set(clave, valor);
            }
        },
        document: {
            getElementById(id) {
                if (!elementos.has(id)) {
                    elementos.set(id, new ElementoFalso());
                }

                return elementos.get(id);
            },
            createElement() {
                return new ElementoFalso();
            }
        },
        window: {
            confirm() {
                return true;
            }
        }
    });

    const rutaApp = path.join(__dirname, "..", "js", "app.js");
    const codigoApp = fs.readFileSync(rutaApp, "utf8");

    vm.runInContext(codigoApp, contexto);

    return { contexto, almacenamiento };
}

function cargarPublicacionesDePrueba(contexto) {
    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "Ana",
                mensaje: "Primer mensaje",
                fecha: "2026-01-01T10:00:00.000Z",
                meGusta: 2,
                meGustaActivo: true
            },
            {
                id: 2,
                nombre: "Luis",
                mensaje: "Segundo mensaje",
                fecha: "2026-01-02T10:00:00.000Z",
                meGusta: 5,
                meGustaActivo: false
            },
            {
                id: 3,
                nombre: "Eva",
                mensaje: "Tercer mensaje",
                fecha: "2026-01-03T10:00:00.000Z",
                meGusta: 1,
                meGustaActivo: true
            }
        ];
    `, contexto);
}

function editar(contexto, id, mensaje) {
    contexto.campoPrueba = new ElementoFalso();
    contexto.errorPrueba = new ElementoFalso();
    contexto.campoPrueba.value = mensaje;

    vm.runInContext(
        "guardarEdicion(" + id + ", campoPrueba, errorPrueba);",
        contexto
    );
}

{
    const { contexto, almacenamiento } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    editar(contexto, 2, "Mensaje corregido");

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.equal(guardadas[0].mensaje, "Primer mensaje");
    assert.equal(guardadas[1].mensaje, "Mensaje corregido");
    assert.equal(guardadas[2].mensaje, "Tercer mensaje");
    assert.equal(guardadas[1].nombre, "Luis");
    assert.equal(guardadas[1].fecha, "2026-01-02T10:00:00.000Z");
    assert.equal(guardadas[1].meGusta, 5);
    assert.equal(guardadas[1].meGustaActivo, false);
}

{
    const { contexto, almacenamiento } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    editar(contexto, 2, "   ");

    assert.equal(
        contexto.errorPrueba.textContent,
        "El mensaje no puede estar vacío."
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.equal(
        vm.runInContext("publicaciones[1].mensaje", contexto),
        "Segundo mensaje"
    );
}

console.log("H6: 3 pruebas completadas correctamente.");
