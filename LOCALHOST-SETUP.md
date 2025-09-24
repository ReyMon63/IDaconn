# 🚀 Configuración para GitHub Pages

## ✅ **Modificaciones Realizadas**

La webapp ha sido **modificada para funcionar completamente con localStorage** en GitHub Pages:

### **Cambios Principales:**
- ✅ **Base de datos**: Ahora usa localStorage en lugar de API externa
- ✅ **Datos demo**: Se inicializan automáticamente al cargar
- ✅ **Sin dependencias**: Funciona sin servidor backend
- ✅ **Completamente offline**: Una vez cargada, funciona sin internet

## 🎯 **Cómo Probar**

### **1. Abrir la aplicación:**
`https://reymon63.github.io/IDaconn/`

### **2. Credenciales demo:**
- **Admin**: `admin@sistema.com` / `admin123` 
- **Usuario**: `maria@empresa.com` / `user123`

### **3. Funcionalidades a probar:**
1. **Login** con credenciales demo
2. **Crear proyecto** (como admin)
3. **Seleccionar proyecto** 
4. **Registrar gasto** con captura de foto
5. **Ver saldo** actualizado
6. **Generar reportes**

## 🔧 **Debugging**

### **Si hay problemas:**
- **F12** → Console para ver errores
- **Ctrl+Shift+D** → Activar modo debug
- **Ctrl+Shift+R** → Resetear datos demo

### **Datos almacenados en:**
- `localStorage.table_users`
- `localStorage.table_projects` 
- `localStorage.table_expenses`
- `localStorage.table_deposits`

## 📱 **En Dispositivo Móvil**

1. **Abrir Chrome** en el móvil
2. **Ir al link** de GitHub Pages
3. **Menú** → "Agregar a pantalla de inicio"
4. ¡**Funciona como app nativa**!

## ⚡ **Ventajas de esta Implementación**

- ✅ **Sin servidor** requerido
- ✅ **Datos persistentes** en el navegador
- ✅ **Funciona offline** después de la primera carga
- ✅ **Compatible con GitHub Pages**
- ✅ **Instalable como PWA**

## 🔄 **Si necesitas datos frescos:**

```javascript
// En la consola del navegador:
localStorage.clear();
location.reload();
```

¡**La webapp ahora funciona completamente en GitHub Pages**! 🎉