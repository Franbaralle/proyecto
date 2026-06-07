import { Injectable } from '@angular/core';

export interface PatientData {
  nombreApellidos: string;
  estadoCivil: string;
  edad: number | null;
  sexo: string;
  ocupacion: string;
  educacion: string;
  fecha: string;
  email: string;
}

export interface ProfessionalData {
  profesional: string;
  matricula: string;
  domicilio: string;
  email: string;
  telefono: string;
}

export interface TriangulationDetail {
  regla: string;
  evidencia: string;
  detectado: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class BdiDataService {
  private readonly SESSION_KEY = 'bdi_session_data';

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

  responses: number[] = Array(21).fill(-1);

  constructor() {
    this.loadSession();
  }

  saveSession(): void {
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        patient: this.patient,
        professional: this.professional,
        responses: this.responses
      }));
    } catch { /* sessionStorage no disponible */ }
  }

  clearSession(): void {
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch { /* sessionStorage no disponible */ }
  }

  private loadSession(): void {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) { return; }
      const saved = JSON.parse(raw) as { patient?: PatientData; professional?: ProfessionalData; responses?: number[] };
      if (saved.patient) { this.patient = saved.patient; }
      if (saved.professional) { this.professional = saved.professional; }
      if (Array.isArray(saved.responses) && saved.responses.length === 21) {
        this.responses = saved.responses;
      }
    } catch { /* JSON inválido o sessionStorage no disponible */ }
  }

  private readonly specialScoring: Record<number, number[]> = {
    15: [0, 1, 1, 2, 2, 3, 3],
    17: [0, 1, 1, 2, 2, 3, 3]
  };

  updateResponse(groupIndex: number, optionIndex: number): void {
    this.responses[groupIndex] = optionIndex;
  }

  get unansweredCount(): number {
    return this.responses.filter((value) => value < 0).length;
  }

  private responseScore(groupIndex: number): number {
    const selected = this.responses[groupIndex];

    if (selected < 0) {
      return 0;
    }

    const mappedScores = this.specialScoring[groupIndex];
    if (mappedScores) {
      return mappedScores[selected] ?? 0;
    }

    return selected;
  }

  get totalScore(): number {
    return this.responses.reduce((acc, _value, index) => acc + this.responseScore(index), 0);
  }

  depressionLevelFromScore(score: number): string {
    if (score <= 13) {
      return 'DEPRESIÓN MÍNIMA';
    }

    if (score <= 19) {
      return 'DEPRESIÓN LEVE';
    }

    if (score <= 28) {
      return 'DEPRESIÓN MODERADA';
    }

    return 'DEPRESIÓN GRAVE';
  }

  get depressionLevel(): string {
    return this.depressionLevelFromScore(this.totalScore);
  }

  formatDateToDisplay(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const parts = dateValue.split('-');
    if (parts.length !== 3) {
      return dateValue;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  fillDemoData(): void {
    this.patient = {
      nombreApellidos: 'Nombre de ejemplo',
      estadoCivil: 'Soltero/a',
      edad: 30,
      sexo: 'Femenino',
      ocupacion: 'Desempleada',
      educacion: 'Universitaria incompleta',
      fecha: '2025-08-28',
      email: 'ejemplo@demo.com'
    };

    this.professional = {
      profesional: 'Lic. Diego Castillo',
      matricula: 'N° 2669',
      domicilio: 'Consultorios Alba - Av. Argentina 480 P5 Neuquén',
      email: 'diegoacastillopsi@gmail.com',
      telefono: '2984681206'
    };
  }

  getTriangulationDetails(): TriangulationDetail[] {
    const hopelessnessScore = this.responseScore(1);
    const guiltScore = this.responseScore(4);
    const suicidalScore = this.responseScore(8);
    const energyScore = this.responseScore(14);
    const sleepScore = this.responseScore(15);
    const appetiteScore = this.responseScore(17);
    const concentrationScore = this.responseScore(18);
    const fatigueScore = this.responseScore(19);

    return [
      {
        regla: 'Riesgo suicida',
        evidencia: `Ítem 9 (pensamientos suicidas) = ${suicidalScore}`,
        detectado: suicidalScore >= 1
      },
      {
        regla: 'Desesperanza + culpa',
        evidencia: `Pesimismo (ítem 2) = ${hopelessnessScore}, Culpa (ítem 5) = ${guiltScore}`,
        detectado: hopelessnessScore >= 2 && guiltScore >= 2
      },
      {
        regla: 'Incoherencia energía/fatiga',
        evidencia: `Energía (ítem 15) = ${energyScore}, Fatiga (ítem 20) = ${fatigueScore}`,
        detectado: fatigueScore >= 2 && energyScore === 0
      },
      {
        regla: 'Incoherencia sueño/fatiga',
        evidencia: `Sueño (ítem 16) = ${sleepScore}, Fatiga (ítem 20) = ${fatigueScore}`,
        detectado: sleepScore === 0 && fatigueScore >= 2
      },
      {
        regla: 'Síntomas somáticos combinados',
        evidencia: `Sueño (ítem 16) = ${sleepScore}, Apetito (ítem 18) = ${appetiteScore}, Fatiga (ítem 20) = ${fatigueScore}`,
        detectado: sleepScore >= 2 && appetiteScore >= 2 && fatigueScore >= 2
      },
      {
        regla: 'Carga cognitiva alta',
        evidencia: `Pesimismo (ítem 2) = ${hopelessnessScore}, Concentración (ítem 19) = ${concentrationScore}`,
        detectado: hopelessnessScore >= 2 && concentrationScore >= 2
      }
    ];
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

  get canSubmitResult(): boolean {
    return this.isPatientDataComplete && this.isProfessionalDataComplete && this.isQuestionnaireComplete;
  }
}