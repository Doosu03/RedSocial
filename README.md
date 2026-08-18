# Red Social

Proyecto académico desarrollado con HTML, CSS y JavaScript.

Actualmente el proyecto implementa las historias 1, 3, 4 y 6 a 19, incluida la edición de publicaciones y comentarios, búsqueda, ordenamiento, reacciones múltiples, respuestas, etiquetas por tema, paginación de la lista y respaldo de la información.

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

### Historia 14: Responder comentarios

Como estudiante, quiero responder un comentario para continuar una conversación específica.

### Historia 15: Etiquetas y filtro por tema

Como estudiante, quiero asignar un tema a mi publicación para organizar y encontrar contenido relacionado.

### Historia 18: Paginación de publicaciones

Como estudiante, quiero ver las publicaciones por páginas para navegar cómodamente cuando existe mucho contenido.

### Historia 19: Exportar e importar un respaldo

Como estudiante, quiero descargar y restaurar un respaldo para proteger la información de la red social.

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
- Acción “Responder” disponible en cada comentario.
- Formulario de nombre y texto para responder un comentario específico.
- Visualización del autor, texto, fecha y hora de cada respuesta.
- Varias respuestas persistentes por comentario sin mezclarse entre publicaciones.
- Compatibilidad con comentarios antiguos que no contienen respuestas.
- Selector de tema General, Estudio, Evento o Ayuda al publicar.
- Distintivo visual con la etiqueta de cada publicación.
- Filtro por tema compatible con la búsqueda y el ordenamiento.
- Migración de publicaciones antiguas sin etiqueta al tema General.
- Conservación de la etiqueta al recargar la página.
- Lista dividida en páginas de cinco publicaciones como máximo.
- Controles “Anterior” y “Siguiente” con el indicador de la página actual.
- Desactivación de “Anterior” en la primera página y de “Siguiente” en la última.
- Recálculo de las páginas al buscar, filtrar por tema o favoritas y ordenar.
- Regreso automático a una página válida al eliminar publicaciones.
- Descarga de un archivo JSON con todas las publicaciones y sus datos relacionados.
- Restauración de un respaldo desde un archivo JSON seleccionado.
- Confirmación antes de reemplazar las publicaciones actuales.
- Aviso ante un archivo inválido, conservando la información actual.
- Actualización inmediata de la interfaz al importar, con los datos guardados en LocalStorage.
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

Para ejecutar las pruebas mínimas de la Historia 14:

```bash
node tests/h14.test.js
```

Para ejecutar las pruebas mínimas de la Historia 15:

```bash
node tests/h15.test.js
```

Para ejecutar las pruebas mínimas de la Historia 18:

```bash
node tests/h18.test.js
```

Para ejecutar las pruebas mínimas de la Historia 19:

```bash
node tests/h19.test.js
```

## Repositorio

```bash
git clone https://github.com/Doosu03/RedSocial.git
```

## Estado del proyecto

Historias 1, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 y 19 completadas.

## Autores
1. Kevin Núñez.
2. Michael Carranza.
3. Kevin Picado.
4. Frank Mora
