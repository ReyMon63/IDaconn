# 🔧 Solución de Problemas - Cámara y Scanner

## ❌ **Error: "Marca error al iniciar cámara"**

### 🔍 **Diagnóstico Paso a Paso**

#### **1. Verificar Permisos de Cámara**
**Problema más común**: Navegador no tiene permisos
- **Chrome**: Icono de cámara en barra de direcciones → Permitir
- **Safari iOS**: Ajustes → Safari → Cámara → Permitir
- **Firefox**: Icono de escudo → Permisos → Cámara

#### **2. Verificar HTTPS**
**Requerimiento**: La API de cámara requiere HTTPS
- ✅ **GitHub Pages**: Automáticamente HTTPS
- ❌ **HTTP local**: No funcionará
- **Solución**: Usar `https://` en la URL

#### **3. Verificar Disponibilidad**
```javascript
// En consola del navegador (F12)
navigator.mediaDevices.getUserMedia({video: true})
  .then(() => console.log('✅ Cámara disponible'))
  .catch(err => console.log('❌ Error:', err.message));
```

### 🛠️ **Errores Específicos y Soluciones**

#### **Error: "NotAllowedError"**
- **Causa**: Permisos denegados
- **Solución**: Permitir cámara en configuración del navegador
- **Móvil**: Recargar página y permitir cuando pregunte

#### **Error: "NotFoundError"** 
- **Causa**: No hay cámara disponible
- **Solución**: Verificar que el dispositivo tenga cámara
- **Móvil**: Verificar que no esté en modo escritorio

#### **Error: "NotReadableError"**
- **Causa**: Cámara en uso por otra app
- **Solución**: Cerrar otras apps que usen cámara
- **Móvil**: Cerrar apps de cámara/videollamadas

#### **Error: "OverconstrainedError"**
- **Causa**: Resolución no soportada
- **Solución**: App ya tiene fallback automático

### 📱 **Problemas Específicos Móvil**

#### **iPhone/iPad**
```javascript
// Configuración específica iOS
video.setAttribute('playsinline', true);
video.setAttribute('webkit-playsinline', true);
```

#### **Android Chrome**
- **Problema**: Puede requerir interacción del usuario
- **Solución**: Solo inicia después de tocar botón

### 🔧 **Debugging Avanzado**

#### **Activar Debug Mode**
```javascript
// En consola (F12)
localStorage.setItem('debug_mode', 'true');
location.reload();
```

#### **Verificar Estado del Sistema**
```javascript
// En consola - verificar componentes
console.log('Sistemas disponibles:', {
  smartScanner: !!window.smartScanner,
  openCV: typeof cv !== 'undefined',
  tesseract: typeof Tesseract !== 'undefined',
  mediaDevices: !!navigator.mediaDevices
});
```

#### **Test Manual de Cámara**
```javascript
// Test básico en consola
async function testCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video: true});
    console.log('✅ Cámara OK');
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    console.log('❌ Error cámara:', err);
  }
}
testCamera();
```

### 📂 **Archivos Actualizados con Debugging**

Los siguientes archivos tienen **debugging mejorado**:

1. **`js/expenses.js`** ← Manejo de errores de cámara
2. **`js/smart-scanner.js`** ← Verificación de permisos
3. **`index.html`** ← Fallback OpenCV mejorado
4. **`CAMERA-TROUBLESHOOTING.md`** ← **NUEVO** - Esta guía

### 🚀 **Fallbacks Implementados**

#### **Cascada de Fallbacks**
1. **Scanner IA** (OpenCV + Tesseract) 
2. **↓ Si falla OpenCV** → Cámara + Tesseract
3. **↓ Si falla Tesseract** → Cámara + OCR simulado
4. **↓ Si falla cámara** → Error con instrucciones

#### **Detección Automática**
```javascript
// El sistema detecta automáticamente:
- Disponibilidad de OpenCV ✓
- Disponibilidad de Tesseract ✓  
- Permisos de cámara ✓
- Compatibilidad del navegador ✓
```

### 💡 **Tips de Uso**

#### **Para Mejor Rendimiento**
- ✅ Usar cámara trasera (mejor calidad)
- ✅ Buena iluminación
- ✅ Documento plano y visible
- ✅ Esperar a ver contorno verde

#### **Si el Scanner IA no funciona**
- El sistema cambia automáticamente a cámara básica
- Funciona igual pero sin detección automática
- OCR sigue funcionando con Tesseract

### 🎯 **Actualizar para Solucionar**

Sube estos **4 archivos** con debugging mejorado:

1. **`js/expenses.js`** ← Manejo robusto de errores
2. **`js/smart-scanner.js`** ← Verificación de permisos
3. **`index.html`** ← Callback OpenCV mejorado  
4. **`CAMERA-TROUBLESHOOTING.md`** ← **NUEVO** - Esta guía

¡**Ahora la cámara debería funcionar sin problemas**! 📸