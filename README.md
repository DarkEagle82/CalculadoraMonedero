# Calculadora de Monedero

Una aplicación web desarrollada con React, TypeScript y Tailwind CSS para calcular con precisión las recargas necesarias en monederos virtuales de comedor escolar y servicio de acogida, considerando el calendario lectivo oficial, fines de semana y días festivos.

## ✨ Características Principales

* **Calendario Interactivo:**
  * Selección de rango de fechas (inicio y fin) sobre un calendario mensual en español.
  * Detección automática de fines de semana y festivos escolares (marcados en rojo).
  * Marcado en verde de días lectivos computados y azul para los extremos seleccionados.
* **Cálculo en Tiempo Real:**
  * Cálculo dinámico de días lectivos según el rango seleccionado.
  * Fórmula de cálculo: `(días_lectivos * precio_menú) + precio_acogida - total_monedero`.
  * Precios configurables y persistentes en el navegador (menú diario por defecto: 7,00 €, acogida por defecto: 16,97 €).
* **Recordatorio Mensual Inteligente:**
  * Cálculo automático de previsión para el mes siguiente (`días lectivos mes siguiente * menú + acogida`).
  * Integración con la Web Notifications API para alertas programadas a fin de mes.
* **Material Design 3:**
  * Paleta visual basada en el color semilla morado (`#673ab7`).
  * Soporte completo para Tema Claro y Tema Oscuro.
  * Tipografías Oswald (títulos) y Roboto (cuerpo e interfaces numéricas).

## 🚀 Cómo Empezar

```sh
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev

# Compilar para producción
npm run build
```

## 🛠️ Tecnologías

* [React](https://react.dev/) + [Vite](https://vitejs.dev/)
* [TypeScript](https://www.typescriptlang.org/)
* [Tailwind CSS](https://tailwindcss.com/)
* [Lucide Icons](https://lucide.dev/)
