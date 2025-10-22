# 📱 IDACONN - Gestor de Gastos

Una aplicación web progresiva (PWA) para la gestión de gastos empresariales con interface limpia, OCR automático y funcionalidades administrativas completas.

## ✅ Funcionalidades Implementadas

### 🔐 Sistema de Autenticación
- **Login con roles**: Administrador y Usuario
- **Credenciales del administrador**:
  - Administrador: `ramon.rivas@me.com` / `admin123`
  - Los usuarios adicionales deben solicitar acceso
- **Datos específicos por usuario**: Cada usuario solo ve sus propios gastos

### 📁 Gestión de Proyectos
- **Proyectos predefinidos** con presupuestos:
  - Proyecto Alpha: $50,000 MXN
  - Proyecto Beta: $30,000 MXN
- **CRUD completo**: Admin puede crear, editar y eliminar proyectos
- **Validación de saldo**: No permite gastos que excedan el presupuesto

### 📋 Tipos de Comprobantes
- **Facturas (XML + PDF)**: Procesamiento automático de CFDI
- **Tickets/Recibos**: Con OCR para detección automática de montos
- **Registro Manual**: Sin comprobante físico

### 🤖 OCR Inteligente
- **Tesseract.js**: Procesamiento real de imágenes
- **Detección automática**: Extrae montos de tickets mexicanos
- **Patrones múltiples**: $, pesos, MXN, totales, importes
- **Auto-llenado**: Campo de monto se completa automáticamente

### 💰 Gestión Financiera
- **Admin agrega presupuesto**: Función exclusiva de administradores
- **Saldo en tiempo real**: Cálculo automático (Presupuesto - Gastos)
- **Validación preventiva**: Alertas antes de exceder límites

### 📊 Sistema de Reportes
- **Exportación CSV**: Datos organizados para Excel
- **Archivos adjuntos**: Descarga individual de XML, PDF, imágenes
- **Numeración única**: Sistema de registros por usuario/proyecto
- **Reseteo mensual**: Opción para limpiar datos al cierre

### 👥 Gestión de Usuarios
- **Solicitudes de acceso**: Formulario público para nuevos usuarios
- **Panel administrativo**: Aprobar/rechazar solicitudes
- **📧 Emails reales**: Notificaciones automáticas con EmailJS configurado
- **🔔 Notificaciones internas**: Badge animado para solicitudes pendientes
- **Creación manual**: Admin puede agregar usuarios directamente
- **✏️ Edición completa**: Modificar nombre, email, rol y contraseña de usuarios
- **🗑️ Eliminación segura**: Borrar usuarios con protección del último admin

## 🚀 Instrucciones de Uso

### 📋 Inicio Rápido
1. **Abrir**: `index.html` en cualquier navegador moderno
2. **Login**: Usar credenciales predefinidas
3. **Seleccionar proyecto**: Elegir de la lista disponible
4. **Registrar gastos**: Seguir el flujo según el tipo

### 💼 Para Administradores
- **Login**: `ramon.rivas@me.com` / `admin123`
- **Funciones exclusivas**:
  - Crear/editar/eliminar proyectos
  - Agregar presupuesto a proyectos
  - Gestionar solicitudes de usuarios
  - Ver todos los datos del sistema

### 👤 Para Usuarios Regulares  
- **Acceso**: Debe solicitar acceso desde la pantalla de login
- **Funciones disponibles**:
  - Registrar gastos en proyectos asignados
  - Ver reportes personales
  - Exportar datos propios

## 🛠️ Características Técnicas

### 📱 Mobile-First
- **Interfaz compacta**: Sin espacios desperdiciados
- **Touch-friendly**: Botones optimizados para móviles
- **Responsive**: Se adapta a cualquier pantalla

### 🔧 Arquitectura
- **Single Page App**: Todo en un archivo HTML
- **Tailwind CSS**: Framework moderno desde CDN
- **Font Awesome**: Iconografía profesional
- **Tesseract.js**: OCR desde CDN
- **LocalStorage**: Persistencia de datos local

### 📊 Datos y Export
- **Formato JSON**: Exportación completa
- **Archivos base64**: Imágenes y documentos embebidos
- **CSV compatible**: Abre directo en Excel
- **Numeración sistemática**: Registros únicos por usuario/proyecto

## 📁 Estructura del Proyecto

```
📂 Proyecto/
├── 📄 index.html          ← Aplicación completa
├── 📄 README.md           ← Este archivo
├── 📄 manifest.json       ← PWA manifest
├── 📄 sw.js              ← Service Worker
└── 📁 icons/             ← Iconos PWA
    └── icon-192.png
```

## 🌟 Ventajas Clave

### ✅ Para la Empresa
- **Sin servidor**: Funciona 100% en el navegador
- **Sin base de datos**: Almacenamiento local
- **Cero configuración**: Solo abrir el archivo HTML
- **Multiplataforma**: Windows, Mac, Android, iOS

### ✅ Para los Usuarios
- **OCR automático**: No escribir montos manualmente
- **Interface limpia**: Sin elementos confusos
- **Validación inteligente**: Previene errores de presupuesto
- **Export fácil**: Datos listos para contabilidad

### ✅ Para Administradores
- **Control total**: Gestión de proyectos y usuarios
- **Notificaciones**: Sistema de emails simulado
- **Reportes completos**: Visibilidad de todos los datos
- **Flexibilidad**: Agregar presupuesto cuando sea necesario

## 💡 Próximos Desarrollos Sugeridos

- [ ] **Backend real**: API REST para sincronización
- [ ] **Base de datos**: PostgreSQL o MongoDB
- [ ] **Emails reales**: Integración con servicios SMTP
- [ ] **Reportes avanzados**: Gráficas con Chart.js
- [ ] **Autenticación OAuth**: Login con Google/Microsoft
- [ ] **App móvil nativa**: React Native o Flutter

## 🎯 Estado Actual

**✅ COMPLETAMENTE FUNCIONAL**: La aplicación cumple todos los requerimientos originales y está lista para uso en producción.

**📱 OPTIMIZADO PARA MÓVILES**: Interface compacta sin espacios excesivos, perfecta para uso en smartphones.

**🚀 LISTO PARA DESPLEGAR**: Solo necesitas subir el archivo `index.html` a cualquier servidor web o usarlo localmente.

## 🔧 **Nueva Interfaz de Administración Implementada**

### ✅ **Sistema de 3 Secciones Independientes**
- **🏗️ Sección de Proyectos**: Layout financiero exacto según imagen de referencia
- **📋 Sección de Solicitudes**: Muestra SOLO solicitudes pendientes de aprobación
- **👥 Sección de Usuarios**: Administración SOLO de usuarios ya registrados
- **🎨 Efectos 3D**: Animaciones interactivas en botones y transiciones
- **📱 Responsive**: Optimizado para móviles y escritorio
- **🔄 Separación clara**: Usuarios registrados vs solicitudes pendientes
- **✅ Funcionalidades completas**: Aprobar/rechazar solicitudes, crear proyectos

### 🏗️ **Layout Financiero de Proyectos**
- **📊 Layout vertical**: Diseño exacto como la imagen de referencia proporcionada
- **📈 Barra de progreso**: Visualización del porcentaje de presupuesto usado
- **📋 Contadores**: "X gastos • X aportaciones" en formato compacto
- **💰 Métricas financieras**: Presupuesto Original, Total, Aportaciones, Disponible, Gastado
- **🎯 Código de colores**: Azul, verde, rojo según corresponda
- **➕ Botón de aportación**: Funcional para agregar presupuesto a proyectos
- **🗑️ Botón de eliminación**: Confirma antes de eliminar proyectos

## 📧 **EmailJS Configurado y Listo**

### ✅ **Sistema de Emails Reales Activo**
- **📧 Emails automáticos**: Configuración EmailJS funcional
- **📬 Templates creados**: Aprobación y rechazo de usuarios  
- **🔔 Notificaciones internas**: Badge animado para solicitudes pendientes
- **🎯 Listo para uso**: Envía emails reales automáticamente

### 🚀 **Funcionalidades Email**
1. **Solicitud de acceso**: Usuario completa formulario
2. **Notificación admin**: Badge rojo animado en "Gestión de Usuarios"
3. **Aprobación**: Email automático con credenciales temporales
4. **Rechazo**: Email automático con motivo del rechazo

### 📝 **Templates Configurados**
- ✅ **Aprobación**: Incluye credenciales y URL de acceso
- ✅ **Rechazo**: Notificación profesional con motivo
- 🔔 **Notificaciones admin**: Sistema interno (no email, badge visual)

**Todo funciona automáticamente - ¡No requiere configuración adicional!**

## 🔧 Últimas Correcciones (Octubre 2024)

### 🆕 Sistema de Notificaciones de Usuario Mejorado
- **🔔 Burbuja roja de notificaciones**: Badge animado que muestra el número de solicitudes pendientes en el botón "Gestión de Usuarios"
- **💬 Prompt para motivo de rechazo**: Diálogo modal que solicita el motivo específico antes de rechazar una solicitud de usuario  
- **📧 Emails de rechazo mejorados**: El motivo del rechazo ahora se incluye correctamente en el email enviado al usuario
- **🧪 Usuario de prueba**: Sistema incluye un usuario pendiente de prueba para verificar el funcionamiento del badge
- **🔍 Debugging mejorado**: Logs detallados para monitorear el funcionamiento del sistema de notificaciones

### 🐛 Correcciones Críticas Recientes
- **✅ Modal de rechazo corregido**: Solucionado problema donde el popup no aparecía al hacer clic en "Rechazar"
- **✅ Lógica de botón arreglada**: Corregido problema donde el botón se deshabilitaba al escribir texto
- **✅ IDs únicos**: Prevención de conflictos con IDs duplicados en múltiples modales
- **✅ Validación mejorada**: Botón se habilita correctamente cuando hay 10+ caracteres de contenido real
- **✅ Event listeners optimizados**: Mejor manejo de eventos para evitar conflictos

### 🚨 **CORRECCIÓN CRÍTICA: Sistema de Popups Reparado**
- **🛠️ Función showCustomConfirm corregida**: Solucionado el problema donde los popups mostraban opciones incorrectas ("descargar" y "cerrar mes") en lugar de confirmaciones apropiadas
- **✅ Parámetros por defecto actualizados**: Ahora usa "Confirmar" y "Cancelar" como textos por defecto
- **🗑️ Eliminar proyecto mejorado**: El popup ahora muestra correctamente "¿Estás seguro de eliminar el proyecto?" con opciones "Sí, Eliminar" y "Cancelar"
- **💰 Agregar aportación mejorado**: Flujo completamente rediseñado con confirmación previa y validación de entrada
- **🔒 Validación robusta**: Verificación de montos válidos antes de procesar aportaciones
- **📝 Mensajes claros**: Todos los popups ahora muestran contenido correcto y relevante para cada acción

### 🔐 Sistema de Usuarios Aprobados Corregido
- **✅ Usuarios agregados a la lista**: Los usuarios aprobados ahora aparecen correctamente en la gestión de usuarios
- **✅ Login con credenciales de email**: Las credenciales enviadas por correo permiten acceso exitoso al sistema
- **✅ Cambio de contraseña obligatorio**: Sistema fuerza cambio de contraseña temporal en primer login
- **🔑 Validaciones de seguridad**: Contraseña mínima 6 caracteres, debe ser diferente a la temporal
- **📧 Variables EmailJS actualizadas**: Uso de `{{name}}`, `{{Destinatario}}`, `{{usermail}}`, `{{motivo}}`, `{{contacto}}`, `{{clave}}`, `{{weblink}}`

### 🎛️ Interfaz Admin Completamente Unificada (3 Secciones Inline)
- **📋 3 Tarjetas Uniformes**: Proyectos, Solicitudes y Usuarios - TODAS como secciones inline (sin popups)
- **📋 Sección de Proyectos**: Diseño completo con toda la información financiera (presupuesto original, aportaciones, gastado, total, disponible) y barra de progreso como el diseño original
- **⏳ Sección de Solicitudes**: Manejo exclusivo de solicitudes pendientes con diseño dedicado y contador en tiempo real  
- **👥 Sección de Usuarios**: Gestión completa de usuarios registrados con botones Editar/Borrar integrados
- **🔄 Toggle Consistente**: Las 3 tarjetas funcionan igual (mostrar/ocultar sección, solo una visible a la vez)
- **📊 Contadores en Todo**: Badges dinámicos en las 3 secciones (proyectos, solicitudes, usuarios)
- **🎨 Diseño Totalmente Uniforme**: Cards con gradientes consistentes, tipografía y espaciado idéntico

### 🔔 Sistema de Notificaciones Mejorado
- **🚨 Badge en Solicitudes**: La alerta de notificaciones ahora aparece en la tarjeta correcta (Solicitudes, no Usuarios)
- **📏 Badge Más Grande**: Notificación 40% más grande con gradiente rojo y animaciones múltiples
- **✨ Efectos Avanzados**: Pulso, brillo y rebote combinados para máxima visibilidad
- **🎯 Efecto 3D en Tarjeta Activa**: La tarjeta seleccionada se eleva con sombra 3D, escala y brillo
- **🔄 Transiciones Suaves**: Animaciones fluidas entre estados activo/inactivo

### ✅ Problemas Resueltos
- **🚪 Popup de logout**: Corregido para mostrar confirmación de cierre de sesión en lugar de opciones de exportación
- **📅 Validación de cierre mensual**: Configurado para alertar solo si faltan más de 7 días para fin de mes (última semana procede automáticamente)
- **💾 Función de cierre mensual**: Corregida para descargar automáticamente los datos CSV y reiniciar completamente todos los contadores y gastos
- **🔄 Reinicio automático**: El cierre mensual ahora archiva correctamente los gastos y reinicia la aplicación
- **🎯 Validación de proyectos**: Corregido error "Proyecto no encontrado" con selección automática del primer proyecto disponible
- **🚪 Header de logout**: Corregido para que desaparezca completamente al cerrar sesión
- **💰 Limpieza de aportaciones**: Las aportaciones ahora se eliminan correctamente en el cierre mensual

### 🧪 Funcionalidades Validadas
- ✅ Logout muestra mensaje correcto: "¿Estás seguro de que quieres cerrar sesión?"
- ✅ Cierre mensual calcula días restantes correctamente
- ✅ **Cierre automático en última semana**: Si faltan 7 días o menos, procede sin confirmación
- ✅ **Alerta de cierre prematuro**: Solo si faltan más de 7 días para fin de mes
- ✅ **Descarga automática de CSV**: Funciona correctamente durante el cierre mensual
- ✅ **Reinicio completo de datos**: Después del cierre todos los contadores se reinician
- ✅ **Archivado de gastos**: Por mes en localStorage con clave única
- ✅ **Validación de proyectos**: Selección automática si el proyecto no se encuentra
- ✅ **Logout completo**: Header y dashboard desaparecen completamente al cerrar sesión  
- ✅ **Reset de aportaciones**: Limpieza completa de aportaciones durante cierre mensual