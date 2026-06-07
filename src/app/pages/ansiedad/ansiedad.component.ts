import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BAI_ITEMS, BaiDataService } from '../../services/bai-data.service';
import { BaiSubmissionService } from '../../services/bai-submission.service';
import { PendingResultsService } from '../../services/pending-results.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-ansiedad',
  templateUrl: './ansiedad.component.html',
  styleUrls: ['./ansiedad.component.css']
})
export class AnsiedadComponent implements OnInit {
  readonly items = BAI_ITEMS;
  readonly opciones = [0, 1, 2, 3];
  readonly opcionLabels = ['En absoluto', 'Levemente', 'Moderadamente', 'Severamente'];

  isSubmitting = false;
  submitMessage = '';
  submitError = '';

  constructor(
    public readonly baiData: BaiDataService,
    private readonly submissionService: BaiSubmissionService,
    private readonly pendingService: PendingResultsService,
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.baiData.responses = Array(21).fill(-1);
    this.baiData.saveSession();
  }

  selectOption(itemIndex: number, value: number): void {
    this.baiData.responses[itemIndex] = value;
    this.baiData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  get isDiegoSession(): boolean {
    return this.authService.isDiegoSession;
  }

  get isAuthorized(): boolean {
    return this.authService.isAuthorized;
  }

  get canSubmit(): boolean {
    if (this.patientAuth.isLoggedIn) {
      return this.baiData.isPatientDataComplete && this.baiData.isQuestionnaireComplete && !this.isSubmitting;
    }

    return this.baiData.canSubmitResult && !this.isSubmitting;
  }

  async submitResult(): Promise<void> {
    this.submitMessage = '';
    this.submitError = '';

    const puedeEnviar = this.patientAuth.isLoggedIn
      ? this.baiData.isPatientDataComplete && this.baiData.isQuestionnaireComplete
      : this.baiData.canSubmitResult;

    if (!puedeEnviar) {
      this.submitError = 'Debe completar todos los datos del paciente y todas las preguntas antes de guardar.';
      return;
    }

    // Pacientes Firebase: guardar localmente y volver a selección
    if (this.patientAuth.isLoggedIn) {
      this.pendingService.markPending('BAI');
      this.router.navigate(['/seleccion-test']);
      return;
    }

    // Sesión de psicólogo: enviar directo a Firestore
    this.isSubmitting = true;
    try {
      await this.submissionService.submitCurrentResult();
      this.baiData.clearSession();
      this.submitMessage = 'Resultados guardados correctamente en Firebase.';
    } catch (error: unknown) {
      this.submitError = error instanceof Error ? error.message : 'No se pudo guardar el resultado.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
