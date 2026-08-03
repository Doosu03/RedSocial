// Elementos del formulario

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


// Evento para publicar un mensaje

formulario.addEventListener("submit", function (evento) {

    // Evita que la página se recargue
    evento.preventDefault();

    const nombre = campoNombre.value.trim();
    const mensaje = campoMensaje.value.trim();

    limpiarErrores();

    let formularioValido = true;

    // Validar nombre

    if (nombre === "") {

        mostrarError(
            campoNombre,
            errorNombre,
            "El nombre es obligatorio."
        );

        formularioValido = false;
    }

    // Validar mensaje

    if (mensaje === "") {

        mostrarError(
            campoMensaje,
            errorMensaje,
            "El mensaje es obligatorio."
        );

        formularioValido = false;
    }

    // Detener el proceso si hay errores

    if (!formularioValido) {
        return;
    }

    // Mostrar la publicación

    crearPublicacion(nombre, mensaje);

    // Limpiar los campos después de publicar

    formulario.reset();

    contadorCaracteres.textContent = "0/250";

    campoNombre.focus();
});


// Contador de caracteres

campoMensaje.addEventListener("input", function () {

    const cantidadCaracteres = campoMensaje.value.length;

    contadorCaracteres.textContent =
        `${cantidadCaracteres}/250`;
});


// Quitar el error mientras se escribe el nombre

campoNombre.addEventListener("input", function () {

    quitarError(
        campoNombre,
        errorNombre
    );
});


// Quitar el error mientras se escribe el mensaje

campoMensaje.addEventListener("input", function () {

    quitarError(
        campoMensaje,
        errorMensaje
    );
});


// Crear y mostrar una publicación

function crearPublicacion(nombre, mensaje) {

    const publicacion = document.createElement("article");

    publicacion.classList.add("publicacion");

    const nombreEstudiante = document.createElement("h3");

    nombreEstudiante.textContent = nombre;

    const textoMensaje = document.createElement("p");

    textoMensaje.textContent = mensaje;

    publicacion.appendChild(nombreEstudiante);
    publicacion.appendChild(textoMensaje);

    listaPublicaciones.appendChild(publicacion);

    mensajeVacio.style.display = "none";
}


// Mostrar un mensaje de error

function mostrarError(campo, elementoError, texto) {

    campo.classList.add("campo-invalido");

    elementoError.textContent = texto;
}


// Quitar el mensaje de error

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