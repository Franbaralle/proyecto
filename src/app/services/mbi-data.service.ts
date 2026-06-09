import { Injectable } from '@angular/core';

interface MBIQuestion {
  numero: number;
  texto: string;
  subescala: 'AE' | 'D' | 'RP';
}

interface MBIOption {
  valor: number;
  etiqueta: string;
}

@Injectable({
  providedIn: 'root'
})
export class MbiDataService {
  private preguntas: MBIQuestion[] = [
    { numero: 1, texto: 'Me siento emocionalmente agotado/a por mi trabajo.', subescala: 'AE' },
    { numero: 2, texto: 'Me siento cansado/a al final de la jornada de trabajo.', subescala: 'AE' },
    { numero: 3, texto: 'Cuando me levanto por la mañana y me enfrento a otra jornada de trabajo me siento fatigado/a.', subescala: 'AE' },
    { numero: 4, texto: 'Tengo facilidad para comprender cómo se sienten las personas con las que trabajo.', subescala: 'RP' },
    { numero: 5, texto: 'Creo que estoy tratando a algunas personas con las que trabajo como si fueran objetos impersonales.', subescala: 'D' },
    { numero: 6, texto: 'Siento que trabajar todo el día con personas supone un gran esfuerzo y me cansa.', subescala: 'AE' },
    { numero: 7, texto: 'Creo que trato con mucha eficacia los problemas de las personas con las que trabajo.', subescala: 'RP' },
    { numero: 8, texto: 'Siento que mi trabajo me está desgastando; me siento quemado/a por mi trabajo.', subescala: 'AE' },
    { numero: 9, texto: 'Creo que con mi trabajo estoy influyendo positivamente en la vida de otras personas.', subescala: 'RP' },
    { numero: 10, texto: 'Me he vuelto más insensible con la gente desde que ejerzo mi trabajo/profesión.', subescala: 'D' },
    { numero: 11, texto: 'Pienso que este trabajo me está endureciendo emocionalmente.', subescala: 'D' },
    { numero: 12, texto: 'Me siento con mucha energía en mi trabajo.', subescala: 'RP' },
    { numero: 13, texto: 'Me siento frustrado/a en mi trabajo.', subescala: 'AE' },
    { numero: 14, texto: 'Creo que trabajo demasiado.', subescala: 'AE' },
    { numero: 15, texto: 'No me preocupa realmente lo que les ocurra a algunas personas con las que trabajo.', subescala: 'D' },
    { numero: 16, texto: 'Trabajar directamente con personas me produce estrés.', subescala: 'AE' },
    { numero: 17, texto: 'Siento que puedo crear con facilidad un clima agradable con las personas con las que trabajo.', subescala: 'RP' },
    { numero: 18, texto: 'Me siento motivado/a después de trabajar en contacto con personas.', subescala: 'RP' },
    { numero: 19, texto: 'Creo que consigo muchas cosas valiosas en este trabajo.', subescala: 'RP' },
    { numero: 20, texto: 'Me siento acabado/a en mi trabajo, al límite de mis posibilidades.', subescala: 'AE' },
    { numero: 21, texto: 'En mi trabajo trato los problemas emocionales con mucha calma.', subescala: 'RP' },
    { numero: 22, texto: 'Creo que las personas con las que trabajo me culpan de algunos de sus problemas.', subescala: 'D' }
  ];

  private opciones: MBIOption[] = [
    { valor: 0, etiqueta: 'Nunca' },
    { valor: 1, etiqueta: 'Pocas veces al año o menos' },
    { valor: 2, etiqueta: 'Una vez al mes o menos' },
    { valor: 3, etiqueta: 'Unas pocas veces al mes' },
    { valor: 4, etiqueta: 'Una vez a la semana' },
    { valor: 5, etiqueta: 'Unas pocas veces a la semana' },
    { valor: 6, etiqueta: 'Todos los días' }
  ];

  constructor() { }

  getPreguntas(): MBIQuestion[] {
    return this.preguntas;
  }

  getOpciones(): MBIOption[] {
    return this.opciones;
  }

  calcularPuntajes(respuestas: number[]): {
    ae: number;
    d: number;
    rp: number;
    aeCategoria: string;
    dCategoria: string;
    rpCategoria: string;
    aeAlto: boolean;
    dAlto: boolean;
    rpBajo: boolean;
    indiciosBurnout: number;
    resultadoGlobal: string;
  } {
    // Items por subescala (índices 0-based)
    const aeItems = [0, 1, 2, 5, 7, 12, 13, 15, 19]; // Items 1,2,3,6,8,13,14,16,20
    const dItems = [4, 9, 10, 14, 21]; // Items 5,10,11,15,22
    const rpItems = [3, 6, 8, 11, 16, 17, 18, 20]; // Items 4,7,9,12,17,18,19,21

    // Calcular puntajes
    const ae = aeItems.reduce((sum, idx) => sum + (respuestas[idx] || 0), 0);
    const d = dItems.reduce((sum, idx) => sum + (respuestas[idx] || 0), 0);
    const rp = rpItems.reduce((sum, idx) => sum + (respuestas[idx] || 0), 0);

    // Categorizar según baremos
    let aeCategoria: string;
    let aeAlto = false;
    if (ae <= 18) {
      aeCategoria = 'Bajo';
    } else if (ae <= 26) {
      aeCategoria = 'Medio';
    } else {
      aeCategoria = 'Alto';
      aeAlto = true;
    }

    let dCategoria: string;
    let dAlto = false;
    if (d <= 5) {
      dCategoria = 'Bajo';
    } else if (d <= 9) {
      dCategoria = 'Medio';
    } else {
      dCategoria = 'Alto';
      dAlto = true;
    }

    let rpCategoria: string;
    let rpBajo = false;
    if (rp <= 33) {
      rpCategoria = 'Bajo';
      rpBajo = true;
    } else if (rp <= 39) {
      rpCategoria = 'Medio';
    } else {
      rpCategoria = 'Alto';
    }

    // Contar indicios de burnout
    let indiciosBurnout = 0;
    if (aeAlto) indiciosBurnout++;
    if (dAlto) indiciosBurnout++;
    if (rpBajo) indiciosBurnout++;

    // Resultado global
    let resultadoGlobal: string;
    if (indiciosBurnout === 3) {
      resultadoGlobal = 'Presencia de síndrome de burnout: se recomienda intervención profesional';
    } else if (indiciosBurnout >= 1) {
      resultadoGlobal = 'Riesgo bajo o parcial: revisar dimensión afectada';
    } else {
      resultadoGlobal = 'Sin indicios de burnout: perfil favorable';
    }

    return {
      ae,
      d,
      rp,
      aeCategoria,
      dCategoria,
      rpCategoria,
      aeAlto,
      dAlto,
      rpBajo,
      indiciosBurnout,
      resultadoGlobal
    };
  }

  interpretarResultado(puntajes: any): string {
    const { ae, aeCategoria, d, dCategoria, rp, rpCategoria, resultadoGlobal } = puntajes;
    
    let interpretacion = `Se administró el MBI (Maslach Burnout Inventory) de 22 ítems con escala 0-6.\n\n`;
    interpretacion += `RESULTADOS POR DIMENSIÓN:\n\n`;
    interpretacion += `• Agotamiento Emocional (AE): ${ae} puntos - Nivel ${aeCategoria}\n`;
    interpretacion += `  ${aeCategoria === 'Bajo' ? 'Baja frecuencia de indicadores de agotamiento emocional.' : 
                          aeCategoria === 'Medio' ? 'Nivel moderado de agotamiento emocional.' :
                          'Alta frecuencia de indicadores de agotamiento emocional. Requiere atención.'}\n\n`;
    
    interpretacion += `• Despersonalización (D): ${d} puntos - Nivel ${dCategoria}\n`;
    interpretacion += `  ${dCategoria === 'Bajo' ? 'Baja frecuencia de indicadores de despersonalización.' :
                          dCategoria === 'Medio' ? 'Nivel moderado de despersonalización.' :
                          'Alta frecuencia de indicadores de despersonalización. Requiere atención.'}\n\n`;
    
    interpretacion += `• Realización Personal (RP): ${rp} puntos - Nivel ${rpCategoria}\n`;
    interpretacion += `  ${rpCategoria === 'Bajo' ? 'Baja percepción de eficacia y logro personal. Es un indicador crítico de burnout.' :
                          rpCategoria === 'Medio' ? 'Nivel moderado de realización personal.' :
                          'Alta percepción de eficacia, logro y realización personal en el trabajo.'}\n\n`;
    
    interpretacion += `RESULTADO GLOBAL: ${resultadoGlobal}\n\n`;
    interpretacion += `Nota: Estos resultados deben interpretarse como screening de desgaste laboral y no como diagnóstico clínico aislado. `;
    interpretacion += `Se recomienda integrar con entrevista clínica y contexto laboral del evaluado.`;
    
    return interpretacion;
  }
}
