# Blueprint de la Aplicación de Monedero

## Visión General

Esta aplicación es una calculadora de gastos recurrentes (como un comedor escolar) diseñada para ayudar a los usuarios a determinar cuánto dinero necesitan añadir a un monedero virtual. El cálculo se basa en un rango de fechas seleccionado, teniendo en cuenta días festivos y fines de semana.

La aplicación está construida con Flutter, aprovechando un diseño moderno y reactivo con Material Design 3, y está preparada para una futura integración con servicios de backend como Firebase.

## Estilo, Diseño y Características

Esta sección documenta todas las decisiones de diseño y las funcionalidades implementadas en la aplicación desde su creación hasta la versión actual.

### 1. Arquitectura y Estado

*   **Gestión de Estado:** Se utiliza el paquete `provider` para la gestión del estado del tema (claro/oscuro), permitiendo una reactividad eficiente y un código desacoplado.
*   **Estructura de Archivos:** El código está organizado en archivos separados por funcionalidad para mejorar la mantenibilidad:
    *   `main.dart`: Punto de entrada, configuración de temas y rutas.
    *   `home_screen.dart`: Contiene toda la lógica y la interfaz de usuario de la pantalla principal.
    *   `theme_provider.dart`: Gestiona el estado del tema de la aplicación.
    *   `notification_service.dart`: Encapsula toda la lógica para mostrar, programar y calcular notificaciones locales.
    *   `holidays.dart`: Centraliza la lista de días festivos como una constante para ser usada en toda la aplicación.

### 2. Funcionalidad Principal (Calculadora)

*   **Calendario Interactivo (`table_calendar`):**
    *   El usuario puede seleccionar un rango de fechas (inicio y fin) directamente en el calendario.
    *   Los días no lectivos (festivos y fines de semana) están visualmente diferenciados con un color rojo, usando la lista centralizada de `holidays.dart`.
    *   Los días laborables dentro del rango seleccionado se marcan en verde.
    *   El calendario está configurado en español (`locale: 'es_ES'`).
*   **Cálculo de Importe:**
    *   La aplicación calcula automáticamente el número de días lectivos dentro del rango seleccionado.
    *   Los usuarios pueden introducir el "Precio del menú diario", el "Precio de acogida" y el "Total actual en el monedero" a través de campos de texto.
    *   El "Importe a añadir" se calcula en tiempo real con la fórmula: `(días_lectivos * precio_menú) + precio_acogida - total_monedero`.
*   **Interfaz de Usuario:**
    *   La información se presenta de forma clara, con los resultados del cálculo (días lectivos e importe a añadir) destacados en la parte inferior.

### 3. Características Adicionales

*   **Tema Visual (Claro/Oscuro):**
    *   Se implementa un tema dual basado en **Material Design 3** (`useMaterial3: true`).
    *   La paleta de colores se genera a partir de un color semilla (`Colors.deepPurple`), asegurando armonía visual.
    *   Se utiliza `google_fonts` (`Oswald` para títulos y `Roboto` para el cuerpo) para una estética moderna.
    *   Un botón en la barra superior permite al usuario cambiar fácilmente entre el modo claro y oscuro.
*   **Notificaciones Locales (`flutter_local_notifications`):**
    *   **Notificación Inmediata:** Un botón de campana (🔔) en la barra superior dispara una notificación al instante, recordando al usuario el importe exacto que debe añadir según el cálculo actual en pantalla.
    *   **Recordatorio Mensual Inteligente:**
        *   El último día de cada mes a las 10:00, la aplicación envía una notificación automática.
        *   El contenido de esta notificación es **dinámico**: calcula el coste total estimado para el *siguiente mes completo* (días lectivos * precio menú + precio acogida).
        *   Esta notificación se **reprograma automáticamente** con el cálculo actualizado cada vez que el usuario modifica el precio del menú o de la acogida en la aplicación, asegurando que el recordatorio sea siempre preciso.

## Plan Actual

*   **Tarea:** Generar el archivo APK de la versión final de la aplicación, incorporando el recordatorio mensual inteligente.
*   **Comando:** `flutter build apk --release`
*   **Resultado Esperado:** Un archivo `app-release.apk` funcional con todas las características descritas.
