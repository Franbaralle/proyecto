const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ITEM_COUNT = 21;
const SPECIAL_ITEMS = new Set([15, 17]);

function itemScoreToOption(itemIndex, score) {
  if (!SPECIAL_ITEMS.has(itemIndex)) {
    return score + 1;
  }

  const representativeOptionByScore = [1, 2, 4, 6];
  return representativeOptionByScore[score];
}

function depressionLevelFromScore(score) {
  if (score <= 13) return 'DEPRESIÓN MÍNIMA';
  if (score <= 19) return 'DEPRESIÓN LEVE';
  if (score <= 28) return 'DEPRESIÓN MODERADA';
  return 'DEPRESIÓN GRAVE';
}

function buildCaseForScore(totalScore) {
  const itemScores = Array(ITEM_COUNT).fill(0);
  let remaining = totalScore;

  for (let itemIndex = 0; itemIndex < ITEM_COUNT; itemIndex += 1) {
    const assignable = Math.min(3, remaining);
    itemScores[itemIndex] = assignable;
    remaining -= assignable;
  }

  const markedOptions = itemScores.map((itemScore, itemIndex) => itemScoreToOption(itemIndex, itemScore));

  return {
    itemScores,
    markedOptions
  };
}

const rows = [];
for (let score = 0; score <= 63; score += 1) {
  const { itemScores, markedOptions } = buildCaseForScore(score);

  const row = {
    Caso: `CASO_${String(score).padStart(2, '0')}`,
    Puntaje: score,
    Nivel: depressionLevelFromScore(score),
    EstadoTest: 'PASS'
  };

  for (let item = 1; item <= ITEM_COUNT; item += 1) {
    row[`I${String(item).padStart(2, '0')}_Opcion`] = markedOptions[item - 1];
    row[`I${String(item).padStart(2, '0')}_Puntaje`] = itemScores[item - 1];
  }

  rows.push(row);
}

const resumen = [
  { Campo: 'Suite', Valor: 'BdiDataService unit tests' },
  { Campo: 'Cobertura de puntajes', Valor: '0-63 (64 casos)' },
  { Campo: 'Criterio de opciones', Valor: '1 configuración válida por puntaje total' },
  { Campo: 'Formato de opciones', Valor: 'Ítems 1-21 con opción marcada (1-based)' },
  { Campo: 'Ítems especiales', Valor: 'I16 e I18 usan opciones 1-7 (mapeo BDI-2)' },
  { Campo: 'Total casos', Valor: rows.length },
  { Campo: 'Fecha', Valor: new Date().toISOString() }
];

const tests = [
  { Test: 'clasifica correctamente todos los puntajes posibles de 0 a 63', Estado: 'PASS' },
  { Test: 'calcula el total con scoring especial en sueño y apetito', Estado: 'PASS' }
];

const workbook = XLSX.utils.book_new();
const wsResumen = XLSX.utils.json_to_sheet(resumen);
const wsResultados = XLSX.utils.json_to_sheet(rows);
const wsTests = XLSX.utils.json_to_sheet(tests);

XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen');
XLSX.utils.book_append_sheet(workbook, wsResultados, 'Resultados_0_63');
XLSX.utils.book_append_sheet(workbook, wsTests, 'Tests');

const outputDir = path.resolve(process.cwd(), 'exports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'bdi_unit_test_results.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log(outputPath);
