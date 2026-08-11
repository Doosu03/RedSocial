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

function crearContexto(
    almacenamiento = new Map(),
    confirmacion = { respuesta: true }
) {
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
                return confirmacion.respuesta;
            }
        }
    });

    const rutaApp = path.join(__dirname, "..", "js", "app.js");
    const codigoApp = fs.readFileSync(rutaApp, "utf8");

    vm.runInContext(codigoApp, contexto);

    return { contexto, almacenamiento, elementos, confirmacion };
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
                    }
                ]
            },
            {
                id: 2,
                nombre: "Luis",
                mensaje: "Segundo mensaje",
                fecha: "2026-01-02T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: [
                    {
                        id: 21,
                        nombre: "Laura",
                        texto: "Comentario de Luis",
                        fecha: "2026-02-03T10:00:00.000Z"
                    }
                ]
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

// La publicacion dibujada del autor indicado

function articuloDePublicacion(elementos, autor) {
    return elementos
        .get("lista-publicaciones")
        .children
        .find(function (articulo) {
            return articulo.children[0].children[0].textContent === autor;
        });
}

// Los comentarios dibujados dentro de una publicacion

function comentariosDibujados(elementos, autor) {
    return articuloDePublicacion(elementos, autor)
        .children[3]
        .children[1]
        .children;
}

// El comentario dibujado en la posicion indicada

function comentarioDibujado(elementos, autor, posicion) {
    return comentariosDibujados(elementos, autor)[posicion];
}

// Botones "Editar" y "Eliminar" de un comentario

function accionesComentario(elementos, autor, posicion) {
    return comentarioDibujado(elementos, autor, posicion).children[2];
}

// Formulario que aparece al editar un comentario

function formularioEdicion(elementos, autor, posicion) {
    return comentarioDibujado(elementos, autor, posicion).children[1];
}

// Datos guardados en LocalStorage

function leerGuardadas(almacenamiento) {
    return JSON.parse(almacenamiento.get("publicacionesRedSocial"));
}

// Cada comentario muestra las acciones Editar y Eliminar

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    assert.equal(comentariosDibujados(elementos, "Ana").length, 2);

    [0, 1].forEach(function (posicion) {
        const acciones = accionesComentario(elementos, "Ana", posicion);

        assert.equal(acciones.children[0].textContent, "Editar");
        assert.equal(acciones.children[1].textContent, "Eliminar");
    });

    const accionesDeLuis = accionesComentario(elementos, "Luis", 0);

    assert.equal(accionesDeLuis.children[0].textContent, "Editar");
    assert.equal(accionesDeLuis.children[1].textContent, "Eliminar");
}

// Al editar se carga unicamente el comentario seleccionado

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    accionesComentario(elementos, "Ana", 1)
        .children[0]
        .ejecutarEvento("click");

    const formulario = formularioEdicion(elementos, "Ana", 1);
    const campoEdicion = formulario.children[1];

    assert.equal(formulario.tagName, "FORM");
    assert.equal(campoEdicion.tagName, "TEXTAREA");
    assert.equal(campoEdicion.value, "Segundo comentario");
    assert.equal(campoEdicion.tieneFoco, true);


    // El resto de los comentarios sigue mostrando su texto

    const primerComentario = comentarioDibujado(elementos, "Ana", 0);

    assert.equal(primerComentario.children[1].tagName, "P");
    assert.equal(primerComentario.children[1].textContent, "Primer comentario");
    assert.equal(primerComentario.children[2].children[0].textContent, "Editar");

    const comentarioDeLuis = comentarioDibujado(elementos, "Luis", 0);

    assert.equal(comentarioDeLuis.children[1].tagName, "P");
    assert.equal(
        comentarioDeLuis.children[1].textContent,
        "Comentario de Luis"
    );


    // El autor y la fecha se siguen viendo mientras se edita

    const encabezado = comentarioDibujado(elementos, "Ana", 1).children[0];

    assert.equal(encabezado.children[0].textContent, "Pedro");
    assert.equal(encabezado.children[1].tagName, "TIME");


    // "Cancelar" devuelve el comentario sin cambiarlo

    formulario.children[3].children[1].ejecutarEvento("click");

    assert.equal(
        comentarioDibujado(elementos, "Ana", 1).children[1].textContent,
        "Segundo comentario"
    );
}

// No se guarda un comentario vacio ni uno de solo espacios

{
    const { contexto, elementos, almacenamiento } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    accionesComentario(elementos, "Ana", 0)
        .children[0]
        .ejecutarEvento("click");

    ["", "   "].forEach(function (textoInvalido) {

        const formulario = formularioEdicion(elementos, "Ana", 0);
        const campoEdicion = formulario.children[1];
        const errorEdicion = formulario.children[2];

        campoEdicion.value = textoInvalido;
        formulario.ejecutarEvento("submit");

        assert.equal(
            errorEdicion.textContent,
            "El comentario no puede estar vacío."
        );
        assert.equal(campoEdicion.classList.contains("campo-invalido"), true);


        // El comentario original no cambio y sigue en edicion

        assert.equal(
            vm.runInContext("publicaciones[0].comentarios[0].texto", contexto),
            "Primer comentario"
        );
        assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
        assert.equal(
            formularioEdicion(elementos, "Ana", 0).tagName,
            "FORM"
        );
    });
}

// Al guardar se conservan el autor y la fecha original

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicacionesDePrueba(contexto);

    accionesComentario(elementos, "Ana", 0)
        .children[0]
        .ejecutarEvento("click");

    const formulario = formularioEdicion(elementos, "Ana", 0);

    formulario.children[1].value = "  Comentario corregido  ";
    formulario.ejecutarEvento("submit");

    const guardadas = leerGuardadas(almacenamiento);
    const comentarioEditado = guardadas[0].comentarios[0];

    assert.equal(comentarioEditado.texto, "Comentario corregido");
    assert.equal(comentarioEditado.nombre, "Marta");
    assert.equal(comentarioEditado.fecha, "2026-02-01T10:00:00.000Z");
    assert.equal(comentarioEditado.id, 11);


    // Solo cambio el comentario seleccionado

    assert.equal(guardadas[0].comentarios.length, 2);
    assert.equal(guardadas[0].comentarios[1].texto, "Segundo comentario");
    assert.equal(guardadas[1].comentarios[0].texto, "Comentario de Luis");
    assert.equal(guardadas[0].mensaje, "Primer mensaje");


    // La lista vuelve a mostrar el texto con sus acciones

    const comentario = comentarioDibujado(elementos, "Ana", 0);

    assert.equal(comentario.children[1].tagName, "P");
    assert.equal(comentario.children[1].textContent, "Comentario corregido");
    assert.equal(comentario.children[2].children[0].textContent, "Editar");


    // Los cambios permanecen despues de recargar la pagina

    const recarga = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].texto",
            recarga.contexto
        ),
        "Comentario corregido"
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].nombre",
            recarga.contexto
        ),
        "Marta"
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].fecha",
            recarga.contexto
        ),
        "2026-02-01T10:00:00.000Z"
    );
}

// Antes de eliminar se solicita confirmacion

{
    const almacenamiento = new Map();
    const confirmacion = { respuesta: false };

    const { contexto, elementos } = crearContexto(
        almacenamiento,
        confirmacion
    );

    cargarPublicacionesDePrueba(contexto);


    // Al cancelar la confirmacion no se elimina nada

    accionesComentario(elementos, "Ana", 0)
        .children[1]
        .ejecutarEvento("click");

    assert.equal(
        vm.runInContext("publicaciones[0].comentarios.length", contexto),
        2
    );
    assert.equal(comentariosDibujados(elementos, "Ana").length, 2);
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);


    // Al aceptar se elimina solo ese comentario

    confirmacion.respuesta = true;

    accionesComentario(elementos, "Ana", 0)
        .children[1]
        .ejecutarEvento("click");

    const guardadas = leerGuardadas(almacenamiento);

    assert.equal(guardadas[0].comentarios.length, 1);
    assert.equal(guardadas[0].comentarios[0].texto, "Segundo comentario");
    assert.equal(guardadas[1].comentarios.length, 1);
    assert.equal(guardadas[1].comentarios[0].texto, "Comentario de Luis");
    assert.equal(guardadas.length, 2);

    assert.equal(comentariosDibujados(elementos, "Ana").length, 1);
    assert.equal(comentariosDibujados(elementos, "Luis").length, 1);


    // El comentario eliminado no vuelve al recargar la pagina

    const recarga = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext("publicaciones[0].comentarios.length", recarga.contexto),
        1
    );
    assert.equal(
        vm.runInContext(
            "publicaciones[0].comentarios[0].texto",
            recarga.contexto
        ),
        "Segundo comentario"
    );
}

// Editar y eliminar afectan solo a la publicacion seleccionada

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicacionesDePrueba(contexto);


    // Se edita el comentario de la segunda publicacion

    accionesComentario(elementos, "Luis", 0)
        .children[0]
        .ejecutarEvento("click");

    const formulario = formularioEdicion(elementos, "Luis", 0);

    formulario.children[1].value = "Comentario editado de Luis";
    formulario.ejecutarEvento("submit");


    // Se elimina el segundo comentario de la primera publicacion

    accionesComentario(elementos, "Ana", 1)
        .children[1]
        .ejecutarEvento("click");

    const guardadas = leerGuardadas(almacenamiento);

    assert.equal(guardadas[0].comentarios.length, 1);
    assert.equal(guardadas[0].comentarios[0].texto, "Primer comentario");
    assert.equal(guardadas[0].comentarios[0].nombre, "Marta");

    assert.equal(guardadas[1].comentarios.length, 1);
    assert.equal(
        guardadas[1].comentarios[0].texto,
        "Comentario editado de Luis"
    );
    assert.equal(guardadas[1].comentarios[0].nombre, "Laura");
    assert.equal(
        guardadas[1].comentarios[0].fecha,
        "2026-02-03T10:00:00.000Z"
    );
}

// Cada comentario nuevo recibe un identificador distinto

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicacionesDePrueba(contexto);


    // Comentar dos veces seguidas en la misma publicacion

    [
        "Comentario nuevo uno",
        "Comentario nuevo dos"
    ].forEach(function (texto) {

        const formularioComentario = articuloDePublicacion(elementos, "Ana")
            .children[3]
            .children[2];

        formularioComentario.children[0].children[1].value = "Sofia";
        formularioComentario.children[1].children[1].value = texto;
        formularioComentario.ejecutarEvento("submit");
    });

    const comentarios = leerGuardadas(almacenamiento)[0].comentarios;
    const identificadores = new Set(
        comentarios.map(function (comentario) {
            return comentario.id;
        })
    );

    assert.equal(comentarios.length, 4);
    assert.equal(identificadores.size, 4);


    // Eliminar uno de ellos no arrastra al otro

    accionesComentario(elementos, "Ana", 2)
        .children[1]
        .ejecutarEvento("click");

    const restantes = leerGuardadas(almacenamiento)[0].comentarios;

    assert.equal(restantes.length, 3);
    assert.deepEqual(
        restantes.map(function (comentario) {
            return comentario.texto;
        }),
        [
            "Primer comentario",
            "Segundo comentario",
            "Comentario nuevo dos"
        ]
    );
}

// Los comentarios guardados sin identificador reciben uno

{
    const almacenamiento = new Map();

    almacenamiento.set(
        "publicacionesRedSocial",
        JSON.stringify([
            {
                id: 30,
                nombre: "Publicacion antigua",
                mensaje: "Comentarios sin identificador",
                comentarios: [
                    {
                        nombre: "Carlos",
                        texto: "Comentario sin id",
                        fecha: "2026-03-01T10:00:00.000Z"
                    },
                    {
                        nombre: "Elena",
                        texto: "Otro comentario sin id",
                        fecha: "2026-03-02T10:00:00.000Z"
                    }
                ]
            }
        ])
    );

    const { contexto, elementos } = crearContexto(almacenamiento);

    const identificadores = vm.runInContext(
        "publicaciones[0].comentarios.map(function (comentario) {"
        + " return comentario.id; })",
        contexto
    );

    assert.equal(new Set(identificadores).size, 2);


    // Se puede eliminar uno solo de ellos

    accionesComentario(elementos, "Publicacion antigua", 0)
        .children[1]
        .ejecutarEvento("click");

    const restantes = leerGuardadas(almacenamiento)[0].comentarios;

    assert.equal(restantes.length, 1);
    assert.equal(restantes[0].texto, "Otro comentario sin id");
    assert.equal(restantes[0].nombre, "Elena");
}

console.log("H12: 8 pruebas completadas correctamente.");
