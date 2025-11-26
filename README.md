# Aplicación de Captura Web a PDF

Esta aplicación web está diseñada para explorar URLs, capturar su contenido completo (incluyendo el desplazamiento vertical y enlaces relacionados) y convertirlo en documentos PDF. Sigue una arquitectura cliente-servidor para garantizar una captura de páginas web robusta y sin errores, especialmente para contenido dinámico.

## Arquitectura

La aplicación se compone de dos componentes principales:

-   **Frontend (Cliente):** Una interfaz de usuario moderna y reactiva construida con React y estilizada con Tailwind CSS. Los usuarios interactúan con esta interfaz para introducir URLs, gestionar el proceso de captura y descargar los PDFs generados. La interfaz está ahora completamente en **español**.
-   **Backend (Servidor):** Un microservicio ligero que utiliza Node.js y Express. Su responsabilidad principal es recibir una URL, usar una biblioteca de control de navegador como Puppeteer para visitar la página, realizar capturas de páginas completas en PDF (con resolución de pantalla ancha), opcionalmente seguir enlaces a una profundidad especificada, y gestionar el proceso de detención de captura. El servidor también sirve los archivos PDF generados para su descarga.

### ¿Por qué este enfoque?

Capturar páginas web completas directamente desde el navegador (frontend) es muy propenso a errores y limitaciones de seguridad (CORS). Utilizar un servidor nos permite controlar un navegador real en un entorno controlado, garantizando capturas precisas y manejando el contenido dinámico de manera efectiva. Además, la generación de PDFs complejos (especialmente con múltiples páginas y gestión de detención) se maneja mejor en el servidor.

## Tecnologías Utilizadas

-   **Frontend:** React, Vite, Tailwind CSS, Lucide React
-   **Backend:** Node.js, Express, Puppeteer, Cors

## Fases del Proyecto (Estado Actual)

### Funcionalidad Actual:

-   **Captura a PDF de página completa:** El servidor ahora genera directamente PDFs de páginas web completas, incluyendo contenido que requiere desplazamiento vertical.
-   **Resolución de Pantalla Ancha:** Las capturas se realizan con una resolución de pantalla ancha (2560x1080) para un mejor detalle.
-   **Rastreo Recursivo:** Opción para seguir enlaces desde la URL inicial hasta una profundidad máxima especificada, generando un PDF por cada página única visitada.
-   **Detener Captura:** El usuario puede enviar una señal al servidor para detener un proceso de captura en curso, y el servidor devolverá los PDFs generados hasta ese momento.
-   **Descarga de PDFs:** Los usuarios pueden descargar los PDFs generados directamente desde la interfaz del cliente.
-   **"Nueva Exploración"**: Un botón para reiniciar el estado de la aplicación y comenzar una nueva captura.
-   **Interfaz en Español:** Todos los textos de la interfaz de usuario en el cliente están en español.

## Cómo Ejecutar la Aplicación

1.  **Instalar dependencias del servidor:**
    ```bash
    cd server
    npm install
    ```
2.  **Iniciar el servidor:**
    ```bash
    cd server
    node server.js
    ```
    (Asegúrate de que el servidor se mantenga en ejecución).
3.  **Instalar dependencias del cliente:**
    ```bash
    cd client
    npm install
    ```
4.  **Iniciar el cliente:**
    ```bash
    cd client
    npm run dev
    ```
5.  Abre tu navegador y navega a la URL que te proporciona el cliente (normalmente `http://localhost:5173`).

---

**Nota:** En el entorno de desarrollo, el servidor (`localhost:5001`) y el cliente (`localhost:5173`) se ejecutan en puertos diferentes, lo cual se maneja con la configuración CORS en el servidor.
