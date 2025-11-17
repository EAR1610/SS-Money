// reportes/estado_cuenta_contrato.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const https = require('https');

function generarReportePagos(response, redisClient, asesor, contrato, dpi, configuracion, plan) {
  return new Promise((resolve, reject) => {
    try {
      const pattern = `monto_${asesor}_*_*_*_*_*_${contrato}_${dpi}`;

       // * Helper: obtener 'ahora' en zona UTC-6 (retorna Date)
      function getUtcMinus6Now() {
        // * Restar 6 horas al timestamp actual
        return new Date(Date.now() - (6 * 60 * 60 * 1000));
      }

      // ? Helper: formatear fecha/hora corta dd/mm/yyyy HH:MM
      function formatFechaHora(d) {
        if (!d || isNaN(d.getTime())) return '';
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }

      // ? Helper: descargar imagen remota como Buffer (soporta https)
      function fetchImageBuffer(url) {
        return new Promise((resolve) => {
          if (!url || typeof url !== 'string') return resolve(null);
          try {
            https.get(url, (res) => {
              const chunks = [];
              res.on('data', (chunk) => chunks.push(chunk));
              res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                // * Verificar tipo mínimo (PNG/JPEG)
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

      // ? Funciones auxiliares para obtener datos de cliente, asesor, configuración y cuotas
      function getCliente(dpi) {
        return new Promise((resolve, reject) => {
          redisClient.get(`cliente_${dpi}`, (err, data) => {
            if (err) {
              reject(err);
            } else if (!data) {
              resolve(null);
            } else {
              try {
                const clienteData = JSON.parse(data);
                resolve(clienteData);
              } catch (parseError) {
                reject(parseError);
              }
            }
          });
        });
      }

      function getAsesor(asesorId) {
        return new Promise((resolve, reject) => {
          const asesorPattern = `listado_*_asesor_${asesorId}`;
          redisClient.keys(asesorPattern, (err, keys) => {
            if (err) {
              reject(err);
            } else if (!keys || keys.length === 0) {
              resolve(null);
            } else {
              redisClient.get(keys[0], (err, data) => {
                if (err) {
                  reject(err);
                } else if (!data) {
                  resolve(null);
                } else {
                  try {
                    const asesorData = JSON.parse(data);
                    resolve(asesorData);
                  } catch (parseError) {
                    reject(parseError);
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

      function getCuotas(dpi, configId, asesorId, contratoId) {
        return new Promise((resolve, reject) => {
          // Para todos los planes (incluido 8), consultar registry primero
          const cuotasKey = `registry_${dpi}_contrato_${configId}_${asesorId}_${contratoId}`;
          redisClient.get(cuotasKey, (err, data) => {
            if (err) {
              reject(err);
            } else if (!data) {
              // Si no hay datos en registry, intentar con old_registry
              const oldCuotasKey = `old_registry_${dpi}_contrato_${configId}_${asesorId}_${contratoId}`;
              redisClient.get(oldCuotasKey, (err2, data2) => {
                if (err2) {
                  reject(err2);
                } else if (!data2) {
                  resolve(null);
                } else {
                  try {
                    const cuotasData = JSON.parse(data2);
                    resolve(cuotasData);
                  } catch (parseError) {
                    console.error('[DEBUG] Error al parsear cuotas desde old_registry:', parseError);
                    reject(parseError);
                  }
                }
              });
            } else {
              try {
                const cuotasData = JSON.parse(data);
                // Si el array de cuotas está vacío, intentar con old_registry
                if (Array.isArray(cuotasData) && cuotasData.length > 13 && Array.isArray(cuotasData[13]) && cuotasData[13].length === 0) {
                  const oldCuotasKey = `old_registry_${dpi}_contrato_${configId}_${asesorId}_${contratoId}`;
                  redisClient.get(oldCuotasKey, (err2, data2) => {
                    if (err2) {
                      reject(err2);
                    } else if (!data2) {
                      resolve(cuotasData); // Devolver el array vacío original
                    } else {
                      try {
                        const oldCuotasData = JSON.parse(data2);
                        resolve(oldCuotasData);
                      } catch (parseError) {
                        console.error('[DEBUG] Error al parsear cuotas desde old_registry:', parseError);
                        resolve(cuotasData); // Devolver el array vacío original si falla
                      }
                    }
                  });
                } else {
                  resolve(cuotasData);
                }
              } catch (parseError) {
                console.error('[DEBUG] Error al parsear cuotas:', parseError);
                reject(parseError);
              }
            }
          });
        });
      }

      // ? Obtener todas las claves que coincidan
      redisClient.keys(pattern, async function (err, keys) {
        if (err) {
          console.error('Error buscando claves en Redis:', err);
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Error al consultar Redis', details: err.message }));
          return reject(err);
        }

        // ? Normalizar keys a arreglo por seguridad
        if (!keys) {
          keys = [];
        } else if (!Array.isArray(keys)) {
          if (typeof keys === 'string') {
            keys = [keys];
          } else if (typeof keys === 'object' && keys !== null && typeof keys.length === 'number') {
            keys = Array.prototype.slice.call(keys);
          } else {
            console.warn('WARN: keys no es array ni string. keys:', keys);
            keys = [];
          }
        }

        try {

          // ? Obtener datos del cliente, asesor, configuración y cuotas
          const [clienteData, asesorData, configData, cuotasData] = await Promise.all([
            getCliente(dpi).catch(err => {
              console.error('Error obteniendo datos del cliente:', err);
              return null;
            }),
            getAsesor(asesor).catch(err => {
              console.error('Error obteniendo datos del asesor:', err);
              return null;
            }),
            getConfiguracion(configuracion).catch(err => {
              console.error('Error obteniendo datos de configuración:', err);
              return null;
            }),
            getCuotas(dpi, configuracion, asesor, contrato).catch(err => {
              console.error('Error obteniendo datos de cuotas:', err);
              return null;
            })
          ]);

          // * Procesar cada clave de pagos
          const pagos = keys.map((key) => {
            const partes = ('' + key).split('_');
            return {
              rawKey: key,
              asesor: partes[1] || '',
              monto: partes[2] || '0',
              fecha: partes[3] || '',
              hora: partes[4] && partes[5] && partes[6] ? `${partes[4]}:${partes[5]} ${partes[6]}` : '',
              contrato: partes[7] || '',
              dpi: partes[8] || '',
            };
          });

          // *Ordenar por fecha descendente
          pagos.sort((a, b) => {
            if (a.fecha && b.fecha) {
              return new Date(b.fecha) - new Date(a.fecha);
            }
            return 0;
          });

          // * Crear el PDF
          const doc = new PDFDocument({ margins: {top: 40, bottom: 45, left: 40, right: 40}, bufferPages: true });
          
          // Preparar nombre del archivo con nombre del cliente (se obtendrá más adelante)
          let nombreArchivoCliente = dpi; // fallback si no hay nombre
          
          const filePath = `reporte_${asesor}_${contrato}_${dpi}.pdf`;
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
            // ? Índice 21 contiene la URL del logo (si existe)
            try {
              logoUrl = configData[21] || null;
            } catch (e) {
              logoUrl = null;
            }
          }

          // ? Intentar descargar el logo (si existe). No bloqueante: si falla, seguimos sin logo.
          if (logoUrl) {
            try {
              logoBuffer = await fetchImageBuffer(logoUrl);
            } catch (e) {
              console.warn('WARN: fallo al descargar logo:', e && e.message);
              logoBuffer = null;
            }
          }
          
          if (logoBuffer) {
              // * Dibujar logo en la esquina izquierda
              const logoWidth = 70; // px
              doc.image(logoBuffer, 40, 15, { width: logoWidth });
              
          }

          // *Escribir los textos del encabezado (centrados)
          doc.fontSize(13).font('Helvetica-Bold').text(nombreNegocio, { align: 'center' });
          doc.fontSize(11).font('Helvetica').text(direccionNegocio, { align: 'center' });
          doc.text(`NIT: ${nitNegocio}`, { align: 'center' });
          doc.moveDown(0.5);
          
          // * Línea separadora
          doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#9f9f9f').lineWidth(1).stroke();
          doc.moveDown(1);

          // * Encabezado principal del reporte
          doc.fontSize(12).font('Helvetica-Bold').text('Estado de cuenta', { align: 'center' });
          doc.moveDown(1);

          // * Preparar datos para mostrar en dos columnas
          let nombreCliente = 'No disponible';
          let direccionCliente = 'No disponible';
          let telefonoCliente = 'No disponible';
          
          let nombreAsesor = 'No disponible';
          let direccionAsesor = 'No disponible';
          let telefonoAsesor = 'No disponible';

          if (clienteData) {
            nombreCliente = `${clienteData[8] || ''} ${clienteData[9] || ''} ${clienteData[10] || ''} ${clienteData[11] || ''}`.trim();
            direccionCliente = `${clienteData[12] || ''} ${clienteData[13] || ''} ${clienteData[14] || ''} ${clienteData[15] || ''}`.trim();
            telefonoCliente = clienteData[17] || 'No disponible';
            // Preparar nombre para archivo (sin espacios ni caracteres especiales)
            nombreArchivoCliente = nombreCliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50) || dpi;
          }

          if (asesorData) {
            nombreAsesor = `${asesorData[7] || ''} ${asesorData[8] || ''} ${asesorData[9] || ''} ${asesorData[10] || ''}`.trim();
            direccionAsesor = `${asesorData[11] || ''} ${asesorData[12] || ''} ${asesorData[13] || ''} ${asesorData[14] || ''}`.trim();
            telefonoAsesor = asesorData[16] || 'No disponible';
          }

          // Diseño de dos columnas para cliente y asesor
          const startY = doc.y;
          const pageWidth = doc.page.width - 80;
          const colWidth = pageWidth / 2;

          // Columna izquierda - Información del cliente
          doc.fontSize(11).font('Helvetica-Bold').text('INFORMACIÓN DEL CLIENTE:', 40, startY);
          doc.font('Helvetica');
          doc.text(`Nombre: ${nombreCliente}`, 40, startY + 20);
          doc.text(`DPI: ${dpi}`, 40, startY + 35);
          doc.text(`Dirección: ${direccionCliente}`, 40, startY + 50);
          doc.text(`Teléfono: ${telefonoCliente}`, 40, startY + 65);

          // Columna derecha - Información del asesor
          doc.font('Helvetica-Bold').text('INFORMACIÓN DEL ASESOR:', 40 + colWidth, startY, { 
            width: colWidth, 
            align: 'right' 
          });
          doc.font('Helvetica');
          doc.text(`Nombre: ${nombreAsesor}`, 40 + colWidth, startY + 20, { 
            width: colWidth, 
            align: 'right' 
          });
          doc.text(`Dirección: ${direccionAsesor}`, 40 + colWidth, startY + 35, { 
            width: colWidth, 
            align: 'right' 
          });
          doc.text(`Teléfono: ${telefonoAsesor}`, 40 + colWidth, startY + 50, { 
            width: colWidth, 
            align: 'right' 
          });

          // * Ajustar posición Y después de las dos columnas
          doc.y = startY + 70;

          // * REINICIAR POSICIÓN X ANTES DE CONTINUAR
          doc.x = 40;
          
          doc.text('', 40, doc.y + 20); // Espacio extra
          doc.font('Helvetica-Bold').text('Pagos Registrados:');
          doc.moveDown(0.5);
          doc.font('Helvetica');

          doc.fontSize(10);
          // * Tabla de pagos
          const headers = ['Fecha', 'Hora', 'Monto (Q)'];
          
          function formatFecha(fechaStr) {
            if (!fechaStr) return '-';
            const s = String(fechaStr).trim();
            // ? Parse local date to avoid timezone shifts for YYYY-MM-DD
            const m = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
            let d;
            if (m) {
              const y = parseInt(m[1], 10);
              const mo = parseInt(m[2], 10) - 1;
              const da = parseInt(m[3], 10);
              const hh = m[4] ? parseInt(m[4], 10) : 0;
              const mm = m[5] ? parseInt(m[5], 10) : 0;
              const ss = m[6] ? parseInt(m[6], 10) : 0;
              d = new Date(y, mo, da, hh, mm, ss);
            } else {
              d = new Date(s);
            }
            if (isNaN(d)) return fechaStr;
            const weekday = d.toLocaleDateString('es-ES', { weekday: 'long' });
            const month = d.toLocaleDateString('es-ES', { month: 'long' });
            const capitalize = (str) => (str && str.length ? str.charAt(0).toUpperCase() + str.slice(1) : str);
            return `${capitalize(weekday)} ${d.getDate()} de ${capitalize(month)} ${d.getFullYear()}`;
          }

          function formatMonto(monto) {
            const raw = String(monto || '0').replace(/[^0-9.\-]/g, '');
            let n = parseFloat(raw);
            if (isNaN(n)) n = 0;
            const formatted = n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            return `Q ${formatted}`;
          }

          const dataRows = pagos.map((p) => [
            formatFecha(p.fecha),
            p.hora || '-',
            formatMonto(p.monto),
          ]);

          // Si no hay pagos, mostrar mensaje directamente
          if (dataRows.length === 0) {
            doc.moveDown(0.5);
            doc.font('Helvetica').fontSize(10).text('No hay pagos registrados para este contrato', { align: 'center' });
            doc.moveDown(0.5);
          } else {
            doc.table({
              columnStyles: (i) => {
                if (i === 0) return { width: "*", align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
                if (i === 1) return { width: "*", align: 'center', border: [1, 0, 1, 0], borderColor: 'black' };
                if (i === 2) return { width: "*", align: 'right', border: [1, 0, 1, 0], borderColor: 'black' };
              },
              rowStyles(i) {
                if (i === 0) return { textStroke: 0.5 };
              },
              data: [headers, ...dataRows],
            });
          }
          
          // Total general
          const total = pagos.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0);
          doc.moveDown(0.8);
          doc.font('Helvetica-Bold').text(`Total Pagado: ${formatMonto(total)}`, { align: 'right' });

          // TABLA DE CUOTAS - NUEVA SECCIÓN
          // Nota: el título de la sección se escribirá más abajo, después de calcular
          // si la tabla (incluyendo el título) cabe en la página actual. Esto asegura
          // que el título no se quede al final de una página y la tabla empiece en la siguiente.

          // Si el plan es 8 y no hay datos, mostrar mensaje
          if (plan === '8' && (!cuotasData || !Array.isArray(cuotasData) || !Array.isArray(cuotasData[13]) || cuotasData[13].length === 0)) {
            doc.moveDown(3);
            doc.fontSize(12).font('Helvetica-Bold').text('Listado de Cuotas', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10).font('Helvetica').text('No hay información disponible', { align: 'center' });
          }
          
          // Renderizar tabla de cuotas si hay datos
          if (cuotasData && Array.isArray(cuotasData) && Array.isArray(cuotasData[13]) && cuotasData[13].length > 0) {
            const cuotas = cuotasData[13];
            
            // Helper: parsear fecha como local (evita el problema de "YYYY-MM-DD" tratado como UTC)
            function parseLocalDate(dateStr) {
              if (!dateStr) return null;
              const s = String(dateStr).trim();
              // Match YYYY-MM-DD or YYYY/MM/DD optionally with time
              const dateTimeMatch = s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
              if (dateTimeMatch) {
                const y = parseInt(dateTimeMatch[1], 10);
                const m = parseInt(dateTimeMatch[2], 10) - 1;
                const d = parseInt(dateTimeMatch[3], 10);
                const hh = dateTimeMatch[4] ? parseInt(dateTimeMatch[4], 10) : 0;
                const mm = dateTimeMatch[5] ? parseInt(dateTimeMatch[5], 10) : 0;
                const ss = dateTimeMatch[6] ? parseInt(dateTimeMatch[6], 10) : 0;
                return new Date(y, m, d, hh, mm, ss);
              }
              // Fallback: try native parser
              const d = new Date(s);
              if (!isNaN(d)) return d;
              return null;
            }

            // * Función para calcular días de atraso (usa parseLocalDate)
            function calcularDiasAtraso(fechaEstablecida, fechaPago) {
              if (!fechaEstablecida) return 0;
              const fechaEst = parseLocalDate(fechaEstablecida) || getUtcMinus6Now();
              const fechaComp = fechaPago ? (parseLocalDate(fechaPago) || formatFechaHora(fechaPago)) : getUtcMinus6Now();
              // Normalizar horas a medianoche para comparar solo fechas
              const estMid = new Date(fechaEst.getFullYear(), fechaEst.getMonth(), fechaEst.getDate());
              const compMid = new Date(fechaComp.getFullYear(), fechaComp.getMonth(), fechaComp.getDate());
              if (compMid > estMid) {
                const diffTime = compMid - estMid;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 ? diffDays : 0;
              }
              return 0;
            }

            // * Función para formatear fecha corta (DD/MM/YYYY) usando parseLocalDate
            function formatFechaCorta(fechaStr) {
              if (!fechaStr) return '';
              const d = parseLocalDate(fechaStr);
              if (!d) return fechaStr;
              return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
            }

            // * Preparar datos para la tabla de cuotas
            const headersCuotas = ['No.', 'Fecha establecida', 'Fecha pago', 'Días Atraso', 'Cuota', 'Abono', 'Pendiente', 'Pagado'];
            
            let totalCuota = 0;
            let totalAbono = 0;
            let totalPendiente = 0;

            const dataRowsCuotas = cuotas.map((cuota, index) => {
              const numero = (index + 1) + '.';
              const fechaEstablecida = cuota.fe ? formatFecha(cuota.fe) : '';
              const fechaPago = cuota.pago ? formatFechaCorta(cuota.pago) : '';
              const diasAtraso = calcularDiasAtraso(cuota.fe, cuota.pago);
              const montoCuota = parseFloat(cuota.cp || 0);
              const abono = cuota.ct === true ? parseFloat(cuota.cp) : parseFloat(cuota.pe || 0);
              const pendiente = montoCuota - abono;
              const pagado = cuota.ct ? 'Si' : 'No';

              totalCuota += montoCuota;
              totalAbono += abono;
              totalPendiente += pendiente;

              return [
                numero,
                fechaEstablecida,
                fechaPago,
                diasAtraso.toString(),
                formatMonto(montoCuota),
                formatMonto(abono),
                formatMonto(pendiente),
                pagado
              ];
            });

            // Agregar fila de totales
            dataRowsCuotas.push([
              '',
              '',
              '',
              '',
              formatMonto(totalCuota),
              formatMonto(totalAbono),
              formatMonto(totalPendiente),
              ''
            ]);

            // Antes de crear la tabla de cuotas, verificar si cabe en la página actual.
            // Calculamos una estimación de altura requerida y, si cabe en una página completa,
            // pero no hay suficiente espacio en la página actual, hacemos un salto de página.
            const headerFontSize = 10;
            doc.fontSize(headerFontSize).font('Helvetica');
            const approxRowHeight = doc.currentLineHeight() + 4; // estimación por fila
            const headerHeight = approxRowHeight * 1.2; // estimación para fila de encabezado
            const totalsHeight = approxRowHeight * 2; // espacio para la fila de totales y resumen
            const requiredHeight = headerHeight + (dataRowsCuotas.length * approxRowHeight) + totalsHeight;
            const availableHeight = doc.page.height - doc.page.margins.bottom - doc.y;
            const pageContentHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

            // Estimación de la altura del título para mantenerlo junto a la tabla
            const titleFontSize = 12;
            // medir título temporalmente (no lo dibujamos aún)
            doc.fontSize(titleFontSize).font('Helvetica-Bold');
            const titleHeight = doc.currentLineHeight() + 6;
            // volver a fuente de cabecera (usada para las filas)
            doc.fontSize(headerFontSize).font('Helvetica');

            // Incluir el título en la altura requerida para la tabla (título + tabla + totales)
            const totalRequiredWithTitle = titleHeight + requiredHeight;

            // Si la tabla (con título) cabe en una sola página y no hay suficiente espacio
            // en la página actual, saltar de página para mantener título y tabla juntos.
            if (totalRequiredWithTitle <= pageContentHeight && totalRequiredWithTitle > availableHeight) {
              doc.addPage();
              // reajustar posición Y tras el salto
            }

            // Escribir el título ahora, ya que garantizamos que quedará unido a la tabla
            doc.moveDown(1);
            doc.fontSize(titleFontSize).font('Helvetica-Bold').text('Listado de Cuotas', { align: 'center' });
            doc.fontSize(10).font('Helvetica');
            doc.moveDown(0.5);

            // Crear tabla de cuotas
            doc.table({
              columnStyles: (i) => {
                const styles = [
                  { width: 30, align: 'left', border: [1, 0, 1, 0], borderColor: 'black' },    // No.
                  { width: "*", align: 'center', border: [1, 0, 1, 0], borderColor: 'black' }, // Fecha establecida
                  { width: "*", align: 'center', border: [1, 0, 1, 0], borderColor: 'black' }, // Fecha pago
                  { width: 65, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' }, // Días Atraso
                  { width: 60, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' },  // Cuota
                  { width: 60, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' },  // Abono
                  { width: 60, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' },  // Pendiente
                  { width: 60, align: 'center', border: [1, 0, 1, 0], borderColor: 'black' }  // Pagado
                ];
                return styles[i];
              },
              rowStyles(i) {
                if (i === 0) return { textStroke: 0.5 }; // Encabezados en negrita
                if (i === dataRowsCuotas.length) return { textStroke: 0.5 }; // Fila de totales en negrita
                return {};
              },
              data: [headersCuotas, ...dataRowsCuotas],
            });

            // Resumen de totales
            doc.moveDown(0.8);
            doc.font('Helvetica-Bold').text(`Total Contrato: ${formatMonto(totalCuota)}`, { align: 'right' });
            doc.text(`Total Abonado: ${formatMonto(totalAbono)}`, { align: 'right' });
            doc.text(`Total Pendiente: ${formatMonto(totalPendiente)}`, { align: 'right' });
          } else {
            doc.moveDown(0.5);
            doc.font('Helvetica').text('No se encontraron datos de cuotas para este contrato.', { align: 'center' });
          }

          const fechaGeneracionObj = getUtcMinus6Now();
          const fechaGeneracionStr = formatFechaHora(fechaGeneracionObj);

          const range = doc.bufferedPageRange(); 
          const totalPages = range.count;
          
          // Iterar sobre CADA página
          for (let i = 0; i < totalPages; i++) {
            
            doc.switchToPage(i);

            const pageHeight = doc.page.height
            const pageWidth = doc.page.width
            const bottomPosition = pageHeight - 45 // Posición absoluta desde arriba (45px del borde inferior)

            // Guardar márgenes actuales
            const originalBottomMargin = doc.page.margins.bottom

            // Desactivar margen inferior temporalmente para escribir en esa área
            doc.page.margins.bottom = 0
            
            // 1. Dibujar el número de página (Alineación Izquierda)
            // Al especificar las coordenadas (footerXMargin, footerY), se ignora doc.y
            doc.fontSize(9).text(
              `Página ${i + 1} de ${totalPages}`,
                30,
                bottomPosition,
                { align: 'center', width: pageWidth - 60, lineBreak: false }
            );

            // 2. Dibujar la fecha de generación (Alineación Derecha)
            // Usamos el mismo Y para que queden en la misma línea
            doc.text(
              `Generado: ${fechaGeneracionStr}`,
              30,
                bottomPosition,
                { align: 'left', width: pageWidth - 60, lineBreak: false }
            );

            doc.page.margins.bottom = originalBottomMargin
          }

          doc.end();

          // Enviar PDF cuando termine de escribirse
          stream.on('finish', function () {
            response.writeHead(200, {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="REPORTE_ESTADO_CUENTA_CONTRATO_${nombreArchivoCliente}_DPI_${dpi}_Telefono_${telefonoCliente}.pdf"`,
            });

            const fileStream = fs.createReadStream(filePath);
            fileStream.pipe(response);

            fileStream.on('end', function () {
              try {
                fs.unlinkSync(filePath);
              } catch (e) {}
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
      });
    } catch (ex) {
      console.error('Excepción en generarReportePagos:', ex);
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Error interno' }));
      return reject(ex);
    }
  });
}

module.exports = { generarReportePagos };