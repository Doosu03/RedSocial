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
        mensaje: mensaje
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
            return publicacionesConvertidas;
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


        const textoMensaje =
            document.createElement("p");

        textoMensaje.textContent =
            publicacion.mensaje;


        articulo.appendChild(nombreEstudiante);
        articulo.appendChild(textoMensaje);

        listaPublicaciones.appendChild(articulo);
    });
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