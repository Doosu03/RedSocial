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
        this.atributos = {};
        this._innerHTML = "";

        const clases = new Set();

        this.classList = {
            add(...nombres) {
                nombres.forEach(function (nombre) {
                    clases.add(nombre);
                });
            },
            remove(...nombres) {
                nombres.forEach(function (nombre) {
                    clases.delete(nombre);
                });
            }
        };
    }

    get innerHTML() {
        return this._innerHTML;
    }

    set innerHTML(valor) {
        this._innerHTML = valor;

        if (valor === "") {
            this.children = [];
        }
    }

    addEventListener(tipo, funcion) {
        this.eventos[tipo] = funcion;
    }

    ejecutarEvento(tipo) {
        this.eventos[tipo]({
            preventDefault() {}
        });
    }

    appendChild(elemento) {
        this.children.push(elemento);
        return elemento;
    }

    setAttribute(nombre, valor) {
        this.atributos[nombre] = valor;
    }

    focus() {}
    setSelectionRange() {}
    reset() {}
}

function crearContexto(almacenamiento = new Map()) {
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
            createElement(etiqueta) {
                return new ElementoFalso(etiqueta);
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

    return { contexto, almacenamiento, elementos };
}

const datosPrueba = [
    {
        id: 1,
        nombre: "Ana",
        mensaje: "Proyecto de ciencias",
        fecha: "2026-01-01T10:00:00.000Z",
        meGusta: 4,
        meGustaActivo: false,
        comentarios: []
    },
    {
        id: 2,
        nombre: "Luis",
        mensaje: "Apuntes de matemáticas",
        fecha: "2026-03-01T10:00:00.000Z",
        meGusta: 2,
        meGustaActivo: false,
        comentarios: []
    },
    {
        id: 3,
        nombre: "Sofía",
        mensaje: "Feria de ciencias",
        fecha: "2026-02-01T10:00:00.000Z",
        meGusta: 9,
        meGustaActivo: true,
        comentarios: []
    }
];

function cargarPublicaciones(contexto) {
    contexto.datosPrueba = datosPrueba;

    vm.runInContext(
        "publicaciones = JSON.parse(JSON.stringify(datosPrueba)); " +
        "mostrarPublicaciones();",
        contexto
    );
}

function nombresVisibles(elementos) {
    return elementos
        .get("lista-publicaciones")
        .children
        .map(function (articulo) {
            return articulo.children[0].children[0].textContent;
        });
}

function seleccionarOrden(elementos, valor) {
    const selector = elementos.get("orden-publicaciones");

    selector.value = valor;
    selector.ejecutarEvento("change");
}

// Recientes: fecha descendente

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    assert.deepEqual(
        nombresVisibles(elementos),
        ["Luis", "Sofía", "Ana"]
    );
}

// Antiguas: fecha ascendente

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    seleccionarOrden(elementos, "antiguas");

    assert.deepEqual(
        nombresVisibles(elementos),
        ["Ana", "Sofía", "Luis"]
    );
}

// Más gustadas: cantidad de Me gusta descendente

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    seleccionarOrden(elementos, "mas-gustadas");

    assert.deepEqual(
        nombresVisibles(elementos),
        ["Sofía", "Ana", "Luis"]
    );
}

// Buscar y después ordenar solamente los resultados visibles

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    const buscador = elementos.get("buscador");
    buscador.value = "ciencias";
    buscador.ejecutarEvento("input");

    seleccionarOrden(elementos, "mas-gustadas");

    assert.deepEqual(nombresVisibles(elementos), ["Sofía", "Ana"]);
    assert.equal(vm.runInContext("publicaciones.length", contexto), 3);
}

// Ordenar no altera los datos y una recarga vuelve a Recientes

{
    const almacenamiento = new Map([
        ["publicacionesRedSocial", JSON.stringify(datosPrueba)]
    ]);

    const primeraCarga = crearContexto(almacenamiento);
    seleccionarOrden(primeraCarga.elementos, "antiguas");

    assert.equal(
        almacenamiento.get("publicacionesRedSocial"),
        JSON.stringify(datosPrueba)
    );

    const segundaCarga = crearContexto(almacenamiento);

    assert.deepEqual(
        nombresVisibles(segundaCarga.elementos),
        ["Luis", "Sofía", "Ana"]
    );
    assert.equal(
        vm.runInContext("criterioOrden", segundaCarga.contexto),
        "recientes"
    );
}

console.log("H9: 5 pruebas completadas correctamente.");
