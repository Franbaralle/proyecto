const XLSX = require('xlsx');
const path = require('path');

const copsoqPath = path.join(__dirname, '..', 'Tabulación y Análisis de COPSOQ-ARG versión breve.xlsx');
const workbook = XLSX.readFile(copsoqPath);

console.log('\n========== COPSOQ PREGUNTAS Y PUNTAJES ==========\n');
const puntajesSheet = workbook.Sheets['Puntajes de las respuestas'];
const puntajesData = XLSX.utils.sheet_to_json(puntajesSheet, { header: 1, defval: '' });

console.log('--- Preguntas completas con opciones ---');
for (let i = 9; i < 50 && i < puntajesData.length; i++) {
  const row = puntajesData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}

console.log('\n========== PROCEDIMIENTO Y TERCILES ==========\n');
const procedimientoSheet = workbook.Sheets['Procedimiento para calcular el '];
const procedimientoData = XLSX.utils.sheet_to_json(procedimientoSheet, { header: 1, defval: '' });

console.log('--- Dimensiones e índices ---');
for (let i = 11; i < 35 && i < procedimientoData.length; i++) {
  const row = procedimientoData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}

console.log('\n========== SECCIÓN ESPECÍFICA - ESTRUCTURA ==========\n');
const especificaSheet = workbook.Sheets['Secci├│n Especifica'];
const especificaData = XLSX.utils.sheet_to_json(especificaSheet, { header: 1, defval: '' });

console.log('--- Preguntas por dimensión (primeras 40 filas) ---');
for (let i = 0; i < 40 && i < especificaData.length; i++) {
  const row = especificaData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row.slice(0, 5))); // Solo primeras 5 columnas
  }
}
