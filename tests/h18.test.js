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
                return confirmacion.respuesta;
            }
        }
    });

    const rutaApp = path.join(__dirname, "..", "js", "app.js");
    const codigoApp = fs.readFileSync(rutaApp, "utf8");

    vm.runInContext(codigoApp, contexto);

    return { contexto, almacenamiento, elementos, confirmacion };
}

// Doce publicaciones numeradas, de la mas antigua a la mas reciente

function cargarPublicaciones(contexto, cantidad = 12) {
    const publicaciones = [];

    for (let numero = 1; numero <= cantidad; numero = numero + 1) {

        const dia = String(numero).padStart(2, "0");

        publicaciones.push({
            id: numero,
            nombre: `Autor ${numero}`,
            mensaje: numero % 2 === 0
                ? `Mensaje par ${numero}`
                : `Mensaje suelto ${numero}`,
            fecha: `2026-01-${dia}T10:00:00.000Z`,
            etiqueta: numero % 3 === 0 ? "Estudio" : "General",
            reacciones: {
                meGusta: 0,
                meEncanta: 0,
                meDivierte: 0
            },
            favorita: false,
            comentarios: []
        });
    }

    contexto.publicacionesDePrueba = publicaciones;

    vm.runInContext(`
        publicaciones = JSON.parse(
            JSON.stringify(publicacionesDePrueba)
        );
        mostrarPublicaciones();
    `, contexto);
}

// Autores dibujados en la pagina actual

function autoresVisibles(elementos) {
    return elementos
        .get("lista-publicaciones")
        .children
        .map(function (articulo) {
            return articulo.children[0].children[0].textContent;
        });
}

function indicador(elementos) {
    return elementos.get("indicador-pagina").textContent;
}

function botonAnterior(elementos) {
    return elementos.get("pagina-anterior");
}

function botonSiguiente(elementos) {
    return elementos.get("pagina-siguiente");
}

function escribirBusqueda(elementos, texto) {
    const campo = elementos.get("buscador");

    campo.value = texto;
    campo.ejecutarEvento("input");
}

function elegir(elementos, id, valor) {
    const control = elementos.get(id);

    control.value = valor;
    control.ejecutarEvento("change");
}

// La pagina muestra los controles de paginacion

{
    const html = fs.readFileSync(
        path.join(__dirname, "..", "index.html"),
        "utf8"
    );

    assert.match(html, /id="pagina-anterior"/);
    assert.match(html, /id="pagina-siguiente"/);
    assert.match(html, /id="indicador-pagina"/);
}

// Se muestran como maximo cinco publicaciones por pagina

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);


    // El orden inicial muestra primero las mas recientes

    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 12", "Autor 11", "Autor 10", "Autor 9", "Autor 8"]
    );
    assert.equal(indicador(elementos), "Página 1 de 3");
}

// Anterior se desactiva en la primera pagina y Siguiente en la ultima

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    assert.equal(botonAnterior(elementos).disabled, true);
    assert.equal(botonSiguiente(elementos).disabled, false);


    // Segunda pagina: ambos controles disponibles

    botonSiguiente(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 2 de 3");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 7", "Autor 6", "Autor 5", "Autor 4", "Autor 3"]
    );
    assert.equal(botonAnterior(elementos).disabled, false);
    assert.equal(botonSiguiente(elementos).disabled, false);


    // Ultima pagina: solo quedan dos publicaciones

    botonSiguiente(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 3 de 3");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 2", "Autor 1"]
    );
    assert.equal(botonAnterior(elementos).disabled, false);
    assert.equal(botonSiguiente(elementos).disabled, true);


    // Presionar Siguiente en la ultima pagina no cambia nada

    botonSiguiente(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 3 de 3");


    // Anterior regresa paso a paso

    botonAnterior(elementos).ejecutarEvento("click");
    assert.equal(indicador(elementos), "Página 2 de 3");

    botonAnterior(elementos).ejecutarEvento("click");
    assert.equal(indicador(elementos), "Página 1 de 3");
    assert.equal(botonAnterior(elementos).disabled, true);


    // Presionar Anterior en la primera pagina no cambia nada

    botonAnterior(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 1 de 3");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 12", "Autor 11", "Autor 10", "Autor 9", "Autor 8"]
    );
}

// Cambiar de pagina no modifica ni duplica datos

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicaciones(contexto);

    const antes = vm.runInContext(
        "JSON.stringify(publicaciones)",
        contexto
    );

    botonSiguiente(elementos).ejecutarEvento("click");
    botonSiguiente(elementos).ejecutarEvento("click");
    botonAnterior(elementos).ejecutarEvento("click");

    assert.equal(
        vm.runInContext("JSON.stringify(publicaciones)", contexto),
        antes
    );
    assert.equal(vm.runInContext("publicaciones.length", contexto), 12);


    // Ninguna publicacion aparece dos veces al recorrer las paginas

    elementos.get("pagina-anterior").ejecutarEvento("click");

    const primeraPagina = autoresVisibles(elementos);

    botonSiguiente(elementos).ejecutarEvento("click");
    const segundaPagina = autoresVisibles(elementos);

    botonSiguiente(elementos).ejecutarEvento("click");
    const terceraPagina = autoresVisibles(elementos);

    const todos = primeraPagina
        .concat(segundaPagina)
        .concat(terceraPagina);

    assert.equal(todos.length, 12);
    assert.equal(new Set(todos).size, 12);


    // Recorrer las paginas no escribe en LocalStorage

    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
}

// Buscar recalcula la cantidad de paginas

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);


    // Seis publicaciones pares: dos paginas

    escribirBusqueda(elementos, "par");

    assert.equal(indicador(elementos), "Página 1 de 2");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 12", "Autor 10", "Autor 8", "Autor 6", "Autor 4"]
    );

    botonSiguiente(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 2 de 2");
    assert.deepEqual(autoresVisibles(elementos), ["Autor 2"]);
    assert.equal(botonSiguiente(elementos).disabled, true);


    // Una busqueda nueva regresa a la primera pagina

    escribirBusqueda(elementos, "Autor 1");

    assert.equal(indicador(elementos), "Página 1 de 1");
    assert.equal(botonAnterior(elementos).disabled, true);
    assert.equal(botonSiguiente(elementos).disabled, true);


    // Limpiar la busqueda devuelve las tres paginas

    escribirBusqueda(elementos, "");

    assert.equal(indicador(elementos), "Página 1 de 3");


    // Sin coincidencias se ocultan los controles

    escribirBusqueda(elementos, "zzzz");

    assert.equal(elementos.get("paginacion").style.display, "none");
    assert.equal(indicador(elementos), "");
    assert.deepEqual(autoresVisibles(elementos), []);
}

// Filtrar y ordenar recalculan la cantidad de paginas

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    botonSiguiente(elementos).ejecutarEvento("click");
    assert.equal(indicador(elementos), "Página 2 de 3");


    // Cuatro publicaciones de Estudio: una pagina, desde la primera

    elegir(elementos, "filtro-etiqueta", "Estudio");

    assert.equal(indicador(elementos), "Página 1 de 1");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 12", "Autor 9", "Autor 6", "Autor 3"]
    );


    // Volver a todas las etiquetas recalcula las tres paginas

    elegir(elementos, "filtro-etiqueta", "Todas");

    assert.equal(indicador(elementos), "Página 1 de 3");


    // Ordenar tambien regresa a la primera pagina

    botonSiguiente(elementos).ejecutarEvento("click");
    assert.equal(indicador(elementos), "Página 2 de 3");

    elegir(elementos, "orden-publicaciones", "antiguas");

    assert.equal(indicador(elementos), "Página 1 de 3");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 1", "Autor 2", "Autor 3", "Autor 4", "Autor 5"]
    );


    // El filtro de favoritas tambien recalcula

    const filtro = elementos.get("filtro-favoritas");

    filtro.checked = true;
    filtro.ejecutarEvento("change");

    assert.equal(elementos.get("paginacion").style.display, "none");
    assert.deepEqual(autoresVisibles(elementos), []);
}

// Al eliminar la ultima publicacion de una pagina se pasa a una valida

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicaciones(contexto, 11);


    // Tres paginas: la tercera tiene una sola publicacion

    botonSiguiente(elementos).ejecutarEvento("click");
    botonSiguiente(elementos).ejecutarEvento("click");

    assert.equal(indicador(elementos), "Página 3 de 3");
    assert.deepEqual(autoresVisibles(elementos), ["Autor 1"]);


    // Al eliminarla la vista retrocede a la pagina dos

    vm.runInContext("eliminarPublicacion(1);", contexto);

    assert.equal(indicador(elementos), "Página 2 de 2");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 6", "Autor 5", "Autor 4", "Autor 3", "Autor 2"]
    );
    assert.equal(botonSiguiente(elementos).disabled, true);
    assert.equal(vm.runInContext("publicaciones.length", contexto), 10);


    // Eliminar otra publicacion mantiene la pagina valida

    vm.runInContext("eliminarPublicacion(2);", contexto);

    assert.equal(indicador(elementos), "Página 2 de 2");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 6", "Autor 5", "Autor 4", "Autor 3"]
    );


    // Al quedar solo cinco publicaciones se vuelve a la primera pagina

    [3, 4, 5, 6].forEach(function (identificador) {
        vm.runInContext(`eliminarPublicacion(${identificador});`, contexto);
    });

    assert.equal(indicador(elementos), "Página 1 de 1");
    assert.deepEqual(
        autoresVisibles(elementos),
        ["Autor 11", "Autor 10", "Autor 9", "Autor 8", "Autor 7"]
    );
    assert.equal(botonAnterior(elementos).disabled, true);
    assert.equal(botonSiguiente(elementos).disabled, true);
    assert.equal(vm.runInContext("publicaciones.length", contexto), 5);
}

// Publicar un mensaje nuevo lo muestra en la primera pagina

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto);

    botonSiguiente(elementos).ejecutarEvento("click");
    botonSiguiente(elementos).ejecutarEvento("click");
    assert.equal(indicador(elementos), "Página 3 de 3");

    elementos.get("nombre").value = "Sofia";
    elementos.get("mensaje").value = "Publicacion recien creada";
    elementos.get("formulario-publicacion").ejecutarEvento("submit");

    assert.equal(indicador(elementos), "Página 1 de 3");
    assert.equal(autoresVisibles(elementos)[0], "Sofia");
    assert.equal(vm.runInContext("publicaciones.length", contexto), 13);
}

// Con cinco publicaciones o menos hay una sola pagina

{
    const { contexto, elementos } = crearContexto();
    cargarPublicaciones(contexto, 5);

    assert.equal(indicador(elementos), "Página 1 de 1");
    assert.equal(elementos.get("paginacion").style.display, "flex");
    assert.equal(botonAnterior(elementos).disabled, true);
    assert.equal(botonSiguiente(elementos).disabled, true);
    assert.equal(autoresVisibles(elementos).length, 5);


    // Sin publicaciones no se muestran los controles

    const listaVacia = crearContexto();

    assert.equal(
        listaVacia.elementos.get("paginacion").style.display,
        "none"
    );
}

console.log("H18: 9 pruebas completadas correctamente.");
