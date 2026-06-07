import { Injectable } from '@angular/core';
import { PatientData, ProfessionalData } from './bdi-data.service';

export const BAI_ITEMS: string[] = [
  'Torpe o entumecido',
  'Acalorado',
  'Con temblor en las piernas',
  'Incapaz de relajarse',
  'Con temor a que ocurra lo peor',
  'Mareado, o que se le va la cabeza',
  'Con latidos del corazón fuertes y acelerados',
  'Inestable',
  'Atemorizado o asustado',
  'Nervioso',
  'Con sensación de bloqueo',
  'Con temblores en las manos',
  'Inquieto, inseguro',
  'Con miedo a perder el control',
  'Con sensación de ahogo',
  'Con temor a morir',
  'Con miedo',
  'Con problemas digestivos',
  'Con desvanecimientos',
  'Con rubor facial',
  'Con sudores, fríos o calientes'
];

@Injectable({
  providedIn: 'root'
})
export class BaiDataService {
  private readonly SESSION_KEY = 'bai_session_data';

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

  get totalScore(): number {
    return this.responses.reduce((acc, val) => acc + (val >= 0 ? val : 0), 0);
  }

  anxietyLevelFromScore(score: number): string {
    if (score <= 7)  { return 'ANSIEDAD MÍNIMA'; }
    if (score <= 15) { return 'ANSIEDAD LEVE'; }
    if (score <= 25) { return 'ANSIEDAD MODERADA'; }
    return 'ANSIEDAD GRAVE';
  }

  get anxietyLevel(): string {
    return this.anxietyLevelFromScore(this.totalScore);
  }

  get unansweredCount(): number {
    return this.responses.filter((v) => v < 0).length;
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
    return this.responses.every((v) => v >= 0);
  }

  get canSubmitResult(): boolean {
    return this.isPatientDataComplete && this.isProfessionalDataComplete && this.isQuestionnaireComplete;
  }
}
