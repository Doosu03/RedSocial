# Red Social

Proyecto académico desarrollado con HTML, CSS y JavaScript.

Actualmente el proyecto implementa las historias 1, 3, 4 y 6 a 13, incluida la edición de publicaciones y comentarios, búsqueda, ordenamiento y reacciones múltiples.

## Historias de usuario implementadas

### Historia 1: Publicar un mensaje

Como estudiante, quiero escribir mi nombre y un mensaje para compartirlo con mis compañeros.

### Historia 3: Reaccionar con “Me gusta”

Como estudiante, quiero dar “Me gusta” a las publicaciones y ver cuántos “Me gusta” tiene cada una.

### Historia 4: Conservar la información

Como estudiante, quiero que las publicaciones permanezcan guardadas para no perderlas al recargar la página.

### Historia 6: Editar una publicación

Como estudiante, quiero corregir mi mensaje para solucionar errores sin eliminar la publicación.

### Historia 7: Comentar publicaciones

Como estudiante, quiero comentar una publicación para participar en la conversación.

### Historia 8: Buscar publicaciones

Como estudiante, quiero buscar por autor o contenido para encontrar rápidamente una publicación.

### Historia 9: Ordenar publicaciones

Como estudiante, quiero ordenar las publicaciones para ver primero las más recientes o las más populares.

### Historia 12: Editar o eliminar comentarios

Como estudiante, quiero editar o eliminar mis comentarios para corregir errores o retirar contenido que ya no deseo mostrar.

### Historia 13: Reacciones múltiples

Como estudiante, quiero reaccionar de distintas maneras a una publicación para expresar mejor mi opinión.

## Funcionalidades implementadas

- Campo para escribir el nombre del estudiante.
- Campo para escribir un mensaje.
- Validación de campos obligatorios.
- Botón para publicar el mensaje.
- Visualización de la publicación en pantalla.
- Limpieza automática de los campos después de publicar.
- Contador de caracteres para el mensaje.
- Fecha y hora de creación visibles en cada publicación.
- Botones de “Me gusta”, “Me encanta” y “Me divierte” en cada publicación.
- Contadores independientes y persistentes para cada tipo de reacción.
- Migración automática de publicaciones antiguas que solo contienen “Me gusta”.
- Resumen de actividad con los totales de las tres reacciones.
- Almacenamiento de las publicaciones en LocalStorage.
- Recuperación automática de las publicaciones al recargar la página.
- Edición del mensaje de una publicación sin alterar su autor, fecha ni cantidad de “Me gusta”.
- Validación para impedir que un mensaje editado quede vacío.
- Formulario de nombre y comentario dentro de cada publicación.
- Validación de los campos obligatorios al comentar.
- Visualización del autor, texto, fecha y hora de cada comentario.
- Conservación de los comentarios en su publicación correspondiente al recargar la página.
- Campo de búsqueda por nombre del autor o contenido del mensaje.
- Filtrado de la lista mientras se escribe y al presionar el botón “Buscar”.
- Búsqueda sin distinguir mayúsculas de minúsculas.
- Botón “Limpiar” y campo vacío para volver a ver todas las publicaciones.
- Aviso al usuario cuando la búsqueda no encuentra coincidencias.
- Selector para ordenar por publicaciones recientes, antiguas o con más “Me gusta”.
- Ordenamiento compatible con los resultados de búsqueda sin modificar los datos guardados.
- Botones de “Editar” y “Eliminar” en cada comentario.
- Edición del texto de un comentario conservando su autor y su fecha original.
- Validación para impedir que un comentario editado quede vacío o con solo espacios.
- Confirmación antes de eliminar un comentario.
- Diseño adaptable para computadoras y teléfonos.

## Tecnologías utilizadas

- HTML5
- CSS3
- JavaScript
- LocalStorage del navegador

## Estructura del proyecto

```text
REDSOCIAL/
│
├── css/
│   └── styles.css
│
├── js/
│   └── app.js
│
├── media/
│
├── index.html
└── README.md
```

## Cómo ejecutar el proyecto

1. Descargar o clonar el repositorio.
2. Abrir la carpeta del proyecto en Visual Studio Code.
3. Abrir el archivo `index.html` en el navegador.

También se puede utilizar la extensión **Live Server** de Visual Studio Code.

## Pruebas

Para ejecutar las pruebas mínimas de la Historia 6:

```bash
node tests/h6.test.js
```

Para ejecutar las pruebas mínimas de la Historia 7:

```bash
node tests/h7.test.js
```

Para ejecutar las pruebas mínimas de la Historia 8:

```bash
node tests/h8.test.js
```

Para ejecutar las pruebas mínimas de la Historia 9:

```bash
node tests/h9.test.js
```

Para ejecutar las pruebas mínimas de la Historia 11:

```bash
node tests/h11.test.js
```

Para ejecutar las pruebas mínimas de la Historia 12:

```bash
node tests/h12.test.js
```

Para ejecutar las pruebas mínimas de la Historia 13:

```bash
node tests/h13.test.js
```

## Repositorio

```bash
git clone https://github.com/Doosu03/RedSocial.git
```

## Estado del proyecto

Historias 1, 3, 4, 6, 7, 8, 9, 10, 11, 12 y 13 completadas.

## Autores
1. Kevin Núñez.
2. Michael Carranza.
3. Kevin Picado.
4. Frank Mora
