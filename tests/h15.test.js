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

    return { contexto, elementos, almacenamiento };
}

function publicar(elementos, nombre, mensaje, etiqueta) {
    elementos.get("nombre").value = nombre;
    elementos.get("mensaje").value = mensaje;
    elementos.get("etiqueta").value = etiqueta;
    elementos.get("formulario-publicacion").ejecutarEvento("submit");
}

function cargarPublicacionesDePrueba(contexto) {
    vm.runInContext(`
        publicaciones = [
            {
                id: 1,
                nombre: "General Uno",
                mensaje: "Aviso general",
                fecha: "2026-01-01T10:00:00.000Z",
                etiqueta: "General",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            },
            {
                id: 2,
                nombre: "Estudio Uno",
                mensaje: "Álgebra especial",
                fecha: "2026-01-02T10:00:00.000Z",
                etiqueta: "Estudio",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            },
            {
                id: 3,
                nombre: "Estudio Dos",
                mensaje: "Lectura de literatura",
                fecha: "2026-01-03T10:00:00.000Z",
                etiqueta: "Estudio",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            },
            {
                id: 4,
                nombre: "Evento Uno",
                mensaje: "Feria universitaria",
                fecha: "2026-01-04T10:00:00.000Z",
                etiqueta: "Evento",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
                comentarios: []
            },
            {
                id: 5,
                nombre: "Ayuda Uno",
                mensaje: "Necesito orientación",
                fecha: "2026-01-05T10:00:00.000Z",
                etiqueta: "Ayuda",
                reacciones: { meGusta: 0, meEncanta: 0, meDivierte: 0 },
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

function etiquetaDibujada(elementos, autor) {
    const articulo = elementos
        .get("lista-publicaciones")
        .children
        .find(function (publicacion) {
            return publicacion.children[0].children[0].textContent === autor;
        });

    return articulo.children[0].children.find(function (elemento) {
        return elemento.classList.contains("etiqueta-publicacion");
    });
}

// El formulario y el filtro ofrecen todas las etiquetas requeridas.

{
    const rutaHtml = path.join(__dirname, "..", "index.html");
    const html = fs.readFileSync(rutaHtml, "utf8");

    assert.match(html, /id="etiqueta"/);
    assert.match(html, /id="filtro-etiqueta"/);

    ["General", "Estudio", "Evento", "Ayuda"].forEach(function (etiqueta) {
        assert.match(html, new RegExp(`value="${etiqueta}"`));
    });
}

// Se pueden crear dos publicaciones de cada etiqueta y recargarlas.

{
    const almacenamiento = new Map();
    const { elementos } = crearContexto(almacenamiento);

    ["General", "Estudio", "Evento", "Ayuda"].forEach(function (etiqueta) {
        publicar(elementos, `${etiqueta} 1`, "Primer mensaje", etiqueta);
        publicar(elementos, `${etiqueta} 2`, "Segundo mensaje", etiqueta);
    });

    const guardadas = JSON.parse(
        almacenamiento.get("publicacionesRedSocial")
    );

    ["General", "Estudio", "Evento", "Ayuda"].forEach(function (etiqueta) {
        assert.equal(
            guardadas.filter(function (publicacion) {
                return publicacion.etiqueta === etiqueta;
            }).length,
            2
        );
    });

    const recarga = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext(
            "publicaciones.filter(function (publicacion) {" +
            " return publicacion.etiqueta === 'Evento'; }).length",
            recarga.contexto
        ),
        2
    );
}

// Cada publicación muestra visualmente su etiqueta.

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    assert.equal(etiquetaDibujada(elementos, "General Uno").textContent, "General");
    assert.equal(etiquetaDibujada(elementos, "Estudio Uno").textContent, "Estudio");
    assert.equal(etiquetaDibujada(elementos, "Evento Uno").textContent, "Evento");
    assert.equal(etiquetaDibujada(elementos, "Ayuda Uno").textContent, "Ayuda");
}

// Filtrar cambia solo la lista visible y conserva el arreglo original.

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    const datosOriginales = vm.runInContext("JSON.stringify(publicaciones)", contexto);
    const filtro = elementos.get("filtro-etiqueta");

    const resultadosEsperados = {
        General: ["General Uno"],
        Estudio: ["Estudio Dos", "Estudio Uno"],
        Evento: ["Evento Uno"],
        Ayuda: ["Ayuda Uno"],
        Todas: ["Ayuda Uno", "Evento Uno", "Estudio Dos", "Estudio Uno", "General Uno"]
    };

    ["General", "Estudio", "Evento", "Ayuda", "Todas", "Estudio", "Todas"]
        .forEach(function (etiqueta) {
            filtro.value = etiqueta;
            filtro.ejecutarEvento("change");
            assert.deepEqual(autoresVisibles(elementos), resultadosEsperados[etiqueta]);
        });

    assert.equal(
        vm.runInContext("JSON.stringify(publicaciones)", contexto),
        datosOriginales
    );
}

// El filtro funciona junto con la búsqueda y el ordenamiento.

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    elementos.get("filtro-etiqueta").value = "Estudio";
    elementos.get("filtro-etiqueta").ejecutarEvento("change");

    elementos.get("buscador").value = "álgebra";
    elementos.get("buscador").ejecutarEvento("input");

    assert.deepEqual(autoresVisibles(elementos), ["Estudio Uno"]);

    elementos.get("limpiar-busqueda").ejecutarEvento("click");
    elementos.get("orden-publicaciones").value = "antiguas";
    elementos.get("orden-publicaciones").ejecutarEvento("change");

    assert.deepEqual(
        autoresVisibles(elementos),
        ["Estudio Uno", "Estudio Dos"]
    );
}

// Las publicaciones antiguas sin etiqueta aparecen como General.

{
    const almacenamiento = new Map([
        [
            "publicacionesRedSocial",
            JSON.stringify([
                {
                    id: 30,
                    nombre: "Publicación antigua",
                    mensaje: "Sin etiqueta",
                    comentarios: []
                }
            ])
        ]
    ]);

    const { contexto, elementos } = crearContexto(almacenamiento);

    assert.equal(
        vm.runInContext("publicaciones[0].etiqueta", contexto),
        "General"
    );
    assert.equal(
        etiquetaDibujada(elementos, "Publicación antigua").textContent,
        "General"
    );

    elementos.get("filtro-etiqueta").value = "General";
    elementos.get("filtro-etiqueta").ejecutarEvento("change");

    assert.deepEqual(autoresVisibles(elementos), ["Publicación antigua"]);
}

console.log("H15: 6 pruebas completadas correctamente.");
