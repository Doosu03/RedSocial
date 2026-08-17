// Clave utilizada para guardar las publicaciones
const CLAVE_LOCAL_STORAGE = "publicacionesRedSocial";
const CLAVE_BORRADOR_PUBLICACION = "borradorPublicacionRedSocial";
const LIMITE_CARACTERES_MENSAJE = 200;
const LIMITE_CARACTERES_COMENTARIO = 250;
const ETIQUETAS_PUBLICACION = [
    "General",
    "Estudio",
    "Evento",
    "Ayuda"
];


// Elementos del HTML

const formulario = document.getElementById(
    "formulario-publicacion"
);

const campoNombre = document.getElementById("nombre");
const campoMensaje = document.getElementById("mensaje");
const campoEtiqueta = document.getElementById("etiqueta");

const errorNombre = document.getElementById(
    "error-nombre"
);

const errorMensaje = document.getElementById(
    "error-mensaje"
);

const contadorCaracteres = document.getElementById(
    "contador-caracteres"
);

const listaPublicaciones = document.getElementById(
    "lista-publicaciones"
);

const mensajeVacio = document.getElementById(
    "mensaje-vacio"
);

const formularioBusqueda = document.getElementById(
    "formulario-busqueda"
);

const campoBusqueda = document.getElementById("buscador");

const botonLimpiarBusqueda = document.getElementById(
    "limpiar-busqueda"
);

const resumenBusqueda = document.getElementById(
    "resumen-busqueda"
);

const selectorOrden = document.getElementById(
    "orden-publicaciones"
);

const selectorEtiqueta = document.getElementById(
    "filtro-etiqueta"
);

const filtroFavoritas = document.getElementById(
    "filtro-favoritas"
);

const botonDescartarBorrador = document.getElementById(
    "descartar-borrador"
);

const totalPublicaciones = document.getElementById(
    "total-publicaciones"
);

const totalMeGusta = document.getElementById(
    "total-me-gusta"
);

const totalMeEncanta = document.getElementById(
    "total-me-encanta"
);

const totalMeDivierte = document.getElementById(
    "total-me-divierte"
);

const totalComentarios = document.getElementById(
    "total-comentarios"
);


// Cargar las publicaciones guardadas

let publicaciones = cargarPublicaciones();

// Identifica la publicación que se está editando actualmente
let idPublicacionEnEdicion = null;

// Identifica el comentario que se está editando actualmente
let comentarioEnEdicion = null;

// Identifica el comentario al que se está respondiendo
let respuestaEnCreacion = null;

// Texto que se está buscando actualmente
let terminoBusqueda = "";

// El selector siempre inicia mostrando primero las más recientes
let criterioOrden = "recientes";

// El filtro siempre inicia mostrando todas las etiquetas
let criterioEtiqueta = "Todas";

// El filtro de favoritas inicia mostrando todas las publicaciones
let mostrarSoloFavoritas = false;

cargarBorradorPublicacion();

mostrarPublicaciones();


// Evento para publicar un mensaje

formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const mensaje = campoMensaje.value.trim();
    const etiqueta = normalizarEtiqueta(campoEtiqueta.value);

    limpiarErrores();

    let formularioValido = true;


    // Validar el nombre

    if (nombre === "") {

        mostrarError(
            campoNombre,
            errorNombre,
            "El nombre es obligatorio."
        );

        formularioValido = false;
    }


    // Validar el mensaje

    if (mensaje === "") {

        mostrarError(
            campoMensaje,
            errorMensaje,
            "El mensaje es obligatorio."
        );

        formularioValido = false;
    }


    if (mensaje.length > LIMITE_CARACTERES_MENSAJE) {

        mostrarError(
            campoMensaje,
            errorMensaje,
            "El mensaje no puede superar los 200 caracteres."
        );

        formularioValido = false;
    }


    if (!formularioValido) {
        return;
    }


    // Crear una nueva publicación

    const nuevaPublicacion = {
        id: Date.now(),
        nombre: nombre,
        mensaje: mensaje,
        fecha: new Date().toISOString(),
        etiqueta: etiqueta,
        reacciones: {
            meGusta: 0,
            meEncanta: 0,
            meDivierte: 0
        },
        favorita: false,
        comentarios: []
    };


    // Agregar la publicación

    publicaciones.push(nuevaPublicacion);


    // Guardar la información en LocalStorage

    guardarPublicaciones();


    // Quitar la búsqueda para que la nueva publicación se vea

    reiniciarBusqueda();


    // Mostrar nuevamente todas las publicaciones

    mostrarPublicaciones();


    // Limpiar el formulario

    formulario.reset();
    campoNombre.value = "";
    campoMensaje.value = "";
    campoEtiqueta.value = "General";

    limpiarBorradorPublicacion();

    actualizarContadorCaracteres(
        campoMensaje,
        contadorCaracteres
    );

    campoNombre.focus();
});


// Contador de caracteres

campoMensaje.addEventListener("input", function () {

    guardarBorradorPublicacion();

    actualizarContadorCaracteres(
        campoMensaje,
        contadorCaracteres
    );

    if (campoMensaje.value.length > LIMITE_CARACTERES_MENSAJE) {

        mostrarError(
            campoMensaje,
            errorMensaje,
            "El mensaje no puede superar los 200 caracteres."
        );

    } else {

        quitarError(
            campoMensaje,
            errorMensaje
        );
    }
});


// Mostrar cuántos caracteres quedan disponibles

function actualizarContadorCaracteres(campo, contador) {

    const caracteresRestantes =
        LIMITE_CARACTERES_MENSAJE - campo.value.length;

    if (caracteresRestantes === 1) {
        contador.textContent = "1 carácter restante";
        return;
    }

    if (caracteresRestantes >= 0) {
        contador.textContent =
            `${caracteresRestantes} caracteres restantes`;
        return;
    }

    const caracteresDeMas = Math.abs(caracteresRestantes);

    contador.textContent =
        caracteresDeMas === 1
            ? "1 carácter de más"
            : `${caracteresDeMas} caracteres de más`;
}


// Quitar el error del nombre mientras se escribe

campoNombre.addEventListener("input", function () {

    guardarBorradorPublicacion();

    quitarError(
        campoNombre,
        errorNombre
    );
});


// Filtrar la lista mientras se escribe

campoBusqueda.addEventListener("input", function () {

    terminoBusqueda = campoBusqueda.value;

    mostrarPublicaciones();
});


// Filtrar la lista al presionar "Buscar"

formularioBusqueda.addEventListener("submit", function (evento) {

    evento.preventDefault();

    terminoBusqueda = campoBusqueda.value;

    mostrarPublicaciones();
});


// Volver a mostrar todas las publicaciones

botonLimpiarBusqueda.addEventListener("click", function () {

    reiniciarBusqueda();

    mostrarPublicaciones();

    campoBusqueda.focus();
});


// Cambiar el orden sin modificar las publicaciones guardadas

selectorOrden.addEventListener("change", function () {

    criterioOrden = selectorOrden.value;

    mostrarPublicaciones();
});


// Filtrar por etiqueta sin modificar las publicaciones guardadas

selectorEtiqueta.addEventListener("change", function () {

    criterioEtiqueta = selectorEtiqueta.value;

    mostrarPublicaciones();
});


// Mostrar u ocultar publicaciones no favoritas

filtroFavoritas.addEventListener("change", function () {

    mostrarSoloFavoritas = filtroFavoritas.checked === true;

    mostrarPublicaciones();
});


// Descartar el borrador actual del formulario

botonDescartarBorrador.addEventListener("click", function () {

    descartarBorradorPublicacion();
});


// Dejar el campo de búsqueda vacío

function reiniciarBusqueda() {

    campoBusqueda.value = "";

    terminoBusqueda = "";
}


function guardarBorradorPublicacion() {

    const borrador = {
        nombre: campoNombre.value,
        mensaje: campoMensaje.value
    };

    if (
        borrador.nombre === "" &&
        borrador.mensaje === ""
    ) {
        limpiarBorradorPublicacion();
        return;
    }

    localStorage.setItem(
        CLAVE_BORRADOR_PUBLICACION,
        JSON.stringify(borrador)
    );
}


function cargarBorradorPublicacion() {

    const borradorGuardado =
        localStorage.getItem(CLAVE_BORRADOR_PUBLICACION);

    if (borradorGuardado === null || borradorGuardado === "") {
        actualizarContadorCaracteres(
            campoMensaje,
            contadorCaracteres
        );
        return;
    }

    try {

        const borrador = JSON.parse(borradorGuardado);

        if (
            borrador !== null &&
            typeof borrador === "object"
        ) {
            campoNombre.value =
                typeof borrador.nombre === "string"
                    ? borrador.nombre
                    : "";

            campoMensaje.value =
                typeof borrador.mensaje === "string"
                    ? borrador.mensaje
                    : "";
        }

    } catch (error) {

        console.error(
            "No se pudo cargar el borrador.",
            error
        );
    }

    actualizarContadorCaracteres(
        campoMensaje,
        contadorCaracteres
    );
}


function limpiarBorradorPublicacion() {

    if (typeof localStorage.removeItem === "function") {
        localStorage.removeItem(CLAVE_BORRADOR_PUBLICACION);
        return;
    }

    localStorage.setItem(CLAVE_BORRADOR_PUBLICACION, "");
}


function descartarBorradorPublicacion() {

    formulario.reset();
    campoNombre.value = "";
    campoMensaje.value = "";
    campoEtiqueta.value = "General";

    limpiarBorradorPublicacion();
    limpiarErrores();

    actualizarContadorCaracteres(
        campoMensaje,
        contadorCaracteres
    );

    campoNombre.focus();
}


// Obtener el texto buscado sin espacios ni mayúsculas

function obtenerTextoBuscado() {

    return terminoBusqueda.trim().toLowerCase();
}


// Revisar si una publicación coincide con el texto buscado

function coincideConBusqueda(publicacion, textoBuscado) {

    const nombre = String(publicacion.nombre).toLowerCase();
    const mensaje = String(publicacion.mensaje).toLowerCase();

    return (
        nombre.includes(textoBuscado) ||
        mensaje.includes(textoBuscado)
    );
}


// Publicaciones que se deben mostrar según la búsqueda

function filtrarPublicaciones() {

    const textoBuscado = obtenerTextoBuscado();

    return publicaciones.filter(function (publicacion) {

        const coincideConEtiqueta =
            criterioEtiqueta === "Todas" ||
            obtenerEtiqueta(publicacion) === criterioEtiqueta;

        const coincideConTexto =
            textoBuscado === "" ||
            coincideConBusqueda(publicacion, textoBuscado);

        const coincideConFavorita =
            !mostrarSoloFavoritas ||
            esPublicacionFavorita(publicacion);

        return (
            coincideConEtiqueta &&
            coincideConTexto &&
            coincideConFavorita
        );
    });
}


// Usar General cuando una publicación no tenga una etiqueta válida

function normalizarEtiqueta(etiqueta) {

    return ETIQUETAS_PUBLICACION.includes(etiqueta)
        ? etiqueta
        : "General";
}


// Obtener la etiqueta sin modificar la publicación original

function obtenerEtiqueta(publicacion) {

    return normalizarEtiqueta(publicacion.etiqueta);
}


// Las publicaciones antiguas se consideran no favoritas

function esPublicacionFavorita(publicacion) {

    return publicacion.favorita === true;
}


// Ordenar una copia de las publicaciones visibles

function ordenarPublicaciones(publicacionesParaOrdenar) {

    const publicacionesOrdenadas =
        publicacionesParaOrdenar.slice();

    publicacionesOrdenadas.sort(function (primera, segunda) {

        const fechaPrimera = obtenerTiempo(primera.fecha);
        const fechaSegunda = obtenerTiempo(segunda.fecha);

        if (criterioOrden === "antiguas") {
            return fechaPrimera - fechaSegunda;
        }

        if (criterioOrden === "mas-gustadas") {

            const diferenciaMeGusta =
                obtenerReacciones(segunda).meGusta -
                obtenerReacciones(primera).meGusta;

            // En un empate se muestra primero la más reciente

            return diferenciaMeGusta !== 0
                ? diferenciaMeGusta
                : fechaSegunda - fechaPrimera;
        }

        return fechaSegunda - fechaPrimera;
    });

    return publicacionesOrdenadas;
}


// Convertir una fecha guardada en un valor comparable

function obtenerTiempo(fecha) {

    const tiempo = new Date(fecha).getTime();

    return Number.isFinite(tiempo) ? tiempo : 0;
}


// Informar el resultado de la búsqueda

function actualizarMensajesDeLista(cantidadVisible) {

    const textoBuscado = terminoBusqueda.trim();
    const filtroActivo = criterioEtiqueta !== "Todas";
    const filtroFavoritasActivo = mostrarSoloFavoritas;


    // Todavía no se ha publicado nada

    if (publicaciones.length === 0) {

        mensajeVacio.textContent =
            "Todavía no hay publicaciones.";

        mensajeVacio.style.display = "block";

        resumenBusqueda.textContent = "";

        return;
    }


    // Hay publicaciones, pero ninguna coincide

    if (cantidadVisible === 0) {

        if (
            textoBuscado !== "" &&
            filtroActivo &&
            filtroFavoritasActivo
        ) {

            mensajeVacio.textContent =
                `No se encontraron publicaciones favoritas de ` +
                `${criterioEtiqueta} con "${textoBuscado}".`;

        } else if (textoBuscado !== "" && filtroFavoritasActivo) {

            mensajeVacio.textContent =
                `No se encontraron publicaciones favoritas ` +
                `con "${textoBuscado}".`;

        } else if (filtroActivo && filtroFavoritasActivo) {

            mensajeVacio.textContent =
                `No hay publicaciones favoritas con la etiqueta ` +
                `"${criterioEtiqueta}".`;

        } else if (filtroFavoritasActivo) {

            mensajeVacio.textContent =
                "No hay publicaciones favoritas.";

        } else if (textoBuscado !== "" && filtroActivo) {

            mensajeVacio.textContent =
                `No se encontraron publicaciones de ${criterioEtiqueta} ` +
                `con "${textoBuscado}".`;

        } else if (filtroActivo) {

            mensajeVacio.textContent =
                `No hay publicaciones con la etiqueta ` +
                `"${criterioEtiqueta}".`;

        } else {

            mensajeVacio.textContent =
                `No se encontraron publicaciones con "${textoBuscado}".`;
        }

        mensajeVacio.style.display = "block";

        resumenBusqueda.textContent = "";

        return;
    }


    mensajeVacio.style.display = "none";


    if (textoBuscado === "") {

        resumenBusqueda.textContent = "";

        return;
    }


    resumenBusqueda.textContent =
        cantidadVisible === 1
            ? `1 publicación encontrada con "${textoBuscado}".`
            : `${cantidadVisible} publicaciones encontradas ` +
              `con "${textoBuscado}".`;
}


// Calcular y mostrar la actividad completa de la red social

function actualizarResumenActividad() {

    const resumen = publicaciones.reduce(
        function (totales, publicacion) {

            const reacciones = obtenerReacciones(publicacion);

            totales.meGusta += reacciones.meGusta;
            totales.meEncanta += reacciones.meEncanta;
            totales.meDivierte += reacciones.meDivierte;

            totales.comentarios +=
                Array.isArray(publicacion.comentarios)
                    ? publicacion.comentarios.length
                    : 0;

            return totales;
        },
        {
            meGusta: 0,
            meEncanta: 0,
            meDivierte: 0,
            comentarios: 0
        }
    );

    totalPublicaciones.textContent = publicaciones.length;
    totalMeGusta.textContent = resumen.meGusta;
    totalMeEncanta.textContent = resumen.meEncanta;
    totalMeDivierte.textContent = resumen.meDivierte;
    totalComentarios.textContent = resumen.comentarios;
}


// Guardar publicaciones en LocalStorage

function guardarPublicaciones() {

    const publicacionesConvertidas =
        JSON.stringify(publicaciones);

    localStorage.setItem(
        CLAVE_LOCAL_STORAGE,
        publicacionesConvertidas
    );
}


// Recuperar publicaciones de LocalStorage

function cargarPublicaciones() {

    const publicacionesGuardadas =
        localStorage.getItem(CLAVE_LOCAL_STORAGE);

    if (publicacionesGuardadas === null) {
        return [];
    }

    try {

        const publicacionesConvertidas =
            JSON.parse(publicacionesGuardadas);

        if (Array.isArray(publicacionesConvertidas)) {

            // Las publicaciones antiguas no tienen "Me gusta"

            return publicacionesConvertidas.map(
                normalizarPublicacion
            );
        }

        return [];

    } catch (error) {

        console.error(
            "No se pudieron cargar las publicaciones.",
            error
        );

        return [];
    }
}


// Completar los datos que falten en una publicación

function normalizarPublicacion(publicacion) {

    return {
        id: publicacion.id,
        nombre: publicacion.nombre,
        mensaje: publicacion.mensaje,

        fecha: obtenerFecha(publicacion),

        etiqueta: normalizarEtiqueta(publicacion.etiqueta),

        reacciones: normalizarReacciones(publicacion),

        favorita: esPublicacionFavorita(publicacion),

        comentarios: normalizarComentarios(publicacion)
    };
}


// Completar los tres contadores y migrar publicaciones antiguas

function normalizarReacciones(publicacion) {

    const reaccionesGuardadas =
        publicacion.reacciones !== null &&
        typeof publicacion.reacciones === "object"
            ? publicacion.reacciones
            : {};

    return {
        meGusta: normalizarCantidadReaccion(
            reaccionesGuardadas.meGusta !== undefined
                ? reaccionesGuardadas.meGusta
                : publicacion.meGusta
        ),
        meEncanta: normalizarCantidadReaccion(
            reaccionesGuardadas.meEncanta
        ),
        meDivierte: normalizarCantidadReaccion(
            reaccionesGuardadas.meDivierte
        )
    };
}


function normalizarCantidadReaccion(cantidad) {

    const numero = Number(cantidad);

    return Number.isFinite(numero) && numero > 0
        ? Math.floor(numero)
        : 0;
}


// Garantizar la estructura incluso en datos antiguos usados en memoria

function obtenerReacciones(publicacion) {

    if (
        publicacion.reacciones === null ||
        typeof publicacion.reacciones !== "object"
    ) {
        publicacion.reacciones = normalizarReacciones(publicacion);
    }

    return publicacion.reacciones;
}


// Recuperar los comentarios de una publicación

function obtenerComentarios(publicacion) {

    if (Array.isArray(publicacion.comentarios)) {
        return publicacion.comentarios;
    }

    // Las publicaciones antiguas no tienen comentarios

    return [];
}


// Dar a cada comentario guardado un identificador único

function normalizarComentarios(publicacion) {

    const comentariosNormalizados = [];

    obtenerComentarios(publicacion).forEach(function (comentario) {

        const idGuardado = Number(comentario.id);

        const idDisponible =
            Number.isFinite(idGuardado) &&
            !existeComentario(comentariosNormalizados, idGuardado);

        comentariosNormalizados.push({

            id: idDisponible
                ? idGuardado
                : crearIdComentario(comentariosNormalizados),

            nombre: comentario.nombre,
            texto: comentario.texto,
            fecha: comentario.fecha,
            respuestas: normalizarRespuestas(comentario)
        });
    });

    return comentariosNormalizados;
}


// Recuperar las respuestas de un comentario

function obtenerRespuestas(comentario) {

    if (Array.isArray(comentario.respuestas)) {
        return comentario.respuestas;
    }

    // Los comentarios antiguos no tienen respuestas

    return [];
}


// Completar los identificadores de las respuestas guardadas

function normalizarRespuestas(comentario) {

    const respuestasNormalizadas = [];

    obtenerRespuestas(comentario).forEach(function (respuesta) {

        const idGuardado = Number(respuesta.id);

        const idDisponible =
            Number.isFinite(idGuardado) &&
            !existeRespuesta(respuestasNormalizadas, idGuardado);

        respuestasNormalizadas.push({

            id: idDisponible
                ? idGuardado
                : crearIdRespuestaEnLista(respuestasNormalizadas),

            nombre: respuesta.nombre,
            texto: respuesta.texto,
            fecha: respuesta.fecha
        });
    });

    return respuestasNormalizadas;
}


// Revisar si un identificador de respuesta ya está en uso

function existeRespuesta(respuestas, idRespuesta) {

    return respuestas.some(function (respuesta) {
        return respuesta.id === idRespuesta;
    });
}


// Crear un identificador único dentro de una lista de respuestas

function crearIdRespuestaEnLista(respuestas) {

    let nuevoId = Date.now();

    while (existeRespuesta(respuestas, nuevoId)) {
        nuevoId = nuevoId + 1;
    }

    return nuevoId;
}


// Revisar todas las publicaciones antes de crear una respuesta nueva

function existeRespuestaGuardada(idRespuesta) {

    return publicaciones.some(function (publicacion) {

        return obtenerComentarios(publicacion).some(function (comentario) {

            return obtenerRespuestas(comentario).some(function (respuesta) {
                return respuesta.id === idRespuesta;
            });
        });
    });
}


// Crear un identificador que no se repita en otra respuesta

function crearIdRespuesta() {

    let nuevoId = Date.now();

    while (existeRespuestaGuardada(nuevoId)) {
        nuevoId = nuevoId + 1;
    }

    return nuevoId;
}


// Revisar si un identificador ya está en uso

function existeComentario(comentarios, idComentario) {

    return comentarios.some(function (comentario) {
        return comentario.id === idComentario;
    });
}


// Crear un identificador que no repita el de otro comentario

function crearIdComentario(comentarios) {

    let nuevoId = Date.now();

    while (existeComentario(comentarios, nuevoId)) {
        nuevoId = nuevoId + 1;
    }

    return nuevoId;
}


// Buscar una publicación por su identificador

function buscarPublicacion(idPublicacion) {

    return publicaciones.find(function (publicacion) {
        return publicacion.id === idPublicacion;
    });
}


// Buscar un comentario dentro de su publicación

function buscarComentario(idPublicacion, idComentario) {

    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return undefined;
    }

    return obtenerComentarios(publicacion).find(
        function (comentario) {
            return comentario.id === idComentario;
        }
    );
}


// Recuperar la fecha guardada de una publicación

function obtenerFecha(publicacion) {

    // Publicaciones creadas con la fecha ya incluida

    if (typeof publicacion.fecha === "string") {

        const fechaGuardada =
            new Date(publicacion.fecha);

        if (!isNaN(fechaGuardada.getTime())) {
            return publicacion.fecha;
        }
    }


    // Publicaciones antiguas: el id era la hora de creación

    const fechaDelId = new Date(publicacion.id);

    if (!isNaN(fechaDelId.getTime())) {
        return fechaDelId.toISOString();
    }


    // No se pudo saber la fecha

    return "";
}


// Escribir la fecha y la hora de forma legible

function formatearFecha(fechaEnTexto) {

    const fecha = new Date(fechaEnTexto);

    return fecha.toLocaleString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// Mostrar las publicaciones

function mostrarPublicaciones() {

    listaPublicaciones.innerHTML = "";

    actualizarResumenActividad();

    const publicacionesVisibles = ordenarPublicaciones(
        filtrarPublicaciones()
    );

    actualizarMensajesDeLista(publicacionesVisibles.length);

    if (publicacionesVisibles.length === 0) {
        return;
    }


    publicacionesVisibles.forEach(function (publicacion) {

        const articulo =
            document.createElement("article");

        articulo.classList.add("publicacion");

        if (esPublicacionFavorita(publicacion)) {
            articulo.classList.add("publicacion-favorita");
        }


        const nombreEstudiante =
            document.createElement("h3");

        nombreEstudiante.textContent =
            publicacion.nombre;


        // Encabezado con el nombre y la fecha

        const encabezadoPublicacion =
            document.createElement("div");

        encabezadoPublicacion.classList.add(
            "encabezado-publicacion"
        );

        encabezadoPublicacion.appendChild(
            nombreEstudiante
        );


        if (publicacion.fecha !== "") {

            const fechaPublicacion =
                document.createElement("time");

            fechaPublicacion.classList.add(
                "fecha-publicacion"
            );

            fechaPublicacion.dateTime =
                publicacion.fecha;

            fechaPublicacion.textContent =
                formatearFecha(publicacion.fecha);

            encabezadoPublicacion.appendChild(
                fechaPublicacion
            );
        }


        const etiqueta = obtenerEtiqueta(publicacion);

        const etiquetaPublicacion = document.createElement("span");

        etiquetaPublicacion.classList.add(
            "etiqueta-publicacion",
            `etiqueta-${etiqueta.toLowerCase()}`
        );

        etiquetaPublicacion.setAttribute(
            "aria-label",
            `Tema: ${etiqueta}`
        );

        etiquetaPublicacion.textContent = etiqueta;

        encabezadoPublicacion.appendChild(etiquetaPublicacion);


        const contenidoPublicacion =
            crearContenidoPublicacion(publicacion);


        // Zona de acciones y reacciones

        const acciones =
            document.createElement("div");

        acciones.classList.add(
            "acciones-publicacion"
        );


        const reacciones = obtenerReacciones(publicacion);

        const contadoresReacciones =
            document.createElement("div");

        contadoresReacciones.classList.add(
            "contadores-reacciones"
        );

        [
            ["👍", "Me gusta", reacciones.meGusta],
            ["❤️", "Me encanta", reacciones.meEncanta],
            ["😄", "Me divierte", reacciones.meDivierte]
        ].forEach(function (datosReaccion) {

            const contador = document.createElement("span");

            contador.classList.add("contador-reaccion");
            contador.textContent =
                `${datosReaccion[0]} ${datosReaccion[1]}: ` +
                datosReaccion[2];

            contadoresReacciones.appendChild(contador);
        });


        const grupoBotones =
            document.createElement("div");

        grupoBotones.classList.add(
            "botones-publicacion"
        );


        [
            ["meGusta", "👍 Me gusta"],
            ["meEncanta", "❤️ Me encanta"],
            ["meDivierte", "😄 Me divierte"]
        ].forEach(function (datosReaccion) {

            const botonReaccion = document.createElement("button");

            botonReaccion.type = "button";
            botonReaccion.classList.add("boton-reaccion");
            botonReaccion.textContent = datosReaccion[1];

            botonReaccion.addEventListener("click", function () {
                agregarReaccion(publicacion.id, datosReaccion[0]);
            });

            grupoBotones.appendChild(botonReaccion);
        });


        const botonFavorita =
            document.createElement("button");

        botonFavorita.type = "button";
        botonFavorita.classList.add("boton-favorita");

        if (esPublicacionFavorita(publicacion)) {
            botonFavorita.classList.add("activo");
        }

        botonFavorita.textContent =
            esPublicacionFavorita(publicacion)
                ? "Quitar de Favoritos"
                : "Marcar Favorito";

        botonFavorita.setAttribute(
            "aria-pressed",
            esPublicacionFavorita(publicacion) ? "true" : "false"
        );

        botonFavorita.addEventListener("click", function () {
            alternarFavorita(publicacion.id);
        });


        const botonEditar =
            document.createElement("button");

        botonEditar.type = "button";

        botonEditar.classList.add(
            "boton-editar"
        );

        botonEditar.textContent = "Editar";

        botonEditar.addEventListener(
            "click",
            function () {
                iniciarEdicion(publicacion.id);
            }
        );


        const botonEliminar =
            document.createElement("button");

        botonEliminar.type = "button";

        botonEliminar.classList.add(
            "boton-eliminar"
        );

        botonEliminar.textContent = "Eliminar";

        botonEliminar.addEventListener(
            "click",
            function () {
                eliminarPublicacion(publicacion.id);
            }
        );


        grupoBotones.appendChild(botonFavorita);
        grupoBotones.appendChild(botonEditar);
        grupoBotones.appendChild(botonEliminar);

        acciones.appendChild(contadoresReacciones);
        acciones.appendChild(grupoBotones);


        const seccionComentarios =
            crearSeccionComentarios(publicacion);


        articulo.appendChild(encabezadoPublicacion);
        articulo.appendChild(contenidoPublicacion);
        articulo.appendChild(acciones);
        articulo.appendChild(seccionComentarios);

        listaPublicaciones.appendChild(articulo);
    });
}


// Crear la sección de comentarios de una publicación

function crearSeccionComentarios(publicacion) {

    const seccionComentarios =
        document.createElement("section");

    seccionComentarios.classList.add(
        "seccion-comentarios"
    );


    const tituloComentarios =
        document.createElement("h4");

    tituloComentarios.textContent = "Comentarios";


    const listaComentarios =
        document.createElement("div");

    listaComentarios.classList.add(
        "lista-comentarios"
    );


    const comentarios = obtenerComentarios(publicacion);

    if (comentarios.length === 0) {

        const mensajeSinComentarios =
            document.createElement("p");

        mensajeSinComentarios.classList.add(
            "mensaje-sin-comentarios"
        );

        mensajeSinComentarios.textContent =
            "Aún no hay comentarios.";

        listaComentarios.appendChild(
            mensajeSinComentarios
        );

    } else {

        comentarios.forEach(function (comentario) {
            listaComentarios.appendChild(
                crearComentario(comentario, publicacion)
            );
        });
    }


    seccionComentarios.appendChild(tituloComentarios);
    seccionComentarios.appendChild(listaComentarios);
    seccionComentarios.appendChild(
        crearFormularioComentario(publicacion)
    );

    return seccionComentarios;
}


// Crear un comentario guardado

function crearComentario(comentario, publicacion) {

    const articuloComentario =
        document.createElement("article");

    articuloComentario.classList.add("comentario");


    const encabezadoComentario =
        document.createElement("div");

    encabezadoComentario.classList.add(
        "encabezado-comentario"
    );


    const autorComentario =
        document.createElement("strong");

    autorComentario.classList.add("autor-comentario");
    autorComentario.textContent = comentario.nombre;


    const fechaComentario = new Date(comentario.fecha);

    encabezadoComentario.appendChild(autorComentario);

    if (!isNaN(fechaComentario.getTime())) {

        const elementoFecha = document.createElement("time");

        elementoFecha.classList.add("fecha-comentario");
        elementoFecha.dateTime = comentario.fecha;
        elementoFecha.textContent =
            formatearFecha(comentario.fecha);

        encabezadoComentario.appendChild(elementoFecha);
    }


    // El autor y la fecha original siempre se conservan a la vista

    articuloComentario.appendChild(encabezadoComentario);

    articuloComentario.appendChild(
        crearContenidoComentario(comentario, publicacion)
    );


    // Mientras se edita, el formulario reemplaza a las acciones

    if (!esComentarioEnEdicion(publicacion.id, comentario.id)) {

        articuloComentario.appendChild(
            crearAccionesComentario(comentario, publicacion)
        );
    }

    articuloComentario.appendChild(
        crearSeccionRespuestas(comentario, publicacion)
    );

    return articuloComentario;
}


// Revisar si un comentario es el que se está editando

function esComentarioEnEdicion(idPublicacion, idComentario) {

    return (
        comentarioEnEdicion !== null &&
        comentarioEnEdicion.idPublicacion === idPublicacion &&
        comentarioEnEdicion.idComentario === idComentario
    );
}


// Mostrar el texto del comentario o el formulario para editarlo

function crearContenidoComentario(comentario, publicacion) {

    if (!esComentarioEnEdicion(publicacion.id, comentario.id)) {

        const textoComentario = document.createElement("p");

        textoComentario.textContent = comentario.texto;

        return textoComentario;
    }


    const formularioEdicion = document.createElement("form");

    formularioEdicion.classList.add(
        "formulario-edicion-comentario"
    );

    formularioEdicion.noValidate = true;


    const etiquetaEdicion = document.createElement("label");

    etiquetaEdicion.textContent = "Editar comentario";


    const campoEdicion = document.createElement("textarea");

    campoEdicion.id =
        `editar-comentario-${publicacion.id}-${comentario.id}`;
    campoEdicion.value = comentario.texto;
    campoEdicion.maxLength = LIMITE_CARACTERES_COMENTARIO;
    campoEdicion.rows = 3;

    etiquetaEdicion.htmlFor = campoEdicion.id;


    const errorEdicion = document.createElement("small");

    errorEdicion.classList.add("mensaje-error");
    errorEdicion.setAttribute("aria-live", "polite");


    const botonesEdicion = document.createElement("div");

    botonesEdicion.classList.add("botones-edicion");


    const botonGuardar = document.createElement("button");

    botonGuardar.type = "submit";
    botonGuardar.classList.add("boton-guardar");
    botonGuardar.textContent = "Guardar";


    const botonCancelar = document.createElement("button");

    botonCancelar.type = "button";
    botonCancelar.classList.add("boton-cancelar");
    botonCancelar.textContent = "Cancelar";

    botonCancelar.addEventListener("click", function () {
        cancelarEdicionComentario();
    });


    campoEdicion.addEventListener("input", function () {
        quitarError(campoEdicion, errorEdicion);
    });

    formularioEdicion.addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();

            guardarEdicionComentario(
                publicacion.id,
                comentario.id,
                campoEdicion,
                errorEdicion
            );
        }
    );


    botonesEdicion.appendChild(botonGuardar);
    botonesEdicion.appendChild(botonCancelar);

    formularioEdicion.appendChild(etiquetaEdicion);
    formularioEdicion.appendChild(campoEdicion);
    formularioEdicion.appendChild(errorEdicion);
    formularioEdicion.appendChild(botonesEdicion);

    setTimeout(function () {
        campoEdicion.focus();
        campoEdicion.setSelectionRange(
            campoEdicion.value.length,
            campoEdicion.value.length
        );
    }, 0);

    return formularioEdicion;
}


// Botones para editar y eliminar un comentario

function crearAccionesComentario(comentario, publicacion) {

    const acciones = document.createElement("div");

    acciones.classList.add("acciones-comentario");


    const botonEditar = document.createElement("button");

    botonEditar.type = "button";
    botonEditar.classList.add("boton-editar-comentario");
    botonEditar.textContent = "Editar";

    botonEditar.addEventListener("click", function () {
        iniciarEdicionComentario(
            publicacion.id,
            comentario.id
        );
    });


    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    botonEliminar.classList.add("boton-eliminar-comentario");
    botonEliminar.textContent = "Eliminar";

    botonEliminar.addEventListener("click", function () {
        eliminarComentario(
            publicacion.id,
            comentario.id
        );
    });


    const botonResponder = document.createElement("button");

    botonResponder.type = "button";
    botonResponder.classList.add("boton-responder-comentario");
    botonResponder.textContent = "Responder";

    botonResponder.addEventListener("click", function () {
        iniciarRespuesta(
            publicacion.id,
            comentario.id
        );
    });


    acciones.appendChild(botonEditar);
    acciones.appendChild(botonEliminar);
    acciones.appendChild(botonResponder);

    return acciones;
}


// Crear la sección de respuestas de un comentario

function crearSeccionRespuestas(comentario, publicacion) {

    const seccionRespuestas = document.createElement("section");

    seccionRespuestas.classList.add("seccion-respuestas");


    const tituloRespuestas = document.createElement("h5");

    tituloRespuestas.textContent = "Respuestas";


    const listaRespuestas = document.createElement("div");

    listaRespuestas.classList.add("lista-respuestas");


    obtenerRespuestas(comentario).forEach(function (respuesta) {
        listaRespuestas.appendChild(crearRespuesta(respuesta));
    });


    seccionRespuestas.appendChild(tituloRespuestas);
    seccionRespuestas.appendChild(listaRespuestas);


    if (esRespuestaEnCreacion(publicacion.id, comentario.id)) {
        seccionRespuestas.appendChild(
            crearFormularioRespuesta(comentario, publicacion)
        );
    }

    return seccionRespuestas;
}


// Crear una respuesta guardada

function crearRespuesta(respuesta) {

    const articuloRespuesta = document.createElement("article");

    articuloRespuesta.classList.add("respuesta");


    const encabezadoRespuesta = document.createElement("div");

    encabezadoRespuesta.classList.add("encabezado-respuesta");


    const autorRespuesta = document.createElement("strong");

    autorRespuesta.classList.add("autor-respuesta");
    autorRespuesta.textContent = respuesta.nombre;

    encabezadoRespuesta.appendChild(autorRespuesta);


    const fechaRespuesta = new Date(respuesta.fecha);

    if (!isNaN(fechaRespuesta.getTime())) {

        const elementoFecha = document.createElement("time");

        elementoFecha.classList.add("fecha-respuesta");
        elementoFecha.dateTime = respuesta.fecha;
        elementoFecha.textContent = formatearFecha(respuesta.fecha);

        encabezadoRespuesta.appendChild(elementoFecha);
    }


    const textoRespuesta = document.createElement("p");

    textoRespuesta.textContent = respuesta.texto;


    articuloRespuesta.appendChild(encabezadoRespuesta);
    articuloRespuesta.appendChild(textoRespuesta);

    return articuloRespuesta;
}


// Revisar si el comentario tiene abierto el formulario de respuesta

function esRespuestaEnCreacion(idPublicacion, idComentario) {

    return (
        respuestaEnCreacion !== null &&
        respuestaEnCreacion.idPublicacion === idPublicacion &&
        respuestaEnCreacion.idComentario === idComentario
    );
}


// Crear el formulario para responder un comentario

function crearFormularioRespuesta(comentario, publicacion) {

    const formularioRespuesta = document.createElement("form");

    formularioRespuesta.classList.add("formulario-respuesta");
    formularioRespuesta.noValidate = true;


    const grupoNombre = document.createElement("div");

    grupoNombre.classList.add("campo-respuesta");


    const etiquetaNombre = document.createElement("label");

    etiquetaNombre.textContent = "Nombre";


    const campoNombreRespuesta = document.createElement("input");

    campoNombreRespuesta.type = "text";
    campoNombreRespuesta.id =
        `nombre-respuesta-${publicacion.id}-${comentario.id}`;
    campoNombreRespuesta.placeholder = "Escribe tu nombre";
    campoNombreRespuesta.maxLength = 50;
    campoNombreRespuesta.autocomplete = "off";
    campoNombreRespuesta.required = true;

    etiquetaNombre.htmlFor = campoNombreRespuesta.id;


    const errorNombreRespuesta = document.createElement("small");

    errorNombreRespuesta.classList.add("mensaje-error");
    errorNombreRespuesta.setAttribute("aria-live", "polite");


    grupoNombre.appendChild(etiquetaNombre);
    grupoNombre.appendChild(campoNombreRespuesta);
    grupoNombre.appendChild(errorNombreRespuesta);


    const grupoTexto = document.createElement("div");

    grupoTexto.classList.add("campo-respuesta");


    const etiquetaTexto = document.createElement("label");

    etiquetaTexto.textContent = "Respuesta";


    const campoTextoRespuesta = document.createElement("textarea");

    campoTextoRespuesta.id =
        `texto-respuesta-${publicacion.id}-${comentario.id}`;
    campoTextoRespuesta.placeholder = "Escribe una respuesta";
    campoTextoRespuesta.maxLength = LIMITE_CARACTERES_COMENTARIO;
    campoTextoRespuesta.rows = 3;
    campoTextoRespuesta.required = true;

    etiquetaTexto.htmlFor = campoTextoRespuesta.id;


    const errorTextoRespuesta = document.createElement("small");

    errorTextoRespuesta.classList.add("mensaje-error");
    errorTextoRespuesta.setAttribute("aria-live", "polite");


    grupoTexto.appendChild(etiquetaTexto);
    grupoTexto.appendChild(campoTextoRespuesta);
    grupoTexto.appendChild(errorTextoRespuesta);


    const botonesRespuesta = document.createElement("div");

    botonesRespuesta.classList.add("botones-respuesta");


    const botonGuardarRespuesta = document.createElement("button");

    botonGuardarRespuesta.type = "submit";
    botonGuardarRespuesta.classList.add("boton-guardar-respuesta");
    botonGuardarRespuesta.textContent = "Responder";


    const botonCancelarRespuesta = document.createElement("button");

    botonCancelarRespuesta.type = "button";
    botonCancelarRespuesta.classList.add("boton-cancelar-respuesta");
    botonCancelarRespuesta.textContent = "Cancelar";

    botonCancelarRespuesta.addEventListener("click", function () {
        cancelarRespuesta();
    });


    campoNombreRespuesta.addEventListener("input", function () {
        quitarError(campoNombreRespuesta, errorNombreRespuesta);
    });

    campoTextoRespuesta.addEventListener("input", function () {
        quitarError(campoTextoRespuesta, errorTextoRespuesta);
    });


    formularioRespuesta.addEventListener("submit", function (evento) {

        evento.preventDefault();

        agregarRespuesta(
            publicacion.id,
            comentario.id,
            campoNombreRespuesta,
            campoTextoRespuesta,
            errorNombreRespuesta,
            errorTextoRespuesta
        );
    });


    botonesRespuesta.appendChild(botonGuardarRespuesta);
    botonesRespuesta.appendChild(botonCancelarRespuesta);

    formularioRespuesta.appendChild(grupoNombre);
    formularioRespuesta.appendChild(grupoTexto);
    formularioRespuesta.appendChild(botonesRespuesta);


    setTimeout(function () {
        campoNombreRespuesta.focus();
    }, 0);

    return formularioRespuesta;
}


// Abrir el formulario del comentario seleccionado

function iniciarRespuesta(idPublicacion, idComentario) {

    if (buscarComentario(idPublicacion, idComentario) === undefined) {
        return;
    }

    comentarioEnEdicion = null;

    respuestaEnCreacion = {
        idPublicacion: idPublicacion,
        idComentario: idComentario
    };

    mostrarPublicaciones();
}


// Cerrar el formulario sin guardar una respuesta

function cancelarRespuesta() {

    respuestaEnCreacion = null;

    mostrarPublicaciones();
}


// Validar y guardar una respuesta en el comentario seleccionado

function agregarRespuesta(
    idPublicacion,
    idComentario,
    campoNombreRespuesta,
    campoTextoRespuesta,
    errorNombreRespuesta,
    errorTextoRespuesta
) {

    const nombre = campoNombreRespuesta.value.trim();
    const texto = campoTextoRespuesta.value.trim();

    quitarError(campoNombreRespuesta, errorNombreRespuesta);
    quitarError(campoTextoRespuesta, errorTextoRespuesta);


    let respuestaValida = true;

    if (nombre === "") {

        mostrarError(
            campoNombreRespuesta,
            errorNombreRespuesta,
            "El nombre es obligatorio."
        );

        respuestaValida = false;
    }

    if (texto === "") {

        mostrarError(
            campoTextoRespuesta,
            errorTextoRespuesta,
            "La respuesta es obligatoria."
        );

        respuestaValida = false;
    }

    if (!respuestaValida) {

        if (nombre === "") {
            campoNombreRespuesta.focus();
        } else {
            campoTextoRespuesta.focus();
        }

        return;
    }


    const comentario = buscarComentario(idPublicacion, idComentario);

    if (comentario === undefined) {
        return;
    }

    if (!Array.isArray(comentario.respuestas)) {
        comentario.respuestas = [];
    }


    comentario.respuestas.push({
        id: crearIdRespuesta(),
        nombre: nombre,
        texto: texto,
        fecha: new Date().toISOString()
    });

    guardarPublicaciones();

    respuestaEnCreacion = null;

    mostrarPublicaciones();
}


// Cargar en el formulario solo el comentario seleccionado

function iniciarEdicionComentario(idPublicacion, idComentario) {

    respuestaEnCreacion = null;

    comentarioEnEdicion = {
        idPublicacion: idPublicacion,
        idComentario: idComentario
    };

    mostrarPublicaciones();
}


// Salir de la edición sin guardar cambios

function cancelarEdicionComentario() {

    comentarioEnEdicion = null;

    mostrarPublicaciones();
}


// Guardar únicamente el texto del comentario seleccionado

function guardarEdicionComentario(
    idPublicacion,
    idComentario,
    campoEdicion,
    errorEdicion
) {

    const textoEditado = campoEdicion.value.trim();

    if (textoEditado === "") {

        mostrarError(
            campoEdicion,
            errorEdicion,
            "El comentario no puede estar vacío."
        );

        campoEdicion.focus();

        return;
    }


    const comentario = buscarComentario(
        idPublicacion,
        idComentario
    );

    if (comentario === undefined) {
        return;
    }


    // El autor y la fecha original no se modifican

    comentario.texto = textoEditado;

    guardarPublicaciones();

    comentarioEnEdicion = null;

    mostrarPublicaciones();
}


// Eliminar un comentario después de confirmar

function eliminarComentario(idPublicacion, idComentario) {

    const confirmarEliminacion = window.confirm(
        "¿Deseas eliminar este comentario?"
    );

    if (!confirmarEliminacion) {
        return;
    }


    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return;
    }


    publicacion.comentarios = obtenerComentarios(publicacion)
        .filter(function (comentario) {
            return comentario.id !== idComentario;
        });


    if (esComentarioEnEdicion(idPublicacion, idComentario)) {
        comentarioEnEdicion = null;
    }

    if (esRespuestaEnCreacion(idPublicacion, idComentario)) {
        respuestaEnCreacion = null;
    }

    guardarPublicaciones();

    mostrarPublicaciones();
}


// Crear el formulario para comentar una publicación

function crearFormularioComentario(publicacion) {

    const formularioComentario =
        document.createElement("form");

    formularioComentario.classList.add(
        "formulario-comentario"
    );

    formularioComentario.noValidate = true;


    const grupoNombre = document.createElement("div");

    grupoNombre.classList.add("campo-comentario");


    const etiquetaNombre = document.createElement("label");

    etiquetaNombre.textContent = "Nombre";


    const campoNombreComentario =
        document.createElement("input");

    campoNombreComentario.type = "text";
    campoNombreComentario.id =
        `nombre-comentario-${publicacion.id}`;
    campoNombreComentario.name = "nombreComentario";
    campoNombreComentario.placeholder = "Escribe tu nombre";
    campoNombreComentario.maxLength = 50;
    campoNombreComentario.autocomplete = "off";
    campoNombreComentario.required = true;

    etiquetaNombre.htmlFor = campoNombreComentario.id;


    const errorNombreComentario =
        document.createElement("small");

    errorNombreComentario.classList.add("mensaje-error");
    errorNombreComentario.setAttribute("aria-live", "polite");


    grupoNombre.appendChild(etiquetaNombre);
    grupoNombre.appendChild(campoNombreComentario);
    grupoNombre.appendChild(errorNombreComentario);


    const grupoTexto = document.createElement("div");

    grupoTexto.classList.add("campo-comentario");


    const etiquetaTexto = document.createElement("label");

    etiquetaTexto.textContent = "Comentario";


    const campoTextoComentario =
        document.createElement("textarea");

    campoTextoComentario.name = "comentario";
    campoTextoComentario.id =
        `texto-comentario-${publicacion.id}`;
    campoTextoComentario.placeholder = "Escribe un comentario";
    campoTextoComentario.maxLength = 250;
    campoTextoComentario.rows = 3;
    campoTextoComentario.required = true;

    etiquetaTexto.htmlFor = campoTextoComentario.id;


    const errorTextoComentario =
        document.createElement("small");

    errorTextoComentario.classList.add("mensaje-error");
    errorTextoComentario.setAttribute("aria-live", "polite");


    grupoTexto.appendChild(etiquetaTexto);
    grupoTexto.appendChild(campoTextoComentario);
    grupoTexto.appendChild(errorTextoComentario);


    const botonComentar = document.createElement("button");

    botonComentar.type = "submit";
    botonComentar.classList.add("boton-comentar");
    botonComentar.textContent = "Comentar";


    campoNombreComentario.addEventListener(
        "input",
        function () {
            quitarError(
                campoNombreComentario,
                errorNombreComentario
            );
        }
    );

    campoTextoComentario.addEventListener(
        "input",
        function () {
            quitarError(
                campoTextoComentario,
                errorTextoComentario
            );
        }
    );

    formularioComentario.addEventListener(
        "submit",
        function (evento) {
            evento.preventDefault();

            agregarComentario(
                publicacion.id,
                campoNombreComentario,
                campoTextoComentario,
                errorNombreComentario,
                errorTextoComentario
            );
        }
    );


    formularioComentario.appendChild(grupoNombre);
    formularioComentario.appendChild(grupoTexto);
    formularioComentario.appendChild(botonComentar);

    return formularioComentario;
}


// Validar y guardar un comentario en su publicación

function agregarComentario(
    idPublicacion,
    campoNombreComentario,
    campoTextoComentario,
    errorNombreComentario,
    errorTextoComentario
) {

    const nombre = campoNombreComentario.value.trim();
    const texto = campoTextoComentario.value.trim();

    quitarError(
        campoNombreComentario,
        errorNombreComentario
    );

    quitarError(
        campoTextoComentario,
        errorTextoComentario
    );


    let comentarioValido = true;

    if (nombre === "") {

        mostrarError(
            campoNombreComentario,
            errorNombreComentario,
            "El nombre es obligatorio."
        );

        comentarioValido = false;
    }

    if (texto === "") {

        mostrarError(
            campoTextoComentario,
            errorTextoComentario,
            "El comentario es obligatorio."
        );

        comentarioValido = false;
    }

    if (!comentarioValido) {

        if (nombre === "") {
            campoNombreComentario.focus();
        } else {
            campoTextoComentario.focus();
        }

        return;
    }


    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return;
    }

    if (!Array.isArray(publicacion.comentarios)) {
        publicacion.comentarios = [];
    }


    const nuevoComentario = {
        id: crearIdComentario(publicacion.comentarios),
        nombre: nombre,
        texto: texto,
        fecha: new Date().toISOString(),
        respuestas: []
    };

    publicacion.comentarios.push(nuevoComentario);

    guardarPublicaciones();

    mostrarPublicaciones();
}


// Mostrar el mensaje o el formulario para editarlo

function crearContenidoPublicacion(publicacion) {

    if (publicacion.id !== idPublicacionEnEdicion) {

        const textoMensaje = document.createElement("p");

        textoMensaje.textContent = publicacion.mensaje;

        return textoMensaje;
    }


    const formularioEdicion = document.createElement("form");

    formularioEdicion.classList.add("formulario-edicion");
    formularioEdicion.noValidate = true;


    const etiquetaEdicion = document.createElement("label");

    etiquetaEdicion.textContent = "Editar mensaje";


    const campoEdicion = document.createElement("textarea");

    campoEdicion.value = publicacion.mensaje;
    campoEdicion.maxLength = LIMITE_CARACTERES_MENSAJE;
    campoEdicion.rows = 4;


    const errorEdicion = document.createElement("small");

    errorEdicion.classList.add("mensaje-error");
    errorEdicion.setAttribute("aria-live", "polite");


    const contadorEdicion = document.createElement("small");

    contadorEdicion.classList.add("contador-caracteres");
    contadorEdicion.setAttribute("aria-live", "polite");

    actualizarContadorCaracteres(
        campoEdicion,
        contadorEdicion
    );


    const detalleEdicion = document.createElement("div");

    detalleEdicion.classList.add("detalle-mensaje");

    detalleEdicion.appendChild(errorEdicion);
    detalleEdicion.appendChild(contadorEdicion);


    const botonesEdicion = document.createElement("div");

    botonesEdicion.classList.add("botones-edicion");


    const botonGuardar = document.createElement("button");

    botonGuardar.type = "submit";
    botonGuardar.classList.add("boton-guardar");
    botonGuardar.textContent = "Guardar";


    const botonCancelar = document.createElement("button");

    botonCancelar.type = "button";
    botonCancelar.classList.add("boton-cancelar");
    botonCancelar.textContent = "Cancelar";

    botonCancelar.addEventListener("click", function () {
        cancelarEdicion();
    });


    campoEdicion.addEventListener("input", function () {

        actualizarContadorCaracteres(
            campoEdicion,
            contadorEdicion
        );

        if (campoEdicion.value.length > LIMITE_CARACTERES_MENSAJE) {

            mostrarError(
                campoEdicion,
                errorEdicion,
                "El mensaje no puede superar los 200 caracteres."
            );

        } else {
            quitarError(campoEdicion, errorEdicion);
        }
    });

    formularioEdicion.addEventListener("submit", function (evento) {
        evento.preventDefault();

        guardarEdicion(
            publicacion.id,
            campoEdicion,
            errorEdicion
        );
    });


    botonesEdicion.appendChild(botonGuardar);
    botonesEdicion.appendChild(botonCancelar);

    formularioEdicion.appendChild(etiquetaEdicion);
    formularioEdicion.appendChild(campoEdicion);
    formularioEdicion.appendChild(detalleEdicion);
    formularioEdicion.appendChild(botonesEdicion);

    setTimeout(function () {
        campoEdicion.focus();
        campoEdicion.setSelectionRange(
            campoEdicion.value.length,
            campoEdicion.value.length
        );
    }, 0);

    return formularioEdicion;
}


// Iniciar la edición de una publicación

function iniciarEdicion(idPublicacion) {

    idPublicacionEnEdicion = idPublicacion;

    mostrarPublicaciones();
}


// Guardar únicamente el mensaje de la publicación seleccionada

function guardarEdicion(idPublicacion, campoEdicion, errorEdicion) {

    const mensajeEditado = campoEdicion.value.trim();

    if (mensajeEditado === "") {

        mostrarError(
            campoEdicion,
            errorEdicion,
            "El mensaje no puede estar vacío."
        );

        campoEdicion.focus();

        return;
    }


    if (mensajeEditado.length > LIMITE_CARACTERES_MENSAJE) {

        mostrarError(
            campoEdicion,
            errorEdicion,
            "El mensaje no puede superar los 200 caracteres."
        );

        campoEdicion.focus();

        return;
    }


    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return;
    }


    publicacion.mensaje = mensajeEditado;

    guardarPublicaciones();

    idPublicacionEnEdicion = null;

    mostrarPublicaciones();
}


// Salir de la edición sin guardar cambios

function cancelarEdicion() {

    idPublicacionEnEdicion = null;

    mostrarPublicaciones();
}


// Eliminar una publicacion despues de confirmar

function eliminarPublicacion(idPublicacion) {

    const confirmarEliminacion = window.confirm(
        "¿Deseas eliminar esta publicación?"
    );

    if (!confirmarEliminacion) {
        return;
    }

    publicaciones = publicaciones.filter(
        function (publicacion) {
            return publicacion.id !== idPublicacion;
        }
    );


    // Ya no existe el comentario que se estaba editando

    if (
        comentarioEnEdicion !== null &&
        comentarioEnEdicion.idPublicacion === idPublicacion
    ) {
        comentarioEnEdicion = null;
    }

    if (
        respuestaEnCreacion !== null &&
        respuestaEnCreacion.idPublicacion === idPublicacion
    ) {
        respuestaEnCreacion = null;
    }

    guardarPublicaciones();

    mostrarPublicaciones();
}


// Aumentar una reacción de la publicación seleccionada

function agregarReaccion(idPublicacion, tipoReaccion) {

    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return;
    }


    if (
        tipoReaccion !== "meGusta" &&
        tipoReaccion !== "meEncanta" &&
        tipoReaccion !== "meDivierte"
    ) {
        return;
    }


    const reacciones = obtenerReacciones(publicacion);

    reacciones[tipoReaccion] =
        normalizarCantidadReaccion(reacciones[tipoReaccion]) + 1;


    guardarPublicaciones();

    mostrarPublicaciones();
}


// Compatibilidad con código anterior que aplicaba Me gusta

function alternarMeGusta(idPublicacion) {

    agregarReaccion(idPublicacion, "meGusta");
}


// Marcar o quitar una publicacion de favoritas sin tocar su actividad

function alternarFavorita(idPublicacion) {

    const publicacion = buscarPublicacion(idPublicacion);

    if (publicacion === undefined) {
        return;
    }

    publicacion.favorita = !esPublicacionFavorita(publicacion);

    guardarPublicaciones();

    mostrarPublicaciones();
}


// Mostrar un error

function mostrarError(campo, elementoError, texto) {

    campo.classList.add("campo-invalido");

    elementoError.textContent = texto;
}


// Quitar un error

function quitarError(campo, elementoError) {

    campo.classList.remove("campo-invalido");

    elementoError.textContent = "";
}


// Limpiar todos los errores

function limpiarErrores() {

    quitarError(
        campoNombre,
        errorNombre
    );

    quitarError(
        campoMensaje,
        errorMensaje
    );
}
