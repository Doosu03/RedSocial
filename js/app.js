// Clave utilizada para guardar las publicaciones
const CLAVE_LOCAL_STORAGE = "publicacionesRedSocial";


// Elementos del HTML

const formulario = document.getElementById(
    "formulario-publicacion"
);

const campoNombre = document.getElementById("nombre");
const campoMensaje = document.getElementById("mensaje");

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


// Cargar las publicaciones guardadas

let publicaciones = cargarPublicaciones();

// Identifica la publicación que se está editando actualmente
let idPublicacionEnEdicion = null;

// Texto que se está buscando actualmente
let terminoBusqueda = "";

mostrarPublicaciones();


// Evento para publicar un mensaje

formulario.addEventListener("submit", function (evento) {

    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const mensaje = campoMensaje.value.trim();

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


    if (!formularioValido) {
        return;
    }


    // Crear una nueva publicación

    const nuevaPublicacion = {
        id: Date.now(),
        nombre: nombre,
        mensaje: mensaje,
        fecha: new Date().toISOString(),
        meGusta: 0,
        meGustaActivo: false,
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

    contadorCaracteres.textContent = "0/250";

    campoNombre.focus();
});


// Contador de caracteres

campoMensaje.addEventListener("input", function () {

    const cantidadCaracteres =
        campoMensaje.value.length;

    contadorCaracteres.textContent =
        `${cantidadCaracteres}/250`;

    quitarError(
        campoMensaje,
        errorMensaje
    );
});


// Quitar el error del nombre mientras se escribe

campoNombre.addEventListener("input", function () {

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


// Dejar el campo de búsqueda vacío

function reiniciarBusqueda() {

    campoBusqueda.value = "";

    terminoBusqueda = "";
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

    // Sin búsqueda se muestran todas las publicaciones

    if (textoBuscado === "") {
        return publicaciones;
    }

    return publicaciones.filter(function (publicacion) {
        return coincideConBusqueda(publicacion, textoBuscado);
    });
}


// Informar el resultado de la búsqueda

function actualizarMensajesDeLista(cantidadVisible) {

    const textoBuscado = terminoBusqueda.trim();


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

        mensajeVacio.textContent =
            `No se encontraron publicaciones con "${textoBuscado}".`;

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

    const cantidadMeGusta = Number(publicacion.meGusta);

    return {
        id: publicacion.id,
        nombre: publicacion.nombre,
        mensaje: publicacion.mensaje,

        fecha: obtenerFecha(publicacion),

        meGusta:
            Number.isFinite(cantidadMeGusta) &&
            cantidadMeGusta > 0
                ? Math.floor(cantidadMeGusta)
                : 0,

        meGustaActivo:
            publicacion.meGustaActivo === true,

        comentarios: obtenerComentarios(publicacion)
    };
}


// Recuperar los comentarios de una publicación

function obtenerComentarios(publicacion) {

    if (Array.isArray(publicacion.comentarios)) {
        return publicacion.comentarios;
    }

    // Las publicaciones antiguas no tienen comentarios

    return [];
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

    const publicacionesVisibles = filtrarPublicaciones();

    actualizarMensajesDeLista(publicacionesVisibles.length);

    if (publicacionesVisibles.length === 0) {
        return;
    }


    publicacionesVisibles.forEach(function (publicacion) {

        const articulo =
            document.createElement("article");

        articulo.classList.add("publicacion");


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


        const contenidoPublicacion =
            crearContenidoPublicacion(publicacion);


        // Zona de acciones con el "Me gusta"

        const acciones =
            document.createElement("div");

        acciones.classList.add(
            "acciones-publicacion"
        );


        const contadorMeGusta =
            document.createElement("span");

        contadorMeGusta.classList.add(
            "contador-me-gusta"
        );

        contadorMeGusta.textContent =
            `${publicacion.meGusta} me gusta`;


        const grupoBotones =
            document.createElement("div");

        grupoBotones.classList.add(
            "botones-publicacion"
        );


        const botonMeGusta =
            document.createElement("button");

        botonMeGusta.type = "button";

        botonMeGusta.classList.add(
            "boton-me-gusta"
        );

        if (publicacion.meGustaActivo) {

            botonMeGusta.classList.add("activo");

            botonMeGusta.textContent =
                "👍 Quitar me gusta";

        } else {

            botonMeGusta.textContent =
                "👍 Me gusta";
        }


        botonMeGusta.addEventListener(
            "click",
            function () {
                alternarMeGusta(publicacion.id);
            }
        );


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


        grupoBotones.appendChild(botonMeGusta);
        grupoBotones.appendChild(botonEditar);
        grupoBotones.appendChild(botonEliminar);

        acciones.appendChild(contadorMeGusta);
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
                crearComentario(comentario)
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

function crearComentario(comentario) {

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


    const textoComentario = document.createElement("p");

    textoComentario.textContent = comentario.texto;


    articuloComentario.appendChild(encabezadoComentario);
    articuloComentario.appendChild(textoComentario);

    return articuloComentario;
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


    const publicacion = publicaciones.find(
        function (elemento) {
            return elemento.id === idPublicacion;
        }
    );

    if (publicacion === undefined) {
        return;
    }

    if (!Array.isArray(publicacion.comentarios)) {
        publicacion.comentarios = [];
    }


    const nuevoComentario = {
        id: Date.now(),
        nombre: nombre,
        texto: texto,
        fecha: new Date().toISOString()
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
    campoEdicion.maxLength = 250;
    campoEdicion.rows = 4;


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
        cancelarEdicion();
    });


    campoEdicion.addEventListener("input", function () {
        quitarError(campoEdicion, errorEdicion);
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


    const publicacion = publicaciones.find(
        function (elemento) {
            return elemento.id === idPublicacion;
        }
    );

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

    guardarPublicaciones();

    mostrarPublicaciones();
}


// Dar o quitar el "Me gusta" de una publicación

function alternarMeGusta(idPublicacion) {

    const publicacion = publicaciones.find(
        function (elemento) {
            return elemento.id === idPublicacion;
        }
    );

    if (publicacion === undefined) {
        return;
    }


    if (publicacion.meGustaActivo) {

        publicacion.meGustaActivo = false;

        if (publicacion.meGusta > 0) {
            publicacion.meGusta = publicacion.meGusta - 1;
        }

    } else {

        publicacion.meGustaActivo = true;

        publicacion.meGusta = publicacion.meGusta + 1;
    }


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
