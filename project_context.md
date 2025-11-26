# Contexto del Proyecto

## Objetivo del Proyecto
El objetivo principal de este proyecto es desarrollar una aplicación web que pueda explorar URLs, capturar su contenido completo (incluyendo el desplazamiento vertical y enlaces relacionados) y convertirlo en documentos PDF. Esto implica una arquitectura cliente-servidor con un frontend en React y un backend en Node.js/Express utilizando Puppeteer para la captura web.

## Estado Actual
- La estructura del proyecto ha sido definida con las carpetas `client` y `server`.
- Se ha implementado la funcionalidad completa de captura de web a PDF, incluyendo:
    - **Captura a PDF de página completa:** El servidor genera directamente PDFs de páginas web completas.
    - **Resolución de Pantalla Ancha:** Las capturas se realizan con una resolución de pantalla ancha (2560x1080).
    - **Rastreo Recursivo:** Capacidad para seguir enlaces hasta una profundidad máxima, generando un PDF por cada página.
    - **Detener Captura:** Mecanismo para detener un proceso de captura en curso desde el cliente.
    - **Descarga de PDFs:** Funcionalidad para que el cliente descargue los PDFs generados desde el servidor.
    - **"Nueva Exploración"**: Botón para reiniciar la aplicación en el cliente.
    - **Interfaz en Español:** Todos los textos de la interfaz de usuario en el cliente están en español.
- El backend utiliza Node.js, Express y Puppeteer.
- El frontend utiliza React, Vite, Tailwind CSS y Lucide React.
- Se ha configurado CORS en el servidor para permitir la comunicación con el cliente.

## Próximos Pasos (Pendientes)
1.  Verificar que la funcionalidad de rastreo recursivo y detención funciona correctamente en un escenario real con múltiples enlaces.
2.  Considerar la limpieza automática de los archivos PDF generados en el directorio `server/temp` después de un cierto tiempo o tras la descarga.

## Integración de Gemini Flash
El usuario también ha solicitado cambiar a "Gemini Flash". Esto sugiere una futura integración del modelo Gemini Flash en este proyecto. El caso de uso específico para Gemini Flash (por ejemplo, análisis de contenido, resumen de páginas capturadas) aún no está definido, pero se abordará una vez que se establezca la funcionalidad principal de captura de web a PDF.
