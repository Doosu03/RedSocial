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
            },
            contains(nombre) {
                return clases.has(nombre);
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

    focus() {
        this.tieneFoco = true;
    }

    setSelectionRange() {}

    reset() {
        this.fueReiniciado = true;
    }
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
            },
            removeItem(clave) {
                almacenamiento.delete(clave);
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

    return { contexto, elementos, almacenamiento };
}

function escribirCampo(elementos, id, texto) {
    const campo = elementos.get(id);

    campo.value = texto;
    campo.ejecutarEvento("input");
}

function publicar(elementos, nombre, mensaje) {
    elementos.get("nombre").value = nombre;
    elementos.get("mensaje").value = mensaje;
    elementos.get("formulario-publicacion").ejecutarEvento("submit");
}

function leerBorrador(almacenamiento) {
    return JSON.parse(
        almacenamiento.get("borradorPublicacionRedSocial")
    );
}

// El formulario declara la accion para descartar borrador.

{
    const html = fs.readFileSync(
        path.join(__dirname, "..", "index.html"),
        "utf8"
    );

    assert.match(html, /id="descartar-borrador"/);
}

// Escribir parcialmente, recargar y recuperar nombre, mensaje y contador.

{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);

    escribirCampo(primeraCarga.elementos, "nombre", "Ana");
    escribirCampo(primeraCarga.elementos, "mensaje", "Mensaje parcial");

    assert.deepEqual(
        leerBorrador(almacenamiento),
        {
            nombre: "Ana",
            mensaje: "Mensaje parcial"
        }
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);

    const recarga = crearContexto(almacenamiento);

    assert.equal(recarga.elementos.get("nombre").value, "Ana");
    assert.equal(recarga.elementos.get("mensaje").value, "Mensaje parcial");
    assert.equal(
        recarga.elementos.get("contador-caracteres").textContent,
        "185 caracteres restantes"
    );
}

// Una validacion fallida conserva el borrador.

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    escribirCampo(elementos, "mensaje", "Texto sin nombre");
    publicar(elementos, "   ", "Texto sin nombre");

    assert.equal(vm.runInContext("publicaciones.length", contexto), 0);
    assert.deepEqual(
        leerBorrador(almacenamiento),
        {
            nombre: "",
            mensaje: "Texto sin nombre"
        }
    );
    assert.equal(
        elementos.get("error-nombre").textContent,
        "El nombre es obligatorio."
    );
}

// Publicar correctamente limpia formulario y borrador.

{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);

    escribirCampo(primeraCarga.elementos, "nombre", "Luis");
    escribirCampo(primeraCarga.elementos, "mensaje", "Publicacion lista");
    publicar(primeraCarga.elementos, "Luis", "Publicacion lista");

    assert.equal(
        almacenamiento.has("borradorPublicacionRedSocial"),
        false
    );
    assert.equal(primeraCarga.elementos.get("nombre").value, "");
    assert.equal(primeraCarga.elementos.get("mensaje").value, "");

    const recarga = crearContexto(almacenamiento);

    assert.equal(recarga.elementos.get("nombre").value, "");
    assert.equal(recarga.elementos.get("mensaje").value, "");
    assert.equal(vm.runInContext("publicaciones.length", recarga.contexto), 1);
}

// Descartar un borrador limpia campos, errores y almacenamiento.

{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);

    escribirCampo(primeraCarga.elementos, "nombre", "Sofia");
    escribirCampo(primeraCarga.elementos, "mensaje", "A medio escribir");

    primeraCarga.elementos
        .get("descartar-borrador")
        .ejecutarEvento("click");

    assert.equal(
        almacenamiento.has("borradorPublicacionRedSocial"),
        false
    );
    assert.equal(primeraCarga.elementos.get("nombre").value, "");
    assert.equal(primeraCarga.elementos.get("mensaje").value, "");
    assert.equal(
        primeraCarga.elementos.get("contador-caracteres").textContent,
        "200 caracteres restantes"
    );

    const recarga = crearContexto(almacenamiento);

    assert.equal(recarga.elementos.get("nombre").value, "");
    assert.equal(recarga.elementos.get("mensaje").value, "");
}

console.log("H17: 5 pruebas completadas correctamente.");
