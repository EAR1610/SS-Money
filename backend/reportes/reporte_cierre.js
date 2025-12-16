// reportes/reporte_cierre.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const https = require('https');

function generarReporteCierre(response, redisClient, token, idAsesor, idConfiguracion, fecha) {
  return new Promise((resolve, reject) => {
    try {
      // * Helper: obtener 'ahora' en zona UTC-6 (retorna Date)
      function getUtcMinus6Now() {
        return new Date(Date.now() - (6 * 60 * 60 * 1000));
      }

      // ? Helper: formatear fecha/hora corta dd/mm/yyyy HH:MM
      function formatFechaHora(d) {
        if (!d || isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }

      // ? Helper: formatear fecha para mostrar (dd/mm/yyyy)
      function formatFecha(fechaStr) {
        if (!fechaStr) return '';
        const s = String(fechaStr).trim();
        const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
        if (m) {
          const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
          if (isNaN(d)) return '';
          const pad = (n) => String(n).padStart(2, '0');
          return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
        }
        return '';
      }

      // ? Helper: descargar imagen remota como Buffer (soporta https)
      function fetchImageBuffer(url) {
        return new Promise((resolve) => {
          if (!url || typeof url !== 'string') return resolve(null);
          try {
            https.get(url, (res) => {
              if (res.statusCode !== 200) {
                console.warn('WARN: código HTTP', res.statusCode, 'al descargar logo');
                return resolve(null);
              }
              const chunks = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => resolve(Buffer.concat(chunks)));
            }).on('error', (e) => {
              console.warn('WARN: error descargando logo:', e && e.message);
              return resolve(null);
            }).setTimeout(5000, function() {
              this.abort();
              return resolve(null);
            });
          } catch (e) {
            console.warn('WARN: excepción descargando logo:', e && e.message);
            return resolve(null);
          }
        });
      }

      // ? Función para formatear monto
      function formatMonto(monto) {
        const raw = String(monto || '0').replace(/[^0-9.\-]/g, '');
        let n = parseFloat(raw);
        if (isNaN(n)) n = 0;
        const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return `Q ${formatted}`;
      }

      // ? Función para parsear monto con punto como separador de miles
      function parseMonto(montoStr) {
        if (!montoStr) return 0;
        const str = String(montoStr).trim();
        
        // Contar cuántos dígitos hay después del último punto
        const lastDotIndex = str.lastIndexOf('.');
        if (lastDotIndex !== -1) {
          const afterDot = str.substring(lastDotIndex + 1);
          // Si hay exactamente 2 dígitos después del punto, es decimal
          if (afterDot.length === 2) {
            // Es decimal, reemplazar punto por punto decimal
            const cleaned = str.replace(/[^0-9.\-]/g, '');
            return parseFloat(cleaned) || 0;
          } else {
            // Es separador de miles, quitar todos los puntos
            const cleaned = str.replace(/\./g, '').replace(/[^0-9\-]/g, '');
            return parseFloat(cleaned) || 0;
          }
        }
        
        // No hay punto, parsear directamente
        const cleaned = str.replace(/[^0-9\-]/g, '');
        return parseFloat(cleaned) || 0;
      }

      // ? Funciones para obtener datos
      function getAsesor(asesorId) {
        return new Promise((resolve, reject) => {
          const asesorPattern = `listado_*_asesor_${asesorId}`;
          redisClient.keys(asesorPattern, (err, keys) => {
            if (err) {
              return reject(err);
            } else if (!keys || keys.length === 0) {
              return resolve(null);
            } else {
              redisClient.get(keys[0], (err2, data) => {
                if (err2) {
                  return reject(err2);
                } else if (!data) {
                  return resolve(null);
                } else {
                  try {
                    return resolve(JSON.parse(data));
                  } catch (e) {
                    return resolve(null);
                  }
                }
              });
            }
          });
        });
      }

      function getConfiguracion(configId) {
        return new Promise((resolve, reject) => {
          const configKey = `configuracion_${configId}`;
          redisClient.get(configKey, (err, data) => {
            if (err) {
              return reject(err);
            } else if (!data) {
              return resolve(null);
            } else {
              try {
                return resolve(JSON.parse(data));
              } catch (e) {
                return resolve(null);
              }
            }
          });
        });
      }

      function getSumatoriaDiaria(token, idAsesor, fecha) {
        return new Promise((resolve, reject) => {          
          const sumatoria = require('../modelos/sumatoria_diario_supervisor.js');
          sumatoria([token, idAsesor, fecha], null, redisClient)
            .then(result => {
              resolve(result);
            })
            .catch(err => {
              reject(err);
            });
        });
      }

      function getCobros(token, idAsesor, fecha) {
        return new Promise((resolve, reject) => {
          const cobros = require('../modelos/buscar_cobros_fecha.js');
          cobros([token, idAsesor, fecha], null, redisClient)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      }

      function getGastos(token, idAsesor, fecha) {
        return new Promise((resolve, reject) => {
          const gastos = require('../modelos/buscar_gastos_fecha.js');
          gastos([token, idAsesor, fecha], null, redisClient)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      }

      function getRenovaciones(token, idAsesor, fecha) {
        return new Promise((resolve, reject) => {
          const renovaciones = require('../modelos/buscar_renovaciones_fecha.js');
          renovaciones([token, idAsesor, fecha], null, redisClient)
            .then(result => resolve(result))
            .catch(err => reject(err));
        });
      }

      // ? Obtener todos los datos necesarios
      Promise.all([
        getAsesor(idAsesor).catch(err => {
          console.error('Error obteniendo datos del asesor:', err);
          return null;
        }),
        getConfiguracion(idConfiguracion).catch(err => {
          console.error('Error obteniendo datos de configuración:', err);
          return null;
        }),
        getSumatoriaDiaria(token, idAsesor, fecha).catch(err => {
          console.error('Error obteniendo sumatoria diaria:', err);
          return [false, 0, "0", fecha, false, 0, 0];
        }),
        getCobros(token, idAsesor, fecha).catch(err => {
          console.error('Error obteniendo cobros:', err);
          return [false, []];
        }),
        getGastos(token, idAsesor, fecha).catch(err => {
          console.error('Error obteniendo gastos:', err);
          return [false, "[]"];
        }),
        getRenovaciones(token, idAsesor, fecha).catch(err => {
          console.error('Error obteniendo renovaciones:', err);
          return [false, "[]"];
        })
      ]).then(async ([asesorData, configData, sumatoriaData, cobrosData, gastosData, renovacionesData]) => {
        
        // * Crear el PDF
        const doc = new PDFDocument({ margins: {top: 40, bottom: 45, left: 40, right: 40}, bufferPages: true });
        
        const filePath = `reporte_cierre_${idAsesor}_${fecha}.pdf`;
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // ? INFORMACIÓN DEL NEGOCIO (desde configuración)
        let nombreNegocio = 'NOMBRE DEL NEGOCIO';
        let direccionNegocio = 'DIRECCIÓN DEL NEGOCIO';
        let nitNegocio = 'NIT DEL NEGOCIO';
        let logoUrl = null;
        let logoBuffer = null;

        if (configData && Array.isArray(configData) && configData.length >= 16) {
          nombreNegocio = configData[13] || 'NOMBRE DEL NEGOCIO';
          direccionNegocio = configData[14] || 'DIRECCIÓN DEL NEGOCIO';
          nitNegocio = configData[15] || 'NIT DEL NEGOCIO';
          try {
            logoUrl = (configData[21] && configData[21] !== 'false') ? configData[21] : null;
          } catch (e) {
            logoUrl = null;
          }
        }

        // ? Intentar descargar el logo (si existe)
        if (logoUrl) {
          try {
            logoBuffer = await fetchImageBuffer(logoUrl);
          } catch (e) {
            console.warn('WARN: no se pudo descargar logo:', e && e.message);
            logoBuffer = null;
          }
        }
        
        if (logoBuffer) {
          const logoWidth = 70;
          doc.image(logoBuffer, 40, 15, { width: logoWidth });
        }

        // * Escribir los textos del encabezado (centrados)
        doc.fontSize(13).font('Helvetica-Bold').text(nombreNegocio, { align: 'center' });
        doc.fontSize(11).font('Helvetica').text(direccionNegocio, { align: 'center' });
        doc.text(`NIT: ${nitNegocio}`, { align: 'center' });
        doc.moveDown(0.5);
        
        // * Línea separadora
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#9f9f9f').lineWidth(1).stroke();
        doc.moveDown(1);

        // * Título del reporte
        doc.fontSize(14).font('Helvetica-Bold').text('REPORTE DE CIERRE', { align: 'center' });
        doc.moveDown(1);

        // * Información del asesor y periodo en dos columnas
        let nombreAsesor = 'No disponible';
        let idAsesorDisplay = idAsesor || 'N/A';
        if (asesorData) {
          nombreAsesor = `${asesorData[7] || ''} ${asesorData[8] || ''} ${asesorData[9] || ''} ${asesorData[10] || ''}`.trim();
        }

        const infoY = doc.y;
        const pageWidth = doc.page.width - 80;
        const colWidth = pageWidth / 2;

        // Columna izquierda - Información Asesor
        doc.fontSize(10).font('Helvetica-Bold').text('Información Asesor', 40, infoY);
        doc.font('Helvetica').fontSize(9);
        doc.text(`Nombre: ${nombreAsesor}`, 40, infoY + 15);
        doc.text(`ID: ${idAsesorDisplay}`, 40, infoY + 28);

        // Columna derecha - Periodo
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Periodo', 40 + colWidth, infoY, { align: 'right', width: colWidth });
        doc.font('Helvetica').fontSize(9);
        
        // Formatear fecha completa con día de la semana
        function formatFechaCompleta(fechaStr) {
          if (!fechaStr) return '';
          const s = String(fechaStr).trim();
          const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
          if (m) {
            const d = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
            if (isNaN(d)) return '';
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return `Fecha: ${diasSemana[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]} ${d.getFullYear()}`;
          }
          return '';
        }
        
        doc.text(formatFechaCompleta(fecha), 40 + colWidth, infoY + 15, { align: 'right', width: colWidth });

        doc.y = infoY + 50;
        doc.x = 40;

        // * Procesar datos de sumatoria
        let baseDiaria = 0;
        let totalRecaudado = 0;
        let totalGastos = 0;
        let totalRenovaciones = 0;
        let totalSistema = 0;
        let totalAsesor = 0;
        let diferencia = 0;

        if (sumatoriaData && sumatoriaData[0]) {
          totalRecaudado = parseFloat(sumatoriaData[1]) || 0;
          baseDiaria = parseFloat(sumatoriaData[2]) || 0;
          
          // Calcular totales de gastos y renovaciones desde los datos reales
          totalGastos = 0;
          totalRenovaciones = 0;
          
          // Calcular total de gastos
          try {
            if (gastosData && gastosData[0] && gastosData[1]) {
              const gastosArray = JSON.parse(gastosData[1]);
              if (Array.isArray(gastosArray)) {
                totalGastos = gastosArray.reduce((sum, gasto) => {
                  const monto = parseMonto(gasto[2]);
                  return sum + monto;
                }, 0);
              }
            }
          } catch (e) {
            console.error('Error calculando total gastos:', e);
          }
          
          // Calcular total de renovaciones
          try {
            if (renovacionesData && renovacionesData[0] && renovacionesData[1]) {
              const renovacionesArray = JSON.parse(renovacionesData[1]);
              if (Array.isArray(renovacionesArray)) {
                totalRenovaciones = renovacionesArray.reduce((sum, renovacion) => {
                  const monto = parseMonto(renovacion[2]);
                  return sum + monto;
                }, 0);
              }
            }
          } catch (e) {
            console.error('Error calculando total renovaciones:', e);
          }
          
          // Cálculos
          // totalSistema = baseDiaria + totalRecaudado - (totalGastos + totalRenovaciones);
          totalSistema = totalRecaudado - (totalGastos + totalRenovaciones);
          totalAsesor = sumatoriaData[5] || 0;
          diferencia = sumatoriaData[6] || 0;          
        }

        // * Crear tabla con resumen financiero (2 filas x 4 columnas)
        doc.fontSize(10).font('Helvetica-Bold'); 
        
        const tableY = doc.y;
        const tableWidth = doc.page.width - 80;
        const cellWidth = tableWidth / 4;
        const cellPadding = 5;
        
        // Función auxiliar para calcular altura de texto en una celda
        function calculateTextHeight(text, width, fontSize, font) {
          doc.fontSize(fontSize).font(font);
          const height = doc.heightOfString(text, { width: width - (cellPadding * 2) });
          return height + (cellPadding * 2);
        }
        
        // Textos de la primera fila
        const row1Texts = [
          'Base diaria: ' + formatMonto(baseDiaria),
          'Total recaudado: ' + formatMonto(totalRecaudado),
          'Total gastos: ' + formatMonto(totalGastos),
          'Total renovaciones: ' + formatMonto(totalRenovaciones)
        ];
        
        // Calcular la altura máxima de la primera fila
        let row1Height = 0;
        row1Texts.forEach(text => {
          const height = calculateTextHeight(text, cellWidth, 10, 'Helvetica-Bold');
          if (height > row1Height) row1Height = height;
        });
        
        // Primera fila con fondo gris
        doc.rect(40, tableY, tableWidth, row1Height).fillAndStroke('#b0cbfd');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
        
        // Centrar verticalmente el texto en cada celda de la primera fila
        row1Texts.forEach((text, index) => {
          const textHeight = doc.heightOfString(text, { width: cellWidth - (cellPadding * 2) });
          const yOffset = (row1Height - textHeight) / 2;
          doc.text(text, 40 + (cellWidth * index) + cellPadding, tableY + yOffset, { 
            width: cellWidth - (cellPadding * 2), 
            align: 'left' 
          });
        });

        // Textos de la segunda fila
        const row2Texts = [
          'Total sistema: ' + formatMonto(totalSistema),
          'Total asesor: ' + formatMonto(totalAsesor),
          'Diferencia: ' + formatMonto(diferencia),
          '' // celda vacía
        ];
        
        // Calcular la altura máxima de la segunda fila
        let row2Height = 0;
        row2Texts.forEach(text => {
          if (text) {
            const height = calculateTextHeight(text, cellWidth, 10, 'Helvetica-Bold');
            if (height > row2Height) row2Height = height;
          }
        });
        
        // Segunda fila con fondo gris
        const row2Y = tableY + row1Height;
        doc.rect(40, row2Y, tableWidth, row2Height).fillAndStroke('#b0cbfd');
        doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10);
        
        // Centrar verticalmente el texto en cada celda de la segunda fila
        row2Texts.forEach((text, index) => {
          if (text) {
            const textHeight = doc.heightOfString(text, { width: cellWidth - (cellPadding * 2) });
            const yOffset = (row2Height - textHeight) / 2;
            doc.text(text, 40 + (cellWidth * index) + cellPadding, row2Y + yOffset, { 
              width: cellWidth - (cellPadding * 2), 
              align: 'left' 
            });
          }
        });

        doc.y = row2Y + row2Height + 10;
        doc.x = 40;

        // * Tabla de cobros
        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text('Cobros Registrados', { align: 'center' });
        doc.moveDown(0.5);

        let listaCobros = [];
        if (cobrosData && cobrosData[0] && Array.isArray(cobrosData[1])) {
          listaCobros = cobrosData[1];
        }

        if (listaCobros.length === 0) {
          doc.fontSize(9).font('Helvetica').text('No hay cobros registrados para este periodo', { align: 'center' });
        } else {
          const headersCobros = ['No.', 'DPI', 'Nombre Cliente', 'Dirección', 'Monto', 'Hora'];
          const dataRowsCobros = listaCobros.map((cobro, index) => [
            (index + 1).toString(),
            cobro.dpi || '',
            cobro.nombre || '',
            cobro.direccion || '',
            formatMonto(cobro.monto),
            cobro.hora || ''
          ]);

          doc.fontSize(10).font('Helvetica');
          doc.table({
            columnStyles: (i) => {
              if (i === 0) return { width: 25, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 1) return { width: 100, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 2) return { width: 150, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 3) return { width: 100, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 4) return { width: 100, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 5) return { width: "*", align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
            },
            rowStyles(i){
                if (i === 0) return { textStroke: 0.5, backgroundColor: '#b0cbfd' }; // Encabezados en negrita
                return {};
            },
            data: [headersCobros, ...dataRowsCobros],
          });

          const totalCobros = listaCobros.reduce((sum, c) => sum + (parseFloat(c.monto) || 0), 0);
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(9).text(`Total Cobros: ${formatMonto(totalCobros)}`, { align: 'right' });
        }

        // * Tabla de gastos
        doc.moveDown(1.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Gastos', { align: 'center' });
        doc.moveDown(0.5);

        let listaGastos = [];
        try {
          if (gastosData && gastosData[0] && gastosData[1]) {
            const gastosArray = JSON.parse(gastosData[1]);
            if (Array.isArray(gastosArray)) {
              listaGastos = gastosArray;
            }
          }
        } catch (e) {
          console.error('Error parseando gastos:', e);
        }

        if (listaGastos.length === 0) {
          doc.fontSize(9).font('Helvetica').text('No hay gastos registrados para este periodo', { align: 'center' });
        } else {
          const headersGastos = ['No.', 'Motivo', 'Monto'];
          const dataRowsGastos = listaGastos.map((gasto, index) => [
            (index + 1).toString(),
            gasto[1] || '',
            formatMonto(parseMonto(gasto[2]))
          ]);

          doc.fontSize(10).font('Helvetica');
          doc.table({
            columnStyles: (i) => {
              if (i === 0) return { width: 25, border: [1, 0, 1, 0], borderColor: 'black', align: 'center' };
              if (i === 1) return { width: 380, border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 2) return { width: "*", border: [1, 0, 1, 0], align: 'right' };
            },
            rowStyles(i){
                if (i === 0) return { textStroke: 0.5, backgroundColor: '#b0cbfd' }; // Encabezados en negrita
                return {};
            },
            headerStyles: { bold: true, fillColor: '#cccccc' },
            data: [headersGastos, ...dataRowsGastos],
          });

          const totalGastosTabla = listaGastos.reduce((sum, g) => sum + parseMonto(g[2]), 0);
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(9).text(`Total: ${formatMonto(totalGastosTabla)}`, { align: 'right' });
        }

        // * Tabla de renovaciones
        doc.moveDown(1.5);
        
        // Verificar si hay espacio suficiente en la página actual
        const espacioRestante = doc.page.height - doc.y - doc.page.margins.bottom;
        if (espacioRestante < 150) {
          doc.addPage();
        }
        
        doc.fontSize(11).font('Helvetica-Bold').text('Renovaciones', { align: 'center' });
        doc.moveDown(0.5);

        let listaRenovaciones = [];
        try {
          if (renovacionesData && renovacionesData[0] && renovacionesData[1]) {
            const renovacionesArray = JSON.parse(renovacionesData[1]);
            if (Array.isArray(renovacionesArray)) {
              listaRenovaciones = renovacionesArray;
            }
          }
        } catch (e) {
          console.error('Error parseando renovaciones:', e);
        }

        if (listaRenovaciones.length === 0) {
          doc.fontSize(9).font('Helvetica').text('No hay renovaciones registradas para este periodo', { align: 'center' });
        } else {
          const headersRenovaciones = ['No.', 'Motivo', 'Monto'];
          const dataRowsRenovaciones = listaRenovaciones.map((renovacion, index) => [
            (index + 1).toString(),
            renovacion[1] || '',
            formatMonto(parseMonto(renovacion[2]))
          ]);

          doc.fontSize(10).font('Helvetica');
          doc.table({
            columnStyles: (i) => {
              if (i === 0) return { width: 25, border: [1, 0, 1, 0], borderColor: 'black', align: 'center' };
              if (i === 1) return { width: 380, border: [1, 0, 1, 0], borderColor: 'black' };
              if (i === 2) return { width: "*", border: [1, 0, 1, 0], align: 'right', borderColor: 'black' };
            },
            rowStyles(i){
                if (i === 0) return { textStroke: 0.5, backgroundColor: '#b0cbfd' }; // Encabezados en negrita
                return {};
            },
            headerStyles: { bold: true, fillColor: '#cccccc' },
            data: [headersRenovaciones, ...dataRowsRenovaciones],
          });

          const totalRenovacionesTabla = listaRenovaciones.reduce((sum, r) => sum + parseMonto(r[2]), 0);
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').fontSize(9).text(`Total: ${formatMonto(totalRenovacionesTabla)}`, { align: 'right' });
        }

        // * Footer con fecha de generación y número de página
        const fechaGeneracionObj = getUtcMinus6Now();
        const fechaGeneracionStr = formatFechaHora(fechaGeneracionObj);

        const range = doc.bufferedPageRange(); 
        const totalPages = range.count;
        
        for (let i = 0; i < totalPages; i++) {
          doc.switchToPage(i);

          const pageHeight = doc.page.height;
          const pageWidth = doc.page.width;
          const bottomPosition = pageHeight - 45;

          const originalBottomMargin = doc.page.margins.bottom;
          doc.page.margins.bottom = 0;
          
          doc.fontSize(9).text(
            `Página ${i + 1} de ${totalPages}`,
            30,
            bottomPosition,
            { align: 'center', width: pageWidth - 60, lineBreak: false }
          );

          doc.text(
            `Generado: ${fechaGeneracionStr}`,
            30,
            bottomPosition,
            { align: 'left', width: pageWidth - 60, lineBreak: false }
          );

          doc.page.margins.bottom = originalBottomMargin;
        }

        doc.end();

        // Enviar PDF cuando termine de escribirse
        stream.on('finish', function () {
          response.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="REPORTE_CIERRE_${nombreAsesor.replace(/[^a-zA-Z0-9]/g, '_')}_${fecha}.pdf"`,
          });

          const fileStream = fs.createReadStream(filePath);
          fileStream.pipe(response);

          fileStream.on('end', function () {
            fs.unlink(filePath, function (err) {
              if (err) console.error('Error eliminando archivo temporal:', err);
            });
            resolve(true);
          });

          fileStream.on('error', function (e) {
            console.error('Error leyendo archivo PDF:', e);
            response.writeHead(500, { 'Content-Type': 'application/json' });
            response.end(JSON.stringify({ error: 'Error enviando PDF' }));
            reject(e);
          });
        });

        stream.on('error', function (e) {
          console.error('Error escribiendo archivo PDF:', e);
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Error generando PDF' }));
          reject(e);
        });

      }).catch(err => {
        console.error('Error obteniendo datos:', err);
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({ error: 'Error procesando datos', details: err.message }));
        reject(err);
      });

    } catch (ex) {
      console.error('Excepción en generarReporteCierre:', ex);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Error interno' }));
      reject(ex);
    }
  });
}

module.exports = { generarReporteCierre };
