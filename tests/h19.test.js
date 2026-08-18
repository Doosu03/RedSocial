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
        this.fueClickeado = false;
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

    click() {
        this.fueClickeado = true;

        if (typeof this.eventos.click === "function") {
            this.ejecutarEvento("click");
        }
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

// Sustituto de Blob que conserva el texto recibido

class BlobFalso {
    constructor(partes, opciones = {}) {
        this.texto = partes.join("");
        this.type = opciones.type;
    }
}

// Sustituto de File con el contenido que leera FileReader

function crearArchivoFalso(texto, falla = false) {
    return { texto: texto, falla: falla };
}

function crearContexto(
    almacenamiento = new Map(),
    confirmacion = { respuesta: true }
) {
    const elementos = new Map();
    const anclas = [];
    const descargas = [];
    const liberadas = [];

    class LectorFalso {
        readAsText(archivo) {

            if (archivo.falla) {

                if (typeof this.onerror === "function") {
                    this.onerror();
                }

                return;
            }

            this.result = archivo.texto;

            if (typeof this.onload === "function") {
                this.onload();
            }
        }
    }

    const contexto = vm.createContext({
        console,
        setTimeout(funcion) {
            funcion();
        },
        Blob: BlobFalso,
        FileReader: LectorFalso,
        URL: {
            createObjectURL(archivo) {
                descargas.push(archivo);

                return `blob:respaldo-${descargas.length}`;
            },
            revokeObjectURL(direccion) {
                liberadas.push(direccion);
            }
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
                const elemento = new ElementoFalso(etiqueta);

                if (elemento.tagName === "A") {
                    anclas.push(elemento);
                }

                return elemento;
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

    return {
        contexto,
        almacenamiento,
        elementos,
        confirmacion,
        anclas,
        descargas,
        liberadas
    };
}

// Publicaciones con comentarios, respuestas, reacciones y etiquetas

const PUBLICACIONES_COMPLETAS = [
    {
        id: 1,
        nombre: "Ana",
        mensaje: "Primer mensaje",
        fecha: "2026-01-01T10:00:00.000Z",
        etiqueta: "Estudio",
        reacciones: {
            meGusta: 3,
            meEncanta: 2,
            meDivierte: 1
        },
        favorita: true,
        comentarios: [
            {
                id: 11,
                nombre: "Marta",
                texto: "Primer comentario",
                fecha: "2026-01-02T10:00:00.000Z",
                respuestas: [
                    {
                        id: 111,
                        nombre: "Pedro",
                        texto: "Respuesta al comentario",
                        fecha: "2026-01-03T10:00:00.000Z"
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        nombre: "Luis",
        mensaje: "Segundo mensaje",
        fecha: "2026-01-04T10:00:00.000Z",
        etiqueta: "General",
        reacciones: {
            meGusta: 0,
            meEncanta: 0,
            meDivierte: 0
        },
        favorita: false,
        comentarios: []
    }
];

function cargarPublicaciones(contexto, lista = PUBLICACIONES_COMPLETAS) {
    contexto.publicacionesDePrueba = lista;

    vm.runInContext(`
        publicaciones = JSON.parse(
            JSON.stringify(publicacionesDePrueba)
        );
        mostrarPublicaciones();
    `, contexto);
}

function leerPublicaciones(contexto) {
    return JSON.parse(
        vm.runInContext("JSON.stringify(publicaciones)", contexto)
    );
}

function importar(contexto, contenido) {
    contexto.contenidoDePrueba = contenido;

    return vm.runInContext(
        "importarRespaldo(contenidoDePrueba)",
        contexto
    );
}

function autoresVisibles(elementos) {
    return elementos
        .get("lista-publicaciones")
        .children
        .map(function (articulo) {
            return articulo.children[0].children[0].textContent;
        });
}

function mensaje(elementos) {
    return elementos.get("mensaje-respaldo").textContent;
}

// La pagina declara las acciones de exportar e importar

{
    const html = fs.readFileSync(
        path.join(__dirname, "..", "index.html"),
        "utf8"
    );

    assert.match(html, /id="exportar-respaldo"/);
    assert.match(html, /id="importar-respaldo"/);
    assert.match(html, /type="file"/);
    assert.match(html, /id="mensaje-respaldo"/);
}

// Exportar descarga un JSON con todas las publicaciones

{
    const { contexto, elementos, anclas, descargas, liberadas } =
        crearContexto();

    cargarPublicaciones(contexto);

    elementos.get("exportar-respaldo").ejecutarEvento("click");

    assert.equal(descargas.length, 1);
    assert.equal(descargas[0].type, "application/json");
    assert.equal(anclas.length, 1);


    // El enlace se descarga con la fecha en el nombre

    const enlace = anclas[0];

    assert.match(
        enlace.download,
        /^respaldo-red-social-\d{4}-\d{2}-\d{2}\.json$/
    );
    assert.equal(enlace.href, "blob:respaldo-1");
    assert.equal(enlace.fueClickeado, true);
    assert.deepEqual(liberadas, ["blob:respaldo-1"]);


    // El archivo contiene las publicaciones y sus datos relacionados

    const respaldo = JSON.parse(descargas[0].texto);

    assert.equal(respaldo.aplicacion, "Red Social");
    assert.equal(respaldo.version, 1);
    assert.equal(Number.isNaN(Date.parse(respaldo.fecha)), false);
    assert.deepEqual(respaldo.publicaciones, PUBLICACIONES_COMPLETAS);

    assert.equal(mensaje(elementos), "Se exportaron 2 publicaciones.");


    // Una sola publicacion se anuncia en singular

    cargarPublicaciones(contexto, [PUBLICACIONES_COMPLETAS[0]]);
    elementos.get("exportar-respaldo").ejecutarEvento("click");

    assert.equal(mensaje(elementos), "Se exportó 1 publicación.");
}

// Antes de reemplazar los datos se solicita confirmacion

{
    const almacenamiento = new Map();
    const confirmacion = { respuesta: false };

    const { contexto, elementos } = crearContexto(
        almacenamiento,
        confirmacion
    );

    cargarPublicaciones(contexto, [PUBLICACIONES_COMPLETAS[1]]);

    const respaldo = JSON.stringify({
        publicaciones: [PUBLICACIONES_COMPLETAS[0]]
    });


    // Al cancelar la confirmacion no se cambia nada

    assert.equal(importar(contexto, respaldo), false);

    assert.deepEqual(
        leerPublicaciones(contexto),
        [PUBLICACIONES_COMPLETAS[1]]
    );
    assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
    assert.deepEqual(autoresVisibles(elementos), ["Luis"]);
    assert.equal(
        mensaje(elementos),
        "Se canceló la importación. No se modificó ninguna publicación."
    );


    // Al aceptar se reemplazan las publicaciones

    confirmacion.respuesta = true;

    assert.equal(importar(contexto, respaldo), true);

    assert.deepEqual(
        leerPublicaciones(contexto),
        [PUBLICACIONES_COMPLETAS[0]]
    );
    assert.equal(mensaje(elementos), "Se importó 1 publicación.");
}

// Un respaldo valido restaura todos los datos relacionados

{
    const origen = crearContexto();

    cargarPublicaciones(origen.contexto);
    origen.elementos.get("exportar-respaldo").ejecutarEvento("click");

    const archivoExportado = origen.descargas[0].texto;


    // Se importa en otra sesion con publicaciones distintas

    const almacenamiento = new Map();
    const destino = crearContexto(almacenamiento);

    cargarPublicaciones(destino.contexto, [
        {
            id: 99,
            nombre: "Otra",
            mensaje: "Publicacion que sera reemplazada",
            fecha: "2026-05-05T10:00:00.000Z",
            etiqueta: "Ayuda",
            reacciones: {
                meGusta: 7,
                meEncanta: 0,
                meDivierte: 0
            },
            favorita: false,
            comentarios: []
        }
    ]);

    assert.equal(importar(destino.contexto, archivoExportado), true);

    const restauradas = leerPublicaciones(destino.contexto);

    assert.deepEqual(restauradas, PUBLICACIONES_COMPLETAS);


    // Comentarios, respuestas, reacciones, etiqueta y favorita

    assert.equal(restauradas[0].comentarios.length, 1);
    assert.equal(restauradas[0].comentarios[0].nombre, "Marta");
    assert.equal(restauradas[0].comentarios[0].respuestas.length, 1);
    assert.equal(
        restauradas[0].comentarios[0].respuestas[0].texto,
        "Respuesta al comentario"
    );
    assert.deepEqual(
        restauradas[0].reacciones,
        { meGusta: 3, meEncanta: 2, meDivierte: 1 }
    );
    assert.equal(restauradas[0].etiqueta, "Estudio");
    assert.equal(restauradas[0].favorita, true);


    // La interfaz se actualiza con las publicaciones importadas

    assert.deepEqual(
        autoresVisibles(destino.elementos),
        ["Luis", "Ana"]
    );
    assert.equal(
        destino.elementos.get("total-publicaciones").textContent,
        2
    );
    assert.equal(
        destino.elementos.get("total-comentarios").textContent,
        1
    );


    // Los datos permanecen al recargar la pagina

    const recarga = crearContexto(almacenamiento);

    assert.deepEqual(
        leerPublicaciones(recarga.contexto),
        PUBLICACIONES_COMPLETAS
    );
}

// Tambien se acepta un archivo que solo contiene el arreglo

{
    const { contexto } = crearContexto();

    cargarPublicaciones(contexto, [PUBLICACIONES_COMPLETAS[1]]);

    assert.equal(
        importar(contexto, JSON.stringify(PUBLICACIONES_COMPLETAS)),
        true
    );
    assert.deepEqual(
        leerPublicaciones(contexto),
        PUBLICACIONES_COMPLETAS
    );
}

// Un archivo invalido muestra un mensaje y conserva los datos

{
    const archivosInvalidos = [
        "esto no es json",
        "",
        "{}",
        "[1, 2, 3]",
        '{"publicaciones": "texto"}',
        '{"publicaciones": [{"nombre": "Ana"}]}',
        '[{"id": 1, "nombre": "Ana"}]',
        '[{"id": 1, "nombre": 5, "mensaje": "Hola"}]',
        '"solo un texto"',
        "null"
    ];

    archivosInvalidos.forEach(function (archivo) {

        const almacenamiento = new Map();
        const { contexto, elementos } = crearContexto(almacenamiento);

        cargarPublicaciones(contexto);

        assert.equal(
            importar(contexto, archivo),
            false,
            `Se acepto un archivo invalido: ${archivo}`
        );

        assert.deepEqual(
            leerPublicaciones(contexto),
            PUBLICACIONES_COMPLETAS,
            `Se modificaron los datos con: ${archivo}`
        );
        assert.equal(almacenamiento.has("publicacionesRedSocial"), false);
        assert.equal(
            mensaje(elementos),
            "El archivo no es un respaldo válido. " +
            "No se modificó ninguna publicación."
        );
        assert.equal(
            elementos
                .get("mensaje-respaldo")
                .classList
                .contains("mensaje-respaldo-error"),
            true
        );


        // La lista sigue mostrando las publicaciones actuales

        assert.deepEqual(autoresVisibles(elementos), ["Luis", "Ana"]);
    });
}

// Un respaldo vacio es valido y deja la lista sin publicaciones

{
    const { contexto, elementos } = crearContexto();

    cargarPublicaciones(contexto);

    assert.equal(
        importar(contexto, '{"publicaciones": []}'),
        true
    );
    assert.deepEqual(leerPublicaciones(contexto), []);
    assert.deepEqual(autoresVisibles(elementos), []);
    assert.equal(mensaje(elementos), "Se importaron 0 publicaciones.");
    assert.equal(
        elementos.get("mensaje-vacio").textContent,
        "Todavía no hay publicaciones."
    );
}

// Elegir un archivo en el campo dispara la importacion

{
    const almacenamiento = new Map();
    const { contexto, elementos } = crearContexto(almacenamiento);

    cargarPublicaciones(contexto, [PUBLICACIONES_COMPLETAS[1]]);

    const campo = elementos.get("importar-respaldo");


    // Sin archivo seleccionado no ocurre nada

    campo.files = [];
    campo.ejecutarEvento("change");

    assert.deepEqual(
        leerPublicaciones(contexto),
        [PUBLICACIONES_COMPLETAS[1]]
    );
    assert.equal(mensaje(elementos), "");


    // Con un archivo valido se restauran las publicaciones

    campo.files = [
        crearArchivoFalso(
            JSON.stringify({ publicaciones: PUBLICACIONES_COMPLETAS })
        )
    ];
    campo.value = "C:\\respaldo.json";
    campo.ejecutarEvento("change");

    assert.deepEqual(
        leerPublicaciones(contexto),
        PUBLICACIONES_COMPLETAS
    );
    assert.equal(mensaje(elementos), "Se importaron 2 publicaciones.");


    // El campo queda vacio para poder elegir el mismo archivo

    assert.equal(campo.value, "");


    // Un error de lectura avisa sin cambiar los datos

    campo.files = [crearArchivoFalso("", true)];
    campo.ejecutarEvento("change");

    assert.deepEqual(
        leerPublicaciones(contexto),
        PUBLICACIONES_COMPLETAS
    );
    assert.equal(
        mensaje(elementos),
        "No se pudo leer el archivo seleccionado."
    );
}

// Importar vuelve a la primera pagina y cierra los formularios abiertos

{
    const listaLarga = [];

    for (let numero = 1; numero <= 12; numero = numero + 1) {
        listaLarga.push({
            id: numero,
            nombre: `Autor ${numero}`,
            mensaje: `Mensaje ${numero}`,
            fecha: `2026-02-${String(numero).padStart(2, "0")}T10:00:00.000Z`,
            etiqueta: "General",
            reacciones: {
                meGusta: 0,
                meEncanta: 0,
                meDivierte: 0
            },
            favorita: false,
            comentarios: []
        });
    }

    const { contexto, elementos } = crearContexto();

    cargarPublicaciones(contexto, listaLarga);

    elementos.get("pagina-siguiente").ejecutarEvento("click");
    elementos.get("pagina-siguiente").ejecutarEvento("click");

    assert.equal(
        elementos.get("indicador-pagina").textContent,
        "Página 3 de 3"
    );


    // Queda abierto el formulario de edicion de una publicacion

    vm.runInContext("iniciarEdicion(1);", contexto);

    assert.equal(
        vm.runInContext("idPublicacionEnEdicion", contexto),
        1
    );

    assert.equal(
        importar(
            contexto,
            JSON.stringify({ publicaciones: PUBLICACIONES_COMPLETAS })
        ),
        true
    );

    assert.equal(vm.runInContext("paginaActual", contexto), 1);
    assert.equal(
        vm.runInContext("idPublicacionEnEdicion", contexto),
        null
    );
    assert.equal(
        vm.runInContext("comentarioEnEdicion", contexto),
        null
    );
    assert.equal(
        vm.runInContext("respuestaEnCreacion", contexto),
        null
    );
    assert.equal(
        elementos.get("indicador-pagina").textContent,
        "Página 1 de 1"
    );
    assert.deepEqual(autoresVisibles(elementos), ["Luis", "Ana"]);
}

console.log("H19: 9 pruebas completadas correctamente.");
