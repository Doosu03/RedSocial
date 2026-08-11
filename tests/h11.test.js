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

function publicar(elementos, mensaje) {
    elementos.get("nombre").value = "Ana";
    elementos.get("mensaje").value = mensaje;
    elementos.get("formulario-publicacion").ejecutarEvento("submit");
}

function cargarPublicacion(contexto, mensaje = "Mensaje original") {
    contexto.mensajeInicial = mensaje;

    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "Ana",
                mensaje: mensajeInicial,
                fecha: "2026-01-01T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

function editar(contexto, mensaje) {
    contexto.campoPrueba = new ElementoFalso("textarea");
    contexto.errorPrueba = new ElementoFalso("small");
    contexto.campoPrueba.value = mensaje;

    vm.runInContext(
        "guardarEdicion(1, campoPrueba, errorPrueba);",
        contexto
    );
}

// El formulario declara el nuevo límite.

{
    const rutaHtml = path.join(__dirname, "..", "index.html");
    const html = fs.readFileSync(rutaHtml, "utf8");

    assert.match(
        html,
        /<textarea[\s\S]*?id="mensaje"[\s\S]*?maxlength="200"/
    );
}

// El contador informa cuántos caracteres quedan.

{
    const { elementos } = crearContexto();
    const campoMensaje = elementos.get("mensaje");
    const contador = elementos.get("contador-caracteres");

    campoMensaje.value = "a".repeat(199);
    campoMensaje.ejecutarEvento("input");
    assert.equal(contador.textContent, "1 carácter restante");

    campoMensaje.value = "a".repeat(200);
    campoMensaje.ejecutarEvento("input");
    assert.equal(contador.textContent, "0 caracteres restantes");

    campoMensaje.value = "a".repeat(201);
    campoMensaje.ejecutarEvento("input");
    assert.equal(contador.textContent, "1 carácter de más");
    assert.equal(
        elementos.get("error-mensaje").textContent,
        "El mensaje no puede superar los 200 caracteres."
    );
}

// Crear publicaciones con 199 y 200 caracteres está permitido.

[199, 200].forEach(function (cantidad) {
    const { contexto, elementos } = crearContexto();

    publicar(elementos, "a".repeat(cantidad));

    assert.equal(vm.runInContext("publicaciones.length", contexto), 1);
    assert.equal(
        vm.runInContext("publicaciones[0].mensaje.length", contexto),
        cantidad
    );
});

// Crear una publicación con 201 caracteres se rechaza.

{
    const { contexto, almacenamiento, elementos } = crearContexto();

    publicar(elementos, "a".repeat(201));

    assert.equal(vm.runInContext("publicaciones.length", contexto), 0);
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.equal(
        elementos.get("error-mensaje").textContent,
        "El mensaje no puede superar los 200 caracteres."
    );
}

// Editar con 199 y 200 caracteres está permitido.

[199, 200].forEach(function (cantidad) {
    const { contexto, almacenamiento } = crearContexto();
    cargarPublicacion(contexto);

    editar(contexto, "b".repeat(cantidad));

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.equal(guardadas[0].mensaje.length, cantidad);
});

// Editar con 201 caracteres no modifica ni guarda la publicación.

{
    const { contexto, almacenamiento } = crearContexto();
    cargarPublicacion(contexto);

    editar(contexto, "b".repeat(201));

    assert.equal(
        vm.runInContext("publicaciones[0].mensaje", contexto),
        "Mensaje original"
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.equal(
        contexto.errorPrueba.textContent,
        "El mensaje no puede superar los 200 caracteres."
    );
}

// El formulario de edición aplica el límite y muestra su contador.

{
    const { contexto } = crearContexto();
    cargarPublicacion(contexto, "Mensaje corto");

    const formularioEdicion = vm.runInContext(`
        idPublicacionEnEdicion = 1;
        crearContenidoPublicacion(publicaciones[0]);
    `, contexto);

    const campoEdicion = formularioEdicion.children[1];
    const detalleEdicion = formularioEdicion.children[2];
    const contadorEdicion = detalleEdicion.children[1];

    assert.equal(campoEdicion.maxLength, 200);
    assert.equal(contadorEdicion.textContent, "187 caracteres restantes");

    campoEdicion.value = "c".repeat(200);
    campoEdicion.ejecutarEvento("input");

    assert.equal(contadorEdicion.textContent, "0 caracteres restantes");
}

console.log("H11: 9 pruebas completadas correctamente.");
