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


// Cargar las publicaciones guardadas

let publicaciones = cargarPublicaciones();

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
        meGustaActivo: false
    };


    // Agregar la publicación

    publicaciones.push(nuevaPublicacion);


    // Guardar la información en LocalStorage

    guardarPublicaciones();


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
            publicacion.meGustaActivo === true
    };
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

    if (publicaciones.length === 0) {

        mensajeVacio.style.display = "block";

        return;
    }

    mensajeVacio.style.display = "none";


    publicaciones.forEach(function (publicacion) {

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


        const textoMensaje =
            document.createElement("p");

        textoMensaje.textContent =
            publicacion.mensaje;


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
        grupoBotones.appendChild(botonEliminar);

        acciones.appendChild(contadorMeGusta);
        acciones.appendChild(grupoBotones);


        articulo.appendChild(encabezadoPublicacion);
        articulo.appendChild(textoMensaje);
        articulo.appendChild(acciones);

        listaPublicaciones.appendChild(articulo);
    });
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
