const XLSX = require('xlsx');
const path = require('path');

const copsoqPath = path.join(__dirname, '..', 'Tabulación y Análisis de COPSOQ-ARG versión breve.xlsx');
const workbook = XLSX.readFile(copsoqPath);

console.log('\n========== TERCILES COMPLETOS ==========\n');
const procedimientoSheet = workbook.Sheets['Procedimiento para calcular el '];
const procedimientoData = XLSX.utils.sheet_to_json(procedimientoSheet, { header: 1, defval: '' });

console.log('--- Todos los terciles ---');
for (let i = 28; i < 40 && i < procedimientoData.length; i++) {
  const row = procedimientoData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}

console.log('\n========== PREGUNTAS 29 Y 30 (JUSTICIA LABORAL) ==========\n');
const puntajesSheet = workbook.Sheets['Puntajes de las respuestas'];
const puntajesData = XLSX.utils.sheet_to_json(puntajesSheet, { header: 1, defval: '' });

for (let i = 49; i < 60 && i < puntajesData.length; i++) {
  const row = puntajesData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}

console.log('\n========== MBI DATOS CLAVE ==========\n');
const mbiPath = path.join(__dirname, '..', 'MBI-Automatizado.xlsx');
const mbiWorkbook = XLSX.readFile(mbiPath);

console.log('--- Items y preguntas MBI ---');
const itemsSheet = mbiWorkbook.Sheets['Items_y_Claves'];
const itemsData = XLSX.utils.sheet_to_json(itemsSheet, { header: 1, defval: '' });

for (let i = 0; i < 24 && i < itemsData.length; i++) {
  const row = itemsData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}

console.log('\n--- Baremos MBI ---');
const logicaSheet = mbiWorkbook.Sheets['Logica_programador'];
const logicaData = XLSX.utils.sheet_to_json(logicaSheet, { header: 1, defval: '' });

for (let i = 0; i < 15 && i < logicaData.length; i++) {
  const row = logicaData[i];
  if (row && row.some(cell => cell !== '')) {
    console.log(`Fila ${i}:`, JSON.stringify(row));
  }
}
