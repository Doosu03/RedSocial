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

function cargarPublicacionesDePrueba(contexto) {
    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "Ana",
                mensaje: "Primer mensaje",
                fecha: "2026-01-01T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            },
            {
                id: 2,
                nombre: "Luis",
                mensaje: "Segundo mensaje",
                fecha: "2026-01-02T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            },
            {
                id: 3,
                nombre: "Eva",
                mensaje: "Tercer mensaje",
                fecha: "2026-01-03T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

function comentar(contexto, id, nombre, texto) {
    contexto.campoNombrePrueba = new ElementoFalso("input");
    contexto.campoTextoPrueba = new ElementoFalso("textarea");
    contexto.errorNombrePrueba = new ElementoFalso("small");
    contexto.errorTextoPrueba = new ElementoFalso("small");

    contexto.campoNombrePrueba.value = nombre;
    contexto.campoTextoPrueba.value = texto;

    vm.runInContext(
        `agregarComentario(
            ${id},
            campoNombrePrueba,
            campoTextoPrueba,
            errorNombrePrueba,
            errorTextoPrueba
        );`,
        contexto
    );

    return {
        errorNombre: contexto.errorNombrePrueba,
        errorTexto: contexto.errorTextoPrueba
    };
}

// Toda publicacion nueva inicia con su arreglo de comentarios

{
    const { elementos, almacenamiento } = crearContexto();

    elementos.get("nombre").value = "Sofia";
    elementos.get("mensaje").value = "Nueva publicacion";
    elementos.get("formulario-publicacion").ejecutarEvento("submit");

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.deepEqual(guardadas[0].comentarios, []);
}

// Ambos campos del comentario son obligatorios

{
    const { contexto, almacenamiento } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    const errores = comentar(contexto, 1, "   ", "   ");

    assert.equal(
        errores.errorNombre.textContent,
        "El nombre es obligatorio."
    );
    assert.equal(
        errores.errorTexto.textContent,
        "El comentario es obligatorio."
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.equal(
        vm.runInContext("publicaciones[0].comentarios.length", contexto),
        0
    );
}

// Se pueden agregar dos comentarios y comentar la segunda publicacion

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicacionesDePrueba(contexto);

    comentar(contexto, 1, "Marta", "Primer comentario");
    comentar(contexto, 1, "Pedro", "Segundo comentario");
    comentar(contexto, 2, "Laura", "Comentario en la segunda");

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.equal(guardadas[0].comentarios.length, 2);
    assert.equal(guardadas[1].comentarios.length, 1);
    assert.equal(guardadas[2].comentarios.length, 0);

    assert.equal(guardadas[0].comentarios[0].nombre, "Marta");
    assert.equal(
        guardadas[0].comentarios[0].texto,
        "Primer comentario"
    );
    assert.equal(guardadas[0].comentarios[1].nombre, "Pedro");
    assert.equal(guardadas[1].comentarios[0].nombre, "Laura");

    guardadas.forEach(function (publicacion) {
        publicacion.comentarios.forEach(function (comentario) {
            assert.equal(Number.isNaN(Date.parse(comentario.fecha)), false);
        });
    });

    const listaPublicaciones = elementos.get("lista-publicaciones");
    const publicacionUno = listaPublicaciones.children.find(
        function (articulo) {
            return articulo.children[0].children[0].textContent === "Ana";
        }
    );
    const publicacionDos = listaPublicaciones.children.find(
        function (articulo) {
            return articulo.children[0].children[0].textContent === "Luis";
        }
    );
    const primeraSeccionComentarios =
        publicacionUno.children[3];
    const segundaSeccionComentarios =
        publicacionDos.children[3];
    const primeraListaComentarios =
        primeraSeccionComentarios.children[1];
    const segundaListaComentarios =
        segundaSeccionComentarios.children[1];

    assert.equal(primeraListaComentarios.children.length, 2);
    assert.equal(segundaListaComentarios.children.length, 1);

    const primerComentario = primeraListaComentarios.children[0];
    const encabezado = primerComentario.children[0];

    assert.equal(encabezado.children[0].textContent, "Marta");
    assert.equal(encabezado.children[1].tagName, "TIME");
    assert.notEqual(encabezado.children[1].textContent, "");
    assert.equal(
        primerComentario.children[1].textContent,
        "Primer comentario"
    );


    // Una recarga conserva comentarios y su relacion

    const recarga = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext("publicaciones[0].comentarios.length", recarga.contexto),
        2
    );
    assert.equal(
        vm.runInContext("publicaciones[1].comentarios.length", recarga.contexto),
        1
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[1].comentarios[0].texto",
            recarga.contexto
        ),
        "Comentario en la segunda"
    );
}

// Las publicaciones antiguas reciben el arreglo sin perder comentarios existentes

{
    const almacenamiento = new Map();

    almacenamiento.set(
        "publicacionesRedSocial",
        JSON.stringify([
            {
                id: 10,
                nombre: "Publicacion antigua",
                mensaje: "Sin propiedad de comentarios"
            },
            {
                id: 11,
                nombre: "Publicacion reciente",
                mensaje: "Con un comentario",
                comentarios: [
                    {
                        id: 12,
                        nombre: "Carlos",
                        texto: "Comentario guardado",
                        fecha: "2026-02-01T10:00:00.000Z"
                    }
                ]
            }
        ])
    );

    const { contexto } = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext("Array.isArray(publicaciones[0].comentarios)", contexto),
        true
    );
    assert.equal(
        vm.runInContext("publicaciones[0].comentarios.length", contexto),
        0
    );
    assert.equal(
        vm.runInContext("publicaciones[1].comentarios.length", contexto),
        1
    );

    comentar(contexto, 10, "Elena", "Comentario en publicacion antigua");

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.equal(guardadas[0].comentarios.length, 1);
    assert.equal(
        guardadas[0].comentarios[0].texto,
        "Comentario en publicacion antigua"
    );
    assert.equal(guardadas[1].comentarios.length, 1);
}

console.log("H7: 5 pruebas completadas correctamente.");
