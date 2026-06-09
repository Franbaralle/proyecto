import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BdiDataService } from '../../services/bdi-data.service';
import { BdiSubmissionService } from '../../services/bdi-submission.service';
import { BaiDataService } from '../../services/bai-data.service';
import { BaiSubmissionService } from '../../services/bai-submission.service';
import { IhlDataService } from '../../services/ihl-data.service';
import { IhlSubmissionService } from '../../services/ihl-submission.service';
import { PendingResultsService } from '../../services/pending-results.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';
import { PacienteProfile, PacienteProfileService } from '../../services/paciente-profile.service';

export interface TestCard {
  id: string;
  nombre: string;
  descripcion: string;
  ruta: string;
  yaCompletado: boolean;
  pendienteLocal: boolean;
  cargando: boolean;
}

@Component({
  selector: 'app-seleccion-test',
  templateUrl: './seleccion-test.component.html',
  styleUrls: ['./seleccion-test.component.css']
})
export class SeleccionTestComponent implements OnInit {
  private readonly allTests: TestCard[] = [
    {
      id: 'BDI-II',
      nombre: 'Inventario de Depresión de Beck (BDI-II)',
      descripcion: 'Evalúa la presencia y severidad de síntomas depresivos en adultos. Consta de 21 ítems.',
      ruta: '/inventario',
      yaCompletado: false,
      pendienteLocal: false,
      cargando: true
    },
    {
      id: 'BAI',
      nombre: 'Inventario de Ansiedad de Beck (BAI)',
      descripcion: 'Evalúa la presencia y severidad de síntomas de ansiedad en adultos. Consta de 21 ítems.',
      ruta: '/ansiedad',
      yaCompletado: false,
      pendienteLocal: false,
      cargando: true
    },
    {
      id: 'IHL',
      nombre: 'Inventario de Hostigamiento Laboral (IHL)',
      descripcion: 'Evalúa la presencia de hostigamiento psicológico o moral en el ámbito laboral.',
      ruta: '/ihl',
      yaCompletado: false,
      pendienteLocal: false,
      cargando: true
    },
    {
      id: 'MBI',
      nombre: 'Inventario de Burnout de Maslach (MBI)',
      descripcion: 'Evalúa el síndrome de burnout o desgaste laboral en profesionales. Consta de 22 ítems.',
      ruta: '/mbi',
      yaCompletado: false,
      pendienteLocal: false,
      cargando: true
    },
    {
      id: 'COPSOQ-ARG',
      nombre: 'COPSOQ-ARG - Riesgos Psicosociales',
      descripcion: 'Evalúa factores de riesgo psicosocial en el trabajo. Versión breve con 30 preguntas.',
      ruta: '/copsoq',
      yaCompletado: false,
      pendienteLocal: false,
      cargando: true
    }
  ];

  tests: TestCard[] = this.allTests.map((t) => ({ ...t }));
  patientProfile: PacienteProfile | null = null;
  isLoadingProfile = false;
  isSubmittingAll = false;
  submitAllError = '';
  submitAllSuccess = '';

  mostrarConsentimiento = false;
  private testPendienteTras: TestCard | null = null;

  private get consentKey(): string {
    const uid = this.patientAuth.currentUid ?? 'anon';
    return `consent_aceptado_${uid}`;
  }

  private consentAceptado(): boolean {
    return localStorage.getItem(this.consentKey) === '1';
  }

  get isFirebasePatient(): boolean {
    return this.patientAuth.isLoggedIn;
  }

  get noTestsEnabled(): boolean {
    return this.patientProfile !== null && this.patientProfile.testsHabilitados.length === 0;
  }

  get psicologoNombre(): string {
    return this.patientProfile?.psicologoNombre ?? '';
  }

  /** Todos los tests están completados (local o Firestore) y al menos uno está pendiente de envío */
  get todosListosParaEnviar(): boolean {
    if (this.tests.length === 0) { return false; }
    const todosCompletos = this.tests.every((t) => t.pendienteLocal || t.yaCompletado);
    const hayPendientes = this.tests.some((t) => t.pendienteLocal);
    return todosCompletos && hayPendientes;
  }

  constructor(
    private readonly bdiData: BdiDataService,
    private readonly baiData: BaiDataService,
    private readonly submissionService: BdiSubmissionService,
    private readonly baiSubmissionService: BaiSubmissionService,
    private readonly ihlData: IhlDataService,
    private readonly ihlSubmissionService: IhlSubmissionService,
    private readonly pendingService: PendingResultsService,
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly profileService: PacienteProfileService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.patientAuth.isLoggedIn && this.patientAuth.currentUid) {
      void this.loadPatientProfile();
    } else {
      void this.checkCompletados();
    }
  }

  private async loadPatientProfile(): Promise<void> {
    this.isLoadingProfile = true;
    try {
      const profile = await this.profileService.getProfile(this.patientAuth.currentUid!);
      if (profile) {
        this.patientProfile = profile;
        this.bdiData.patient = {
          nombreApellidos: profile.nombreApellidos,
          estadoCivil: profile.estadoCivil,
          edad: profile.edad,
          sexo: profile.sexo,
          ocupacion: profile.ocupacion,
          educacion: profile.educacion,
          fecha: new Date().toLocaleDateString('es-AR'),
          email: profile.email
        };
        this.bdiData.professional.profesional = profile.psicologoNombre;
        this.bdiData.professional.email = profile.psicologoEmail;
        this.bdiData.saveSession();

        this.baiData.patient = { ...this.bdiData.patient };
        this.baiData.professional.profesional = profile.psicologoNombre;
        this.baiData.professional.email = profile.psicologoEmail;
        this.baiData.saveSession();

        this.ihlData.patient = { ...this.bdiData.patient };
        this.ihlData.professional.profesional = profile.psicologoNombre;
        this.ihlData.professional.email = profile.psicologoEmail;
        this.ihlData.saveSession();

        this.tests = this.allTests
          .map((t) => ({ ...t }))
          .filter((t) => profile.testsHabilitados.includes(t.id));
      }
    } finally {
      this.isLoadingProfile = false;
      await this.checkCompletados();
    }
  }

  private async checkCompletados(): Promise<void> {
    const patientName = this.bdiData.patient.nombreApellidos;
    const patientEmail = this.authService.currentEmail
      ?? this.patientAuth.currentEmail
      ?? this.bdiData.patient.email;

    for (const test of this.tests) {
      try {
        test.pendienteLocal = this.pendingService.isPending(test.id);
        // yaCompletado = ya enviado a Firestore (no solo pendiente local)
        let alreadySent = false;
        if (!test.pendienteLocal) {
          if (test.id === 'BDI-II') {
            alreadySent = await this.submissionService.hasCurrentAttempt(patientName, test.id, patientEmail);
          } else if (test.id === 'BAI') {
            alreadySent = await this.baiSubmissionService.hasCurrentAttempt(patientName, test.id, patientEmail);
          } else if (test.id === 'IHL') {
            alreadySent = await this.ihlSubmissionService.hasCurrentAttempt(patientName, test.id, patientEmail);
          }
        }
        test.yaCompletado = !test.pendienteLocal && alreadySent;
      } catch {
        test.yaCompletado = false;
        test.pendienteLocal = false;
      } finally {
        test.cargando = false;
      }
    }
  }

  async enviarResultados(): Promise<void> {
    this.isSubmittingAll = true;
    this.submitAllError = '';
    this.submitAllSuccess = '';

    try {
      for (const test of this.tests) {
        if (!test.pendienteLocal) { continue; }
        if (test.id === 'BDI-II') {
          await this.submissionService.submitCurrentResult();
          this.bdiData.clearSession();
        } else if (test.id === 'BAI') {
          await this.baiSubmissionService.submitCurrentResult();
          this.baiData.clearSession();
        } else if (test.id === 'IHL') {
          await this.ihlSubmissionService.submitCurrentResult();
          this.ihlData.clearSession();
        }
        this.pendingService.clearPending(test.id);
        test.pendienteLocal = false;
        test.yaCompletado = true;
      }
      this.submitAllSuccess = 'Resultados enviados correctamente. Tu psic\u00f3logo ya puede verlos.';
    } catch (error: unknown) {
      this.submitAllError = error instanceof Error ? error.message : 'No se pudieron enviar los resultados.';
    } finally {
      this.isSubmittingAll = false;
    }
  }

  irAlTest(test: TestCard): void {
    if (test.yaCompletado) {
      return;
    }
    if (this.patientAuth.isLoggedIn && !this.consentAceptado()) {
      this.testPendienteTras = test;
      this.mostrarConsentimiento = true;
      return;
    }
    this.router.navigate([test.ruta]);
  }

  aceptarConsentimiento(): void {
    localStorage.setItem(this.consentKey, '1');
    this.mostrarConsentimiento = false;
    if (this.testPendienteTras) {
      this.router.navigate([this.testPendienteTras.ruta]);
      this.testPendienteTras = null;
    }
  }

  rechazarConsentimiento(): void {
    this.mostrarConsentimiento = false;
    this.testPendienteTras = null;
  }

  async cerrarSesion(): Promise<void> {
    await this.patientAuth.logout();
    this.router.navigate(['/acceso-reportes']);
  }
}
