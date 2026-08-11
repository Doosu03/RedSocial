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
                nombre: "Ana Morales",
                mensaje: "Hoy estudiamos metodologias agiles",
                fecha: "2026-01-01T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            },
            {
                id: 2,
                nombre: "Luis Ramirez",
                mensaje: "Comparto mis apuntes de la clase",
                fecha: "2026-01-02T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            },
            {
                id: 3,
                nombre: "Mariana Solis",
                mensaje: "Nos vemos en el laboratorio",
                fecha: "2026-01-03T10:00:00.000Z",
                meGusta: 0,
                meGustaActivo: false,
                comentarios: []
            }
        ];
        mostrarPublicaciones();
    `, contexto);
}

// Nombres de los autores que quedaron visibles en la lista

function nombresVisibles(elementos) {
    return elementos
        .get("lista-publicaciones")
        .children
        .map(function (articulo) {
            const encabezado = articulo.children[0];

            return encabezado.children[0].textContent;
        });
}

// Escribir en el campo de busqueda

function escribirBusqueda(elementos, texto) {
    const campoBusqueda = elementos.get("buscador");

    campoBusqueda.value = texto;
    campoBusqueda.ejecutarEvento("input");
}

// Buscar parte de un nombre

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "mari");

    assert.deepEqual(nombresVisibles(elementos), ["Mariana Solis"]);
    assert.equal(elementos.get("mensaje-vacio").style.display, "none");
    assert.equal(
        elementos.get("resumen-busqueda").textContent,
        '1 publicación encontrada con "mari".'
    );


    // La busqueda no modifica las publicaciones guardadas

    assert.equal(
        vm.runInContext("publicaciones.length", contexto),
        3
    );
}

// Buscar una palabra del mensaje

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "apuntes");

    assert.deepEqual(nombresVisibles(elementos), ["Luis Ramirez"]);
    assert.equal(
        elementos.get("resumen-busqueda").textContent,
        '1 publicación encontrada con "apuntes".'
    );


    // Una palabra que aparece en dos publicaciones

    escribirBusqueda(elementos, "la");

    assert.deepEqual(
        nombresVisibles(elementos),
        ["Luis Ramirez", "Mariana Solis"]
    );
    assert.equal(
        elementos.get("resumen-busqueda").textContent,
        '2 publicaciones encontradas con "la".'
    );
}

// La busqueda no distingue mayusculas de minusculas

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "ana");
    const resultadoMinusculas = nombresVisibles(elementos);

    escribirBusqueda(elementos, "ANA");
    const resultadoMayusculas = nombresVisibles(elementos);

    escribirBusqueda(elementos, "AnA");
    const resultadoMezclado = nombresVisibles(elementos);

    assert.deepEqual(
        resultadoMinusculas,
        ["Ana Morales", "Mariana Solis"]
    );
    assert.deepEqual(resultadoMayusculas, resultadoMinusculas);
    assert.deepEqual(resultadoMezclado, resultadoMinusculas);


    // Tambien funciona con el texto del mensaje

    escribirBusqueda(elementos, "LABORATORIO");

    assert.deepEqual(nombresVisibles(elementos), ["Mariana Solis"]);
}

// Un texto inexistente informa al usuario

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "zzzz");

    const mensajeVacio = elementos.get("mensaje-vacio");

    assert.deepEqual(nombresVisibles(elementos), []);
    assert.equal(mensajeVacio.style.display, "block");
    assert.equal(
        mensajeVacio.textContent,
        'No se encontraron publicaciones con "zzzz".'
    );
    assert.equal(elementos.get("resumen-busqueda").textContent, "");
}

// Al limpiar el campo vuelven todas las publicaciones

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "zzzz");
    escribirBusqueda(elementos, "");

    assert.deepEqual(
        nombresVisibles(elementos),
        ["Ana Morales", "Luis Ramirez", "Mariana Solis"]
    );
    assert.equal(elementos.get("mensaje-vacio").style.display, "none");
    assert.equal(elementos.get("resumen-busqueda").textContent, "");


    // El boton "Limpiar" tambien devuelve la lista completa

    escribirBusqueda(elementos, "Luis");
    assert.deepEqual(nombresVisibles(elementos), ["Luis Ramirez"]);

    elementos.get("limpiar-busqueda").ejecutarEvento("click");

    assert.equal(elementos.get("buscador").value, "");
    assert.deepEqual(
        nombresVisibles(elementos),
        ["Ana Morales", "Luis Ramirez", "Mariana Solis"]
    );
}

// El boton "Buscar" filtra la lista con el texto escrito

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    elementos.get("buscador").value = "  RAMIREZ  ";
    elementos.get("formulario-busqueda").ejecutarEvento("submit");

    assert.deepEqual(nombresVisibles(elementos), ["Luis Ramirez"]);
}

// Sin publicaciones se conserva el mensaje original

{
    const { elementos } = crearContexto();

    const mensajeVacio = elementos.get("mensaje-vacio");

    assert.equal(mensajeVacio.style.display, "block");
    assert.equal(
        mensajeVacio.textContent,
        "Todavía no hay publicaciones."
    );
}

// Al publicar se limpia la busqueda para ver la nueva publicacion

{
    const { contexto, elementos } = crearContexto();
    cargarPublicacionesDePrueba(contexto);

    escribirBusqueda(elementos, "Ana");

    elementos.get("nombre").value = "Sofia";
    elementos.get("mensaje").value = "Nueva publicacion";
    elementos.get("formulario-publicacion").ejecutarEvento("submit");

    assert.equal(elementos.get("buscador").value, "");
    assert.deepEqual(
        nombresVisibles(elementos),
        ["Ana Morales", "Luis Ramirez", "Mariana Solis", "Sofia"]
    );
}

console.log("H8: 8 pruebas completadas correctamente.");
