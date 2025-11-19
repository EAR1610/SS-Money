// ticket_pago/ticket_pago.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

function generarTicketPago(response, redisClient, fecha, asesor, cliente, numeroCuota, montoPagado, saldoPendiente, saldoAnterior, fechaVencimiento, configId, plan) {
  return new Promise((resolve, reject) => {
    try {
      
      // * Helper: descargar imagen remota como Buffer (soporta https)
      function fetchImageBuffer(url) {
        return new Promise((resolve) => {
          if (!url || typeof url !== 'string') return resolve(null);
          try {
            const https = require('https');
            https.get(url, (res) => {
              const chunks = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                if (buffer && buffer.length > 0) return resolve(buffer);
                return resolve(null);
              });
            }).on('error', (e) => {
              console.warn('WARN: no se pudo descargar logo:', e && e.message);
              return resolve(null);
            }).setTimeout(5000, function() {
              this.destroy();
              return resolve(null);
            });
          } catch (e) {
            console.warn('WARN: excepción descargando logo:', e && e.message);
            return resolve(null);
          }
        });
      }

      // * Helper: obtener configuración desde Redis
      function getConfiguracion(configId) {
        return new Promise((resolve, reject) => {
          const configKey = `configuracion_${configId}`;
          redisClient.get(configKey, (err, data) => {
            if (err) {
              console.error('[DEBUG] Error obteniendo configuración:', err);
              reject(err);
            } else if (!data) {
              resolve(null);
            } else {
              try {
                const configData = JSON.parse(data);
                resolve(configData);
              } catch (parseError) {
                console.error('[DEBUG] Error al parsear configuración:', parseError);
                reject(parseError);
              }
            }
          });
        });
      }

      // * Helper: formatear fecha dd/mm/yyyy, HH:MM:SS a. m./p. m.
      function formatFechaTicket(fechaStr) {
        if (!fechaStr) return '';
        const s = String(fechaStr).trim();
        // Parse fecha: dd/mm/yyyy, HH:MM:SS a. m.
        const match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(a\.\s*m\.|p\.\s*m\.)/i);
        if (match) {
          const day = match[1].padStart(2, '0');
          const month = match[2].padStart(2, '0');
          const year = match[3];
          const hour = match[4].padStart(2, '0');
          const min = match[5];
          const sec = match[6];
          const period = match[7];
          return `${day}/${month}/${year}, ${hour}:${min}:${sec} ${period}`;
        }
        return fechaStr;
      }

      // * Helper: formatear fecha de vencimiento dd-mm-yyyy
      function formatFechaVencimiento(fechaStr) {
        if (!fechaStr) return '';
        const s = String(fechaStr).trim();
        // Si viene en formato yyyy-mm-dd, convertir a dd-mm-yyyy
        const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
          return `${match[3]}-${match[2]}-${match[1]}`;
        }
        return fechaStr;
      }

      // * Helper: formatear monto Q #,###.##
      function formatMonto(monto) {
        const raw = String(monto || '0').replace(/[^0-9.\-]/g, '');
        let n = parseFloat(raw);
        if (isNaN(n)) n = 0;
        const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `Q ${formatted}`;
      }

      // * Obtener configuración y generar PDF
      (async function() {
        try {
          // Obtener datos de configuración
          const configData = await getConfiguracion(configId).catch(err => {
            console.error('Error obteniendo configuración:', err);
            return null;
          });

          let nombreEmpresa = 'NOMBRE EMPRESA';
          let logoUrl = null;
          let logoBuffer = null;

          if (configData && Array.isArray(configData)) {
            nombreEmpresa = configData[13] || 'NOMBRE EMPRESA';
            logoUrl = configData[21] || null;
          }

          // Intentar descargar logo si existe
          if (logoUrl) {
            try {
              logoBuffer = await fetchImageBuffer(logoUrl);
            } catch (e) {
              console.warn('WARN: fallo al descargar logo:', e && e.message);
              logoBuffer = null;
            }
          }

      // * Calcular altura dinámica basada en nombres largos (asesor y cliente)
      // Crear doc temporal para medir altura del texto
      const tempDoc = new PDFDocument({ size: [300, 600] });
      tempDoc.fontSize(10).font('Helvetica');
      
      const asesorText = asesor || 'No disponible';
      const asesorHeight = tempDoc.heightOfString(asesorText, { width: 100, align: 'right' });
      
      const clienteText = cliente || 'No disponible';
      const clienteHeight = tempDoc.heightOfString(clienteText, { width: 100, align: 'right' });
      
      // Altura base del ticket + espacio extra para textos largos
      const baseHeight = 470;
      const extraAsesorHeight = Math.max(0, asesorHeight - 25); // 25 es el lineHeight normal
      const extraClienteHeight = Math.max(0, clienteHeight - 25);
      const ticketHeight = baseHeight + extraAsesorHeight + extraClienteHeight;

      // * Crear el PDF con tamaño de ticket (ancho 300px, altura ajustable)
      const doc = new PDFDocument({ 
        size: [300, ticketHeight],
        margins: { top: 0, bottom: 20, left: 20, right: 20 }
      });

      const filePath = `ticket_pago_${Date.now()}.pdf`;
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // * Encabezado oscuro con nombre de empresa
      doc.fillColor('#2C3E50')
         .rect(0, 0, 300, 110)
         .fill();

      // Logo (si existe)
      if (logoBuffer) {
        try {
          doc.image(logoBuffer, 110, 12, { width: 80 });
        } catch (e) {
          console.warn('Error renderizando logo:', e);
        }
      }

      // Texto del encabezado
      doc.fillColor('#FFFFFF')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(nombreEmpresa, 20, logoBuffer ? 75 : 15, { align: 'center', width: 260 });
      
      doc.fontSize(12)
         .text('TICKET DE PAGO', 20, logoBuffer ? 95 : 40, { align: 'center', width: 260 });

      // Resetear color y posición
      doc.fillColor('#000000');
      doc.moveDown(3);

      // * Información del ticket con layout de dos columnas
      let currentY = logoBuffer ? 130 : 105;
      const labelX = 24;
      const valueX = 180;
      const lineHeight = 25;

      doc.fontSize(10).font('Helvetica-Bold');

      // Fecha
      doc.text('Fecha:', labelX, currentY);
      doc.font('Helvetica').fillColor('#000000').text(formatFechaTicket(fecha), valueX - 20, currentY, { width: 120, align: 'right' });
      currentY += lineHeight;

      // Asesor (con altura dinámica para nombres largos)
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('Asesor:', labelX, currentY);
      doc.font('Helvetica').fillColor('#000000').text(asesorText, valueX, currentY, { width: 100, align: 'right' });
      
      // Ajustar currentY según la altura real del texto (mínimo lineHeight)
      const asesorSpacing = Math.max(asesorHeight, lineHeight);
      currentY += asesorSpacing ;

      // Cliente (con altura dinámica para nombres largos)
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('Cliente:', labelX, currentY);
      
      // Calcular altura del texto del cliente usando las variables ya definidas
      doc.font('Helvetica').fillColor('#000000').text(clienteText, valueX, currentY, { width: 100, align: 'right' });
      
      // Ajustar currentY según la altura real del texto (mínimo lineHeight)
      const clienteSpacing = Math.max(clienteHeight, lineHeight);
      currentY += clienteSpacing + 5;

      // No. cuota
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('No. cuota:', labelX, currentY);
      doc.font('Helvetica').fillColor('#000000').text(numeroCuota || '1', valueX, currentY, { width: 100, align: 'right' });
      currentY += lineHeight;

      // F. Vencimiento
      doc.fillColor('#000000').font('Helvetica-Bold');
      doc.text('F. Vencimiento:', labelX, currentY);
      doc.font('Helvetica').fillColor('#000000').text(formatFechaVencimiento(fechaVencimiento), valueX, currentY, { width: 100, align: 'right' });
      currentY += lineHeight;

      // * Línea divisoria
      doc.moveTo(20, currentY).lineTo(280, currentY).strokeColor('#d9d7d7').lineWidth(1).stroke();
      currentY += 15;

      // * Sección de montos con fondo celeste y bordes redondeados
      doc.fillColor('#d5ebfb').roundedRect(20, currentY, 260, 80, 10).fill();

      currentY += 10;

      if (plan == 8){
          // Saldo anterior
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
          doc.text('Valor del contrato:', 30, currentY);
          doc.font('Helvetica').text(formatMonto(saldoPendiente), valueX, currentY, { width: 90, align: 'right' });          
          currentY += lineHeight;
    
          // Monto a pagar (en rojo)
          doc.fillColor('#000000').font('Helvetica-Bold');
          doc.text('Monto a pagar:', 30, currentY);
          doc.font('Helvetica').fillColor('#000000').text(formatMonto(montoPagado), valueX, currentY, { width: 90, align: 'right' });
          currentY += lineHeight;
    
          // Saldo pendiente
          doc.fillColor('#000000').font('Helvetica-Bold');
          doc.text('Total a pagar:', 30, currentY);
          doc.font('Helvetica').text(formatMonto(saldoAnterior), valueX, currentY, { width: 90, align: 'right' });
          currentY += lineHeight + 15;
    } else {
          // Saldo anterior
          doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
          doc.text('Saldo anterior:', 30, currentY);
          doc.font('Helvetica').text(formatMonto(saldoAnterior), valueX, currentY, { width: 90, align: 'right' });
          currentY += lineHeight;
    
          // Monto a pagar (en rojo)
          doc.fillColor('#000000').font('Helvetica-Bold');
          doc.text('Monto a pagar:', 30, currentY);
          doc.font('Helvetica').fillColor('#000000').text(formatMonto(montoPagado), valueX, currentY, { width: 90, align: 'right' });
          currentY += lineHeight;
    
          // Saldo pendiente
          doc.fillColor('#000000').font('Helvetica-Bold');
          doc.text('Saldo pendiente:', 30, currentY);
          doc.font('Helvetica').text(formatMonto(saldoPendiente), valueX, currentY, { width: 90, align: 'right' });
          currentY += lineHeight + 15;
      }


      // * Línea divisoria punteada
      const dashLength = 3;
      const gapLength = 2;
      let x = 20;
      doc.strokeColor('#c0bdbd');
      while (x < 280) {
        doc.moveTo(x, currentY).lineTo(Math.min(x + dashLength, 280), currentY).stroke();
        x += dashLength + gapLength;
      }
      currentY += 15;

      // * Mensaje de agradecimiento
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#000000')
        .text('¡Gracias por Su Pago!', 20, currentY, { align: 'center', width: 260 });

      doc.end();

      // * Enviar PDF cuando termine de escribirse
      stream.on('finish', function () {
        response.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="TICKET_PAGO_${numeroCuota}_${Date.now()}.pdf"`,
        });

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(response);

        fileStream.on('end', function () {
          try {
            fs.unlinkSync(filePath);
          } catch (e) {
            console.error('Error eliminando archivo temporal:', e);
          }
          return resolve();
        });

        fileStream.on('error', function (e) {
          console.error('Error leyendo archivo PDF:', e);
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Error enviando el PDF' }));
          return reject(e);
        });
      });

      stream.on('error', function (e) {
        console.error('Error escribiendo archivo PDF:', e);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Error generando PDF' }));
        return reject(e);
      });

        } catch (asyncError) {
          console.error('Error en proceso asíncrono:', asyncError);
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Error procesando datos' }));
          return reject(asyncError);
        }
      })();

    } catch (ex) {
      console.error('Excepción en generarTicketPago:', ex);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Error interno' }));
      return reject(ex);
    }
  });
}

module.exports = { generarTicketPago };
