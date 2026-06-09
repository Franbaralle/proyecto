import { Injectable } from '@angular/core';

export interface COPSOQQuestion {
  numero: number;
  texto: string;
  dimension: string;
  invertido: boolean; // true si 0=mejor, false si 100=mejor
}

export interface COPSOQTerciles {
  verde: string;
  amarillo: string;
  rojo: string;
}

@Injectable({
  providedIn: 'root'
})
export class CopsoqDataService {
  private preguntas: COPSOQQuestion[] = [
    // Dimensión 1: Exigencias en el trabajo (1-6) - NO invertidas
    { numero: 1, texto: '¿Con qué frecuencia no puede terminar sus tareas laborales?', dimension: 'Exigencias en el trabajo', invertido: false },
    { numero: 2, texto: '¿Con qué frecuencia se retrasa en la entrega de su trabajo?', dimension: 'Exigencias en el trabajo', invertido: false },
    { numero: 3, texto: '¿Con qué frecuencia tiene que trabajar muy rápido?', dimension: 'Exigencias en el trabajo', invertido: false },
    { numero: 4, texto: '¿Con qué frecuencia el ritmo de trabajo es alto todo el día?', dimension: 'Exigencias en el trabajo', invertido: false },
    { numero: 5, texto: '¿Con qué frecuencia en su trabajo tiene que atender problemas de otros? (que no sean compañeros ni jefes)', dimension: 'Exigencias en el trabajo', invertido: false },
    { numero: 6, texto: '¿Con qué frecuencia su trabajo es emocionalmente desgastador?', dimension: 'Exigencias en el trabajo', invertido: false },
    
    // Dimensión 2: Doble presencia (7) - NO invertida
    { numero: 7, texto: '¿Con qué frecuencia hay momentos en los que necesitaría estar "en su trabajo y en casa a la vez"?', dimension: 'Doble presencia', invertido: false },
    
    // Dimensión 3: Organización del trabajo (8-12) - INVERTIDAS
    { numero: 8, texto: '¿Con qué frecuencia usted puede incidir/influir sobre las decisiones que afectan su trabajo?', dimension: 'Organización del trabajo', invertido: true },
    { numero: 9, texto: '¿Con qué frecuencia su trabajo le permite aprender cosas nuevas?', dimension: 'Organización del trabajo', invertido: true },
    { numero: 10, texto: '¿Con qué frecuencia su trabajo le permite aplicar sus habilidades y conocimientos?', dimension: 'Organización del trabajo', invertido: true },
    { numero: 11, texto: '¿Con qué frecuencia tienen sentido sus tareas?', dimension: 'Organización del trabajo', invertido: true },
    { numero: 12, texto: '¿Con qué frecuencia puede decidir cuándo hace un descanso/pausa?', dimension: 'Organización del trabajo', invertido: true },
    
    // Dimensión 4: Relaciones interpersonales (13-23)
    { numero: 13, texto: '¿Con qué frecuencia en su trabajo se le informa con suficiente antelación las decisiones importantes, cambios y proyectos de futuro?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 14, texto: '¿Con qué frecuencia recibe toda la información que necesita para realizar bien su trabajo?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 15, texto: '¿Con qué frecuencia le son transmitidos claramente los objetivos de trabajo?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 16, texto: '¿Con qué frecuencia se le exigen cosas contradictorias/opuestas en el trabajo?', dimension: 'Relaciones interpersonales', invertido: false },
    { numero: 17, texto: '¿Con qué frecuencia tiene que realizar tareas que a su criterio deberían hacerse de otra manera?', dimension: 'Relaciones interpersonales', invertido: false },
    { numero: 18, texto: '¿Con qué frecuencia su jefe inmediato planifica bien el trabajo?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 19, texto: '¿Con qué frecuencia su jefe inmediato resuelve bien los conflictos?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 20, texto: '¿Con qué frecuencia recibe ayuda y apoyo de sus compañeros de trabajo en la realización de sus tareas?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 21, texto: '¿Con qué frecuencia recibe ayuda y apoyo de su jefe inmediato en la realización de su trabajo?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 22, texto: '¿Con qué frecuencia tiene un buen ambiente con sus compañeros de trabajo?', dimension: 'Relaciones interpersonales', invertido: true },
    { numero: 23, texto: '¿Con qué frecuencia su trabajo es valorado por sus superiores, dirección, gerencia o dueño?', dimension: 'Relaciones interpersonales', invertido: true },
    
    // Dimensión 5: Inestabilidad en el trabajo (24-26) - NO invertidas
    { numero: 24, texto: '¿Con qué frecuencia está preocupado/a por si lo despiden o no le renuevan el contrato?', dimension: 'Inestabilidad en el trabajo', invertido: false },
    { numero: 25, texto: '¿Con qué frecuencia está preocupado/a por lo difícil que sería encontrar otro trabajo en caso que se quedara desempleado?', dimension: 'Inestabilidad en el trabajo', invertido: false },
    { numero: 26, texto: '¿Con qué frecuencia está preocupado/a por si lo trasladan a otro centro de trabajo, unidad, departamento o sección, contra su voluntad?', dimension: 'Inestabilidad en el trabajo', invertido: false },
    
    // Dimensión 6: Confianza (27-28) - INVERTIDAS
    { numero: 27, texto: '¿Con qué frecuencia la dirección, gerencia o dueño confía en que los trabajadores hagan bien su trabajo?', dimension: 'Confianza', invertido: true },
    { numero: 28, texto: '¿Con qué frecuencia se puede confiar en la información que viene de la dirección, gerencia o dueño?', dimension: 'Confianza', invertido: true },
    
    // Dimensión 7: Justicia laboral (29-30) - INVERTIDAS
    { numero: 29, texto: '¿Con qué frecuencia se solucionan los conflictos de una manera justa?', dimension: 'Justicia laboral', invertido: true },
    { numero: 30, texto: '¿Con qué frecuencia se distribuyen las tareas de una forma justa?', dimension: 'Justicia laboral', invertido: true }
  ];

  private opciones = [
    { valor: 0, etiqueta: 'Nunca' },
    { valor: 25, etiqueta: 'Sólo alguna vez' },
    { valor: 50, etiqueta: 'Algunas veces' },
    { valor: 75, etiqueta: 'Muchas veces' },
    { valor: 100, etiqueta: 'Siempre' }
  ];

  private terciles: { [key: string]: COPSOQTerciles } = {
    'Exigencias en el trabajo': { verde: '< 39', amarillo: '39 - 56', rojo: '> 56' },
    'Doble presencia': { verde: '< 25', amarillo: '25 - 50', rojo: '> 50' },
    'Organización del trabajo': { verde: '< 33', amarillo: '33 - 47', rojo: '> 47' },
    'Relaciones interpersonales': { verde: '< 24', amarillo: '24 - 36', rojo: '> 36' },
    'Inestabilidad en el trabajo': { verde: '< 8', amarillo: '8 - 33', rojo: '> 33' },
    'Confianza': { verde: '< 25', amarillo: '25 - 40', rojo: '> 40' },
    'Justicia laboral': { verde: '< 25', amarillo: '25 - 50', rojo: '> 50' }
  };

  constructor() { }

  getPreguntas(): COPSOQQuestion[] {
    return this.preguntas;
  }

  getOpciones() {
    return this.opciones;
  }

  calcularPuntajes(respuestas: number[]): {
    dimensiones: { [key: string]: { indice: number; categoria: string; color: string } };
    resumen: string;
    riesgosAltos: string[];
  } {
    const dimensionesConfig = {
      'Exigencias en el trabajo': { items: [0, 1, 2, 3, 4, 5], count: 6 },
      'Doble presencia': { items: [6], count: 1 },
      'Organización del trabajo': { items: [7, 8, 9, 10, 11], count: 5 },
      'Relaciones interpersonales': { items: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22], count: 11 },
      'Inestabilidad en el trabajo': { items: [23, 24, 25], count: 3 },
      'Confianza': { items: [26, 27], count: 2 },
      'Justicia laboral': { items: [28, 29], count: 2 }
    };

    const dimensiones: { [key: string]: { indice: number; categoria: string; color: string } } = {};
    const riesgosAltos: string[] = [];

    for (const [dimension, config] of Object.entries(dimensionesConfig)) {
      // Calcular índice: suma de puntajes / cantidad de ítems
      const suma = config.items.reduce((acc, idx) => {
        let valor = respuestas[idx] || 0;
        // Aplicar inversión si corresponde
        const pregunta = this.preguntas[idx];
        if (pregunta.invertido) {
          valor = 100 - valor;
        }
        return acc + valor;
      }, 0);

      const indice = config.count === 1 ? suma : suma / config.count;

      // Determinar categoría según terciles
      const { categoria, color } = this.categorizarIndice(dimension, indice);
      
      dimensiones[dimension] = { indice: Math.round(indice * 10) / 10, categoria, color };

      if (color === 'rojo') {
        riesgosAltos.push(dimension);
      }
    }

    // Generar resumen
    let resumen = `COPSOQ-ARG - Evaluación de Factores Psicosociales en el Trabajo\n\n`;
    resumen += `Se evaluaron 7 dimensiones de riesgos psicosociales laborales.\n`;
    resumen += `Resultado: ${riesgosAltos.length} dimensión(es) en nivel de riesgo alto (ROJO).\n\n`;

    if (riesgosAltos.length > 0) {
      resumen += `⚠ DIMENSIONES QUE REQUIEREN INTERVENCIÓN PRIORITARIA:\n`;
      riesgosAltos.forEach(d => {
        resumen += `  • ${d}: ${dimensiones[d].indice} puntos\n`;
      });
      resumen += `\nSe recomienda implementar medidas preventivas para reducir la exposición en estas áreas.`;
    } else {
      resumen += `✓ No se detectaron áreas de riesgo alto. Se recomienda mantener condiciones actuales y monitorear periódicamente.`;
    }

    return { dimensiones, resumen, riesgosAltos };
  }

  private categorizarIndice(dimension: string, indice: number): { categoria: string; color: string } {
    const tercil = this.terciles[dimension];
    
    // Parsear los límites (ej: "< 39" -> 39, "39 - 56" -> [39, 56], "> 56" -> 56)
    const verdeMatch = tercil.verde.match(/< (\d+)/);
    const amarilloMatch = tercil.amarillo.match(/(\d+) - (\d+)/);
    const rojoMatch = tercil.rojo.match(/> (\d+)/);

    if (verdeMatch && indice < parseFloat(verdeMatch[1])) {
      return { categoria: 'Riesgo Bajo', color: 'verde' };
    }

    if (amarilloMatch) {
      const min = parseFloat(amarilloMatch[1]);
      const max = parseFloat(amarilloMatch[2]);
      if (indice >= min && indice <= max) {
        return { categoria: 'Riesgo Moderado', color: 'amarillo' };
      }
    }

    return { categoria: 'Riesgo Alto', color: 'rojo' };
  }

  getTerciles(dimension: string): COPSOQTerciles {
    return this.terciles[dimension];
  }

  interpretarResultado(resultados: any): string {
    const { dimensiones, riesgosAltos } = resultados;
    
    let interpretacion = `INTERPRETACIÓN CLÍNICA - COPSOQ-ARG\n\n`;
    interpretacion += `El COPSOQ-ARG es un método de evaluación de riesgos psicosociales en el trabajo orientado a la prevención.\n`;
    interpretacion += `Los resultados identifican aspectos de la organización del trabajo que pueden ser mejorados.\n\n`;
    interpretacion += `RESULTADOS POR DIMENSIÓN:\n\n`;

    for (const [dimension, datos] of Object.entries(dimensiones)) {
      const { indice, categoria, color } = datos as any;
      const tercil = this.terciles[dimension];
      const emoji = color === 'verde' ? '✓' : color === 'amarillo' ? '⚠' : '❌';
      
      interpretacion += `${emoji} ${dimension}: ${indice} puntos - ${categoria}\n`;
      interpretacion += `   Baremos: Verde ${tercil.verde} | Amarillo ${tercil.amarillo} | Rojo ${tercil.rojo}\n`;
      
      if (color === 'rojo') {
        interpretacion += `   ⚠ ATENCIÓN: Esta dimensión requiere intervención prioritaria.\n`;
      } else if (color === 'amarillo') {
        interpretacion += `   ⚠ Monitorear esta dimensión y considerar acciones preventivas.\n`;
      } else {
        interpretacion += `   ✓ Esta dimensión presenta condiciones favorables.\n`;
      }
      interpretacion += `\n`;
    }

    interpretacion += `\nRECOMENDACIONES:\n`;
    if (riesgosAltos.length === 0) {
      interpretacion += `• Mantener las condiciones laborales actuales.\n`;
      interpretacion += `• Realizar evaluaciones periódicas para monitoreo continuo.\n`;
    } else {
      interpretacion += `• Implementar medidas preventivas en las ${riesgosAltos.length} dimensión(es) de riesgo alto.\n`;
      interpretacion += `• Priorizar intervenciones en: ${riesgosAltos.join(', ')}.\n`;
      interpretacion += `• Involucrar a trabajadores y dirección en el diseño de soluciones.\n`;
      interpretacion += `• Reevaluar después de implementar cambios.\n`;
    }

    interpretacion += `\nNOTA: Este instrumento debe utilizarse para análisis organizacional, no para caracterización individual.`;
    
    return interpretacion;
  }
}
