import { Injectable } from '@angular/core';
import { PatientData, ProfessionalData } from './bdi-data.service';

// Preguntas con esquema especial de puntaje de frecuencia (en base 1)
export const SPECIAL_FREQUENCY_QUESTIONS = [10, 24, 11, 21, 43, 52, 20];

export interface IhlPartBAnswers {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  q5: number;
  q5Reason: string;
  q6: number;
  q6Explanation: string;
  q7: number[];
  q8: number;
  q9: number;
  q10: number;
  q11a: number;
  q11b: number;
  q11c: number;
  q11d: number;
  q11e: number;
  q11f: number;
}

@Injectable({
  providedIn: 'root'
})
export class IhlDataService {
  private readonly SESSION_KEY = 'ihl_session_data';

  patient: PatientData = {
    nombreApellidos: '',
    estadoCivil: '',
    edad: null,
    sexo: '',
    ocupacion: '',
    educacion: '',
    fecha: '',
    email: ''
  };

  professional: ProfessionalData = {
    profesional: '',
    matricula: '',
    domicilio: '',
    email: '',
    telefono: ''
  };

  private readonly ITEM_COUNT = 63;
  // Preguntas con puntaje especial de frecuencia (en base 1)
  private readonly SPECIAL_FREQUENCY_QUESTIONS = [10, 24, 11, 21, 43, 52, 20];
  
  responses: number[] = Array(this.ITEM_COUNT * 2).fill(-1);
  partB: IhlPartBAnswers = {
    q1: -1,
    q2: -1,
    q3: -1,
    q4: -1,
    q5: -1,
    q5Reason: '',
    q6: -1,
    q6Explanation: '',
    q7: [],
    q8: -1,
    q9: -1,
    q10: -1,
    q11a: -1,
    q11b: -1,
    q11c: -1,
    q11d: -1,
    q11e: -1,
    q11f: -1
  };

  constructor() {
    this.loadSession();
  }

  saveSession(): void {
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        patient: this.patient,
        professional: this.professional,
        responses: this.responses,
        partB: this.partB
      }));
    } catch {
      // sessionStorage no disponible
    }
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch {
      // sessionStorage no disponible
    }

    this.partB = {
      q1: -1,
      q2: -1,
      q3: -1,
      q4: -1,
      q5: -1,
      q5Reason: '',
      q6: -1,
      q6Explanation: '',
      q7: [],
      q8: -1,
      q9: -1,
      q10: -1,
      q11a: -1,
      q11b: -1,
      q11c: -1,
      q11d: -1,
      q11e: -1,
      q11f: -1
    };
  }

  private loadSession(): void {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) { return; }
      const saved = JSON.parse(raw) as { patient?: PatientData; professional?: ProfessionalData; responses?: number[]; partB?: IhlPartBAnswers };
      if (saved.patient) { this.patient = saved.patient; }
      if (saved.professional) { this.professional = saved.professional; }
      if (Array.isArray(saved.responses) && saved.responses.length === this.ITEM_COUNT * 2) {
        this.responses = saved.responses;
      }
      if (saved.partB) { this.partB = saved.partB; }
    } catch {
      // JSON inválido o sessionStorage no disponible
    }
  }

  get unansweredCount(): number {
    return this.responses.filter((value) => value < 0).length;
  }

  /**
   * Verifica si una pregunta usa el esquema de puntaje especial
   * @param itemIndex Índice de la pregunta (base 0)
   */
  private isSpecialFrequencyQuestion(itemIndex: number): boolean {
    const questionNumber = itemIndex + 1; // Convertir a base 1
    return this.SPECIAL_FREQUENCY_QUESTIONS.includes(questionNumber);
  }

  /**
   * Calcula el puntaje de frecuencia para una pregunta
   * @param storedValue Valor guardado (ya invertido: 4 - uiIndex)
   * @param itemIndex Índice de la pregunta (base 0)
   */
  private getFrequencyScore(storedValue: number, itemIndex: number): number {
    if (storedValue < 0) return 0;
    
    if (this.isSpecialFrequencyQuestion(itemIndex)) {
      // Puntaje especial: Todos los días (4) o Algunas veces a la semana (3) = 4 puntos
      // Algunas veces al mes (2) o Algunas veces al año (1) = 3 puntos
      // Nunca (0) = 0 puntos
      if (storedValue >= 3) return 4; // stored=4 o 3 → uiIndex=0 o 1 → 4 puntos
      if (storedValue >= 1) return 3; // stored=2 o 1 → uiIndex=2 o 3 → 3 puntos
      return 0; // stored=0 → uiIndex=4 → 0 puntos
    }
    
    // Puntaje normal: el valor guardado ya es el puntaje correcto (4-uiIndex)
    return storedValue;
  }

  get totalScore(): number {
    let total = 0;
    
    // Para cada situación: frecuencia × malestar
    for (let i = 0; i < this.ITEM_COUNT; i++) {
      const freqScore = this.getFrequencyScore(this.responses[i], i);
      const discomfortScore = this.responses[this.ITEM_COUNT + i];
      const discomfortPoints = discomfortScore >= 0 ? discomfortScore : 0;
      total += freqScore * discomfortPoints;
    }
    
    return total;
  }

  get isPatientDataComplete(): boolean {
    return Boolean(
      this.patient.nombreApellidos &&
      this.patient.estadoCivil &&
      this.patient.edad &&
      this.patient.sexo &&
      this.patient.ocupacion &&
      this.patient.educacion &&
      this.patient.fecha &&
      this.patient.email
    );
  }

  get isProfessionalDataComplete(): boolean {
    return Boolean(
      this.professional.profesional &&
      this.professional.matricula &&
      this.professional.domicilio &&
      this.professional.email &&
      this.professional.telefono
    );
  }

  get isQuestionnaireComplete(): boolean {
    return this.responses.every((value) => value >= 0);
  }

  get isPartBComplete(): boolean {
    const partB = this.partB;
    if (partB.q1 < 0 || partB.q2 < 0) {
      return false;
    }
    if (partB.q2 === 1) {
      return true;
    }
    const requiredNumbers = [partB.q3, partB.q4, partB.q5, partB.q6, partB.q8, partB.q9, partB.q10, partB.q11a, partB.q11b, partB.q11c, partB.q11d, partB.q11e, partB.q11f];
    return requiredNumbers.every((value) => value >= 0) && partB.q7.length > 0;
  }

  hostigamientoLevelFromScore(score: number): string {
    if (score >= 200) {
      return 'HOSTIGAMIENTO GRAVE';
    }

    if (score >= 130) {
      return 'HOSTIGAMIENTO MODERADO';
    }

    if (score >= 60) {
      return 'HOSTIGAMIENTO LEVE';
    }

    return 'NO HAY HOSTIGAMIENTO';
  }

  get hostigamientoLevel(): string {
    return this.hostigamientoLevelFromScore(this.totalScore);
  }

  get canSubmitResult(): boolean {
    return this.isPatientDataComplete && this.isProfessionalDataComplete && this.isQuestionnaireComplete && this.isPartBComplete;
  }
}
