/**
 * Sistema de OCR Simulado para Detección de Montos
 * Por simplicidad, simula la detección de montos en recibos
 */

class OCRManager {
    constructor() {
        this.isProcessing = false;
        this.patterns = {
            // Patrones para detectar montos en pesos mexicanos
            currency: [
                /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
                /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*pesos?/gi,
                /total:?\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
                /subtotal:?\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
                /importe:?\s*\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
                /(\d+\.\d{2})/g
            ],
            // Palabras clave que indican montos
            keywords: [
                'total', 'subtotal', 'importe', 'suma', 'precio',
                'costo', 'pago', 'cantidad', 'monto', 'tarifa'
            ]
        };
        
        debug.log('OCRManager initialized');
    }

    // Simular procesamiento de OCR en imagen
    async processImage(imageData) {
        try {
            debug.log('Processing image with OCR simulation');
            
            if (this.isProcessing) {
                throw new Error('OCR ya está procesando una imagen');
            }

            this.isProcessing = true;

            // Simular tiempo de procesamiento
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

            // Simular texto extraído de la imagen
            const simulatedText = this.generateSimulatedReceiptText();
            
            debug.log('Simulated OCR text', simulatedText);

            // Detectar montos en el texto
            const detectedAmounts = this.detectAmounts(simulatedText);
            
            // Calcular confianza simulada
            const confidence = this.calculateConfidence(detectedAmounts, simulatedText);

            const result = {
                text: simulatedText,
                amounts: detectedAmounts,
                suggestedAmount: detectedAmounts.length > 0 ? detectedAmounts[0] : null,
                confidence: confidence,
                timestamp: Date.now(),
                processingTime: 2000 + Math.random() * 1000
            };

            debug.log('OCR processing complete', result);
            
            this.isProcessing = false;
            return result;

        } catch (error) {
            this.isProcessing = false;
            debug.error('OCR processing failed', error);
            throw error;
        }
    }

    // Generar texto simulado de recibo
    generateSimulatedReceiptText() {
        const receiptTemplates = [
            `FARMACIA SAN PABLO
            Av. Revolución 1234
            Col. Centro, CDMX
            RFC: FSP123456789
            
            TICKET DE VENTA
            Fecha: ${new Date().toLocaleDateString('es-MX')}
            
            1 Acetaminofen 500mg    $45.50
            2 Alcohol 250ml         $38.00
            1 Curitas grandes       $25.30
            
            Subtotal:              $108.80
            IVA (16%):             $17.41
            TOTAL:                 $126.21
            
            GRACIAS POR SU COMPRA`,
            
            `OXXO #2847
            Insurgentes Sur 567
            
            ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}
            
            Coca Cola 600ml         $18.50
            Sabritas 45g           $15.00
            Chicles Trident        $12.00
            Recarga Telcel $100    $100.00
            
            Subtotal:              $145.50
            TOTAL:                 $145.50
            
            Efectivo:              $200.00
            Su cambio:             $54.50`,
            
            `RESTAURANTE LA CASA
            Polanco, CDMX
            
            Mesa: 15
            Mesero: Juan
            Fecha: ${new Date().toLocaleDateString('es-MX')}
            
            2x Tacos Pastor        $80.00
            1x Refresco           $25.00
            1x Agua               $15.00
            1x Café               $22.00
            
            Subtotal:             $142.00
            Propina sugerida:     $21.30
            TOTAL:                $163.30`,
            
            `GASOLINERA PEMEX
            Estación #4521
            
            Magna Premium
            Litros: 25.40
            Precio/L: $22.15
            
            IMPORTE:              $562.61
            
            Forma de pago: EFECTIVO
            ${new Date().toLocaleTimeString('es-MX')}`,
            
            `WALMART SUPERCENTER
            Sucursal: Santa Fe
            
            Leche Lala 1L          $28.50
            Pan Bimbo Grande       $32.00  
            Huevos San Juan 18pz   $45.80
            Manzanas Red 1kg       $38.90
            Detergente Ariel 3kg   $89.50
            
            Subtotal:             $234.70
            Descuentos:           -$15.00
            TOTAL A PAGAR:        $219.70`
        ];

        const randomTemplate = receiptTemplates[Math.floor(Math.random() * receiptTemplates.length)];
        return randomTemplate;
    }

    // Detectar montos en texto
    detectAmounts(text) {
        const amounts = [];
        const seen = new Set(); // Para evitar duplicados

        // Buscar con cada patrón
        this.patterns.currency.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const amountStr = match[1] || match[0];
                const cleanAmount = this.cleanAmountString(amountStr);
                const numericAmount = this.parseAmount(cleanAmount);
                
                if (numericAmount > 0 && !seen.has(numericAmount)) {
                    amounts.push({
                        value: numericAmount,
                        text: match[0],
                        position: match.index,
                        pattern: pattern.source
                    });
                    seen.add(numericAmount);
                }
            }
        });

        // Ordenar por valor descendente (el más alto suele ser el total)
        amounts.sort((a, b) => b.value - a.value);

        debug.log('Detected amounts', amounts);
        return amounts.map(a => a.value);
    }

    // Limpiar string de monto
    cleanAmountString(amountStr) {
        return amountStr
            .replace(/[^\d.,]/g, '') // Solo números, puntos y comas
            .replace(/,(?=\d{3})/g, '') // Remover comas de miles
            .trim();
    }

    // Parsear monto a número
    parseAmount(amountStr) {
        const num = parseFloat(amountStr);
        return isNaN(num) ? 0 : num;
    }

    // Calcular confianza del OCR
    calculateConfidence(amounts, text) {
        let confidence = 0.3; // Base confidence
        
        // Aumentar confianza si se detectaron montos
        if (amounts.length > 0) {
            confidence += 0.3;
        }
        
        // Aumentar confianza si hay palabras clave
        const keywordCount = this.patterns.keywords.filter(keyword => 
            text.toLowerCase().includes(keyword)
        ).length;
        
        confidence += Math.min(0.4, keywordCount * 0.1);
        
        // Agregar algo de variabilidad
        confidence += (Math.random() - 0.5) * 0.1;
        
        return Math.min(1.0, Math.max(0.1, confidence));
    }

    // Procesar imagen real (placeholder para Tesseract.js u otro OCR)
    async processImageWithTesseract(imageBlob) {
        // Este método sería para integrar Tesseract.js real
        // Por ahora solo simula el procesamiento
        
        debug.log('Real OCR processing would happen here');
        
        // Simular procesamiento más largo para OCR real
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        return this.processImage(null); // Usar simulación por ahora
    }

    // Verificar si OCR está disponible
    isAvailable() {
        // En una implementación real, verificaría si Tesseract.js está cargado
        return true;
    }

    // Obtener estado del procesamiento
    isProcessingImage() {
        return this.isProcessing;
    }

    // Cancelar procesamiento actual
    cancelProcessing() {
        if (this.isProcessing) {
            this.isProcessing = false;
            debug.log('OCR processing cancelled');
        }
    }
}

// Crear instancia global
window.ocrManager = new OCRManager();