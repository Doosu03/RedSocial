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

    return { contexto, elementos, almacenamiento };
}

function cargarPublicacionesDePrueba(contexto) {
    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "Ana",
                mensaje: "Primera publicación",
                fecha: "2026-01-01T10:00:00.000Z",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: [
                    {
                        id: 11,
                        nombre: "Marta",
                        texto: "Primer comentario",
                        fecha: "2026-02-01T10:00:00.000Z"
                    },
                    {
                        id: 12,
                        nombre: "Pedro",
                        texto: "Segundo comentario",
                        fecha: "2026-02-02T10:00:00.000Z"
                    },
                    {
                        id: 13,
                        nombre: "Sofía",
                        texto: "Tercer comentario",
                        fecha: "2026-02-03T10:00:00.000Z"
                    }
                ]
            },
            {
                id: 2,
                nombre: "Luis",
                mensaje: "Segunda publicación",
                fecha: "2026-01-02T10:00:00.000Z",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: [
                    {
                        id: 21,
                        nombre: "Laura",
                        texto: "Comentario de otra publicación",
                        fecha: "2026-02-04T10:00:00.000Z"
                    }
                ]
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

function articuloPublicacion(elementos, autor) {
    return elementos
        .get("lista-publicaciones")
        .children
        .find(function (articulo) {
            return articulo.children[0].children[0].textContent === autor;
        });
}

function comentarioDibujado(elementos, autor, posicion) {
    return articuloPublicacion(elementos, autor)
        .children[3]
        .children[1]
        .children[posicion];
}

function accionesComentario(elementos, autor, posicion) {
    return comentarioDibujado(elementos, autor, posicion).children[2];
}

function seccionRespuestas(elementos, autor, posicion) {
    return comentarioDibujado(elementos, autor, posicion).children[3];
}

function formularioRespuesta(elementos, autor, posicion) {
    return seccionRespuestas(elementos, autor, posicion).children[2];
}

function responder(elementos, autor, posicion, nombre, texto) {
    accionesComentario(elementos, autor, posicion)
        .children[2]
        .ejecutarEvento("click");

    const formulario = formularioRespuesta(elementos, autor, posicion);

    formulario.children[0].children[1].value = nombre;
    formulario.children[1].children[1].value = texto;
    formulario.ejecutarEvento("submit");
}

function leerGuardadas(almacenamiento) {
    return JSON.parse(almacenamiento.get("publicacionesRedSocial"));
}

// Cada comentario muestra Responder y abre solo el formulario seleccionado.

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    [0, 1, 2].forEach(function (posicion) {
        assert.equal(
            accionesComentario(elementos, "Ana", posicion)
                .children[2]
                .textContent,
            "Responder"
        );
    });

    accionesComentario(elementos, "Ana", 1)
        .children[2]
        .ejecutarEvento("click");

    assert.equal(formularioRespuesta(elementos, "Ana", 1).tagName, "FORM");
    assert.equal(
        formularioRespuesta(elementos, "Ana", 1)
            .children[0]
            .children[1]
            .tieneFoco,
        true
    );
    assert.equal(seccionRespuestas(elementos, "Ana", 0).children.length, 2);
    assert.equal(seccionRespuestas(elementos, "Ana", 2).children.length, 2);
}

// Nombre y texto son obligatorios y no aceptan solo espacios.

{
    const { contexto, elementos, almacenamiento } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    accionesComentario(elementos, "Ana", 1)
        .children[2]
        .ejecutarEvento("click");

    const formulario = formularioRespuesta(elementos, "Ana", 1);

    formulario.children[0].children[1].value = "   ";
    formulario.children[1].children[1].value = "   ";
    formulario.ejecutarEvento("submit");

    assert.equal(
        formulario.children[0].children[2].textContent,
        "El nombre es obligatorio."
    );
    assert.equal(
        formulario.children[1].children[2].textContent,
        "La respuesta es obligatoria."
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.equal(
        vm.runInContext("publicaciones[0].comentarios[1].respuestas", contexto),
        undefined
    );
}

// Se guardan varias respuestas sin mezclar comentarios ni publicaciones.

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);
    cargarPublicacionesDePrueba(contexto);

    responder(elementos, "Ana", 1, "Elena", "Primera respuesta");
    responder(elementos, "Ana", 1, "Carlos", "Segunda respuesta");
    responder(elementos, "Luis", 0, "Daniel", "Respuesta en otra publicación");

    const guardadas = leerGuardadas(almacenamiento);

    assert.equal(guardadas[0].comentarios[0].respuestas, undefined);
    assert.equal(guardadas[0].comentarios[1].respuestas.length, 2);
    assert.equal(guardadas[0].comentarios[2].respuestas, undefined);
    assert.equal(guardadas[1].comentarios[0].respuestas.length, 1);

    const respuestas = [
        ...guardadas[0].comentarios[1].respuestas,
        ...guardadas[1].comentarios[0].respuestas
    ];

    assert.equal(new Set(respuestas.map(function (respuesta) {
        return respuesta.id;
    })).size, 3);

    respuestas.forEach(function (respuesta) {
        assert.equal(Number.isNaN(Date.parse(respuesta.fecha)), false);
    });

    const primeraRespuesta = seccionRespuestas(elementos, "Ana", 1)
        .children[1]
        .children[0];

    assert.equal(primeraRespuesta.children[0].children[0].textContent, "Elena");
    assert.equal(primeraRespuesta.children[0].children[1].tagName, "TIME");
    assert.equal(primeraRespuesta.children[1].textContent, "Primera respuesta");
}

// Una recarga conserva la relación publicación-comentario-respuesta.

{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);

    cargarPublicacionesDePrueba(primeraCarga.contexto);
    responder(
        primeraCarga.elementos,
        "Ana",
        1,
        "María",
        "Respuesta persistente"
    );

    const recarga = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[1].respuestas[0].texto",
            recarga.contexto
        ),
        "Respuesta persistente"
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].respuestas.length",
            recarga.contexto
        ),
        0
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[1].comentarios[0].respuestas.length",
            recarga.contexto
        ),
        0
    );
}

// Los comentarios antiguos reciben respuestas vacías y siguen funcionando.

{
    const almacenamiento = new Map();

    almacenamiento.set(
        "publicacionesRedSocial",
        JSON.stringify([
            {
                id: 30,
                nombre: "Publicación antigua",
                mensaje: "Comentario sin respuestas",
                comentarios: [
                    {
                        id: 31,
                        nombre: "Andrea",
                        texto: "Comentario anterior",
                        fecha: "2026-03-01T10:00:00.000Z"
                    }
                ]
            }
        ])
    );

    const { contexto, elementos } = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext(
            "Array.isArray(publicaciones[0].comentarios[0].respuestas)",
            contexto
        ),
        true
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].respuestas.length",
            contexto
        ),
        0
    );
    assert.equal(
        accionesComentario(elementos, "Publicación antigua", 0)
            .children[2]
            .textContent,
        "Responder"
    );

    responder(
        elementos,
        "Publicación antigua",
        0,
        "José",
        "Respuesta a datos anteriores"
    );

    assert.equal(
        leerGuardadas(almacenamiento)[0]
            .comentarios[0]
            .respuestas[0]
            .texto,
        "Respuesta a datos anteriores"
    );
}

console.log("H14: 5 pruebas completadas correctamente.");
