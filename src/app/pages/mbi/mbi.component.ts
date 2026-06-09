import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MbiDataService } from '../../services/mbi-data.service';
import { MbiSubmissionService } from '../../services/mbi-submission.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-mbi',
  templateUrl: './mbi.component.html',
  styleUrls: ['./mbi.component.css']
})
export class MbiComponent implements OnInit {
  respuestas: number[] = Array(22).fill(-1);
  pacienteNombre = '';
  pacienteEdad?: number;
  pacienteArea = '';
  pacienteObservaciones = '';
  profesionalNombre = '';
  profesionalMatricula = '';

  isSubmitting = false;
  submitMessage = '';
  submitError = '';
  
  mostrarResultados = false;
  puntajes: any = null;
  interpretacion = '';

  constructor(
    public readonly mbiData: MbiDataService,
    private readonly submissionService: MbiSubmissionService,
    private readonly authService: ReportesAuthService,
    public readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // Inicializar
  }

  get preguntas() {
    return this.mbiData.getPreguntas();
  }

  get opciones() {
    return this.mbiData.getOpciones();
  }

  selectOption(itemIndex: number, value: number): void {
    this.respuestas[itemIndex] = value;
    this.submitMessage = '';
    this.submitError = '';
  }

  volverATests(): void {
    this.router.navigate(['/seleccion-test']);
  }

  get isDiegoSession(): boolean {
    return this.authService.isDiegoSession;
  }

  get isAuthorized(): boolean {
    return this.authService.isAuthorized;
  }

  get isPacienteDataComplete(): boolean {
    return this.pacienteNombre.trim().length > 0;
  }

  get isProfesionalDataComplete(): boolean {
    return this.profesionalNombre.trim().length > 0;
  }

  get isQuestionnaireComplete(): boolean {
    return this.respuestas.every(r => r >= 0);
  }

  get canCalculate(): boolean {
    if (this.patientAuth.isLoggedIn) {
      return this.isPacienteDataComplete && this.isQuestionnaireComplete;
    }
    return this.isPacienteDataComplete && this.isProfesionalDataComplete && this.isQuestionnaireComplete;
  }

  calcularResultado(): void {
    if (!this.canCalculate) {
      this.submitError = 'Debe completar todos los datos requeridos y responder todas las preguntas.';
      return;
    }

    this.puntajes = this.mbiData.calcularPuntajes(this.respuestas);
    this.interpretacion = this.mbiData.interpretarResultado(this.puntajes);
    this.mostrarResultados = true;
    this.submitMessage = '';
    this.submitError = '';

    // Preparar datos para guardar
    this.submissionService.setPaciente({
      nombre: this.pacienteNombre,
      edad: this.pacienteEdad,
      area: this.pacienteArea,
      observaciones: this.pacienteObservaciones
    });

    this.submissionService.setProfesional({
      nombre: this.profesionalNombre,
      matricula: this.profesionalMatricula
    });

    this.submissionService.setRespuestas(this.respuestas);
    this.submissionService.setPuntajes(this.puntajes);
  }

  async guardarResultado(): Promise<void> {
    if (!this.mostrarResultados || !this.puntajes) {
      this.submitError = 'Debe calcular el resultado antes de guardar.';
      return;
    }

    const confirmacion = confirm('¿Desea guardar este resultado en Firebase?');
    if (!confirmacion) {
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';
    this.submitError = '';

    try {
      await this.submissionService.submitCurrentResult();
      this.submitMessage = 'Resultados guardados correctamente en Firebase.';
      
      // Limpiar formulario después de 2 segundos
      setTimeout(() => {
        this.limpiarFormulario();
      }, 2000);
    } catch (error: unknown) {
      this.submitError = error instanceof Error ? error.message : 'No se pudo guardar el resultado.';
    } finally {
      this.isSubmitting = false;
    }
  }

  limpiarFormulario(): void {
    this.respuestas = Array(22).fill(-1);
    this.pacienteNombre = '';
    this.pacienteEdad = undefined;
    this.pacienteArea = '';
    this.pacienteObservaciones = '';
    this.profesionalNombre = '';
    this.profesionalMatricula = '';
    this.mostrarResultados = false;
    this.puntajes = null;
    this.interpretacion = '';
    this.submitMessage = '';
    this.submitError = '';
    this.submissionService.reset();
  }

  getBadgeClass(categoria: string): string {
    if (categoria === 'Bajo') return 'badge-success';
    if (categoria === 'Medio') return 'badge-warning';
    if (categoria === 'Alto') return 'badge-danger';
    return '';
  }
}
