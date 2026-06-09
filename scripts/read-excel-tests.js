const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Leer MBI
console.log('========== MBI-Automatizado.xlsx ==========\n');
try {
  const mbiPath = path.join(__dirname, '..', 'MBI-Automatizado.xlsx');
  const mbiWorkbook = XLSX.readFile(mbiPath);
  
  console.log('Hojas disponibles:', mbiWorkbook.SheetNames);
  console.log('\n');
  
  mbiWorkbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Hoja: ${sheetName} ---`);
    const sheet = mbiWorkbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    // Mostrar las primeras 30 filas
    console.log('Primeras 30 filas:');
    data.slice(0, 30).forEach((row, idx) => {
      if (row.some(cell => cell !== '')) {
        console.log(`Fila ${idx}:`, JSON.stringify(row));
      }
    });
  });
} catch (error) {
  console.log('Error leyendo MBI:', error.message);
}

console.log('\n\n========== COPSOQ-ARG ==========\n');
try {
  const copsoqPath = path.join(__dirname, '..', 'Tabulación y Análisis de COPSOQ-ARG versión breve.xlsx');
  const copsoqWorkbook = XLSX.readFile(copsoqPath);
  
  console.log('Hojas disponibles:', copsoqWorkbook.SheetNames);
  console.log('\n');
  
  copsoqWorkbook.SheetNames.forEach(sheetName => {
    console.log(`\n--- Hoja: ${sheetName} ---`);
    const sheet = copsoqWorkbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    // Mostrar las primeras 30 filas
    console.log('Primeras 30 filas:');
    data.slice(0, 30).forEach((row, idx) => {
      if (row.some(cell => cell !== '')) {
        console.log(`Fila ${idx}:`, JSON.stringify(row));
      }
    });
  });
} catch (error) {
  console.log('Error leyendo COPSOQ:', error.message);
}
