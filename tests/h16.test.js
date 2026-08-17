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

    focus() {}
    setSelectionRange() {}

    reset() {
        this.value = "";
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

function establecerPublicaciones(contexto) {
    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "Ana",
                mensaje: "Ciencias basicas",
                fecha: "2026-01-01T10:00:00.000Z",
                reacciones: { meGusta: 1, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            },
            {
                id: 2,
                nombre: "Luis",
                mensaje: "Segundo mensaje",
                fecha: "2026-01-02T10:00:00.000Z",
                reacciones: { meGusta: 2, meEncanta: 3, meDivierte: 4 },
                comentarios: [
                    {
                        id: 21,
                        nombre: "Laura",
                        texto: "Comentario intacto",
                        fecha: "2026-02-01T10:00:00.000Z",
                        respuestas: []
                    }
                ]
            },
            {
                id: 3,
                nombre: "Sofia",
                mensaje: "Ciencias aplicadas",
                fecha: "2026-01-03T10:00:00.000Z",
                reacciones: { meGusta: 5, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

function autoresVisibles(elementos) {
    return elementos
        .get("lista-publicaciones")
        .children
        .map(function (articulo) {
            return articulo.children[0].children[0].textContent;
        });
}

function articuloPorAutor(elementos, autor) {
    return elementos
        .get("lista-publicaciones")
        .children
        .find(function (articulo) {
            return articulo.children[0].children[0].textContent === autor;
        });
}

function botonFavorita(elementos, autor) {
    return articuloPorAutor(elementos, autor)
        .children[2]
        .children[1]
        .children
        .find(function (boton) {
            return boton.classList.contains("boton-favorita");
        });
}

function favoritas(contexto) {
    return JSON.parse(
        vm.runInContext(
            "JSON.stringify(publicaciones.map(function (publicacion) {" +
            " return publicacion.favorita; }))",
            contexto
        )
    );
}

// Existe el filtro para mostrar solo favoritas.

{
    const html = fs.readFileSync(
        path.join(__dirname, "..", "index.html"),
        "utf8"
    );

    assert.match(html, /id="filtro-favoritas"/);
}

// Marcar la segunda de tres publicaciones cambia solo esa publicacion.

{
    const { contexto, elementos, almacenamiento } = crearContexto();
    establecerPublicaciones(contexto);

    const actividadAntes = vm.runInContext(
        "JSON.stringify(publicaciones[1].reacciones) + " +
        "JSON.stringify(publicaciones[1].comentarios)",
        contexto
    );

    botonFavorita(elementos, "Luis").ejecutarEvento("click");

    assert.deepEqual(favoritas(contexto), [null, true, null]);
    assert.equal(
        articuloPorAutor(elementos, "Luis")
            .classList
            .contains("publicacion-favorita"),
        true
    );
    assert.equal(botonFavorita(elementos, "Luis").textContent, "Quitar de Favoritos");
    assert.equal(botonFavorita(elementos, "Ana").textContent, "Marcar Favorito");
    assert.equal(
        vm.runInContext(
            "JSON.stringify(publicaciones[1].reacciones) + " +
            "JSON.stringify(publicaciones[1].comentarios)",
            contexto
        ),
        actividadAntes
    );

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    assert.equal(guardadas[1].favorita, true);
    assert.equal(almacenamiento.has("favoritasRedSocial"), false);
}

// Quitar una favorita mientras esta activo el filtro la oculta.

{
    const { contexto, elementos } = crearContexto();
    establecerPublicaciones(contexto);

    botonFavorita(elementos, "Luis").ejecutarEvento("click");

    elementos.get("filtro-favoritas").checked = true;
    elementos.get("filtro-favoritas").ejecutarEvento("change");

    assert.deepEqual(autoresVisibles(elementos), ["Luis"]);

    botonFavorita(elementos, "Luis").ejecutarEvento("click");

    assert.deepEqual(autoresVisibles(elementos), []);
    assert.deepEqual(favoritas(contexto), [null, false, null]);
    assert.equal(
        elementos.get("mensaje-vacio").textContent,
        "No hay publicaciones favoritas."
    );
}

// Marcar despues de buscar y ordenar actualiza el id correcto.

{
    const { contexto, elementos } = crearContexto();
    establecerPublicaciones(contexto);

    elementos.get("buscador").value = "ciencias";
    elementos.get("buscador").ejecutarEvento("input");
    elementos.get("orden-publicaciones").value = "antiguas";
    elementos.get("orden-publicaciones").ejecutarEvento("change");

    assert.deepEqual(autoresVisibles(elementos), ["Ana", "Sofia"]);

    botonFavorita(elementos, "Sofia").ejecutarEvento("click");

    assert.equal(vm.runInContext("publicaciones[0].favorita", contexto), undefined);
    assert.equal(vm.runInContext("publicaciones[1].favorita", contexto), undefined);
    assert.equal(vm.runInContext("publicaciones[2].favorita", contexto), true);
}

// El estado se conserva al recargar y las publicaciones antiguas no son favoritas.

{
    const almacenamiento = new Map();
    const primeraCarga = crearContexto(almacenamiento);

    establecerPublicaciones(primeraCarga.contexto);
    botonFavorita(primeraCarga.elementos, "Luis").ejecutarEvento("click");

    const recarga = crearContexto(almacenamiento);

    assert.deepEqual(favoritas(recarga.contexto), [false, true, false]);

    const datosAntiguos = [{
        id: 20,
        nombre: "Anterior",
        mensaje: "Sin favorita",
        comentarios: []
    }];

    const almacenamientoAntiguo = new Map([
        ["publicacionesRedSocial", JSON.stringify(datosAntiguos)]
    ]);
    const antigua = crearContexto(almacenamientoAntiguo);

    assert.equal(
        vm.runInContext("publicaciones[0].favorita", antigua.contexto),
        false
    );
}

console.log("H16: 5 pruebas completadas correctamente.");
