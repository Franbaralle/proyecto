import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CopsoqDataService } from '../../services/copsoq-data.service';
import { CopsoqSubmissionService } from '../../services/copsoq-submission.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';

@Component({
  selector: 'app-copsoq',
  templateUrl: './copsoq.component.html',
  styleUrls: ['./copsoq.component.css']
})
export class CopsoqComponent implements OnInit {
  respuestas: number[] = Array(30).fill(-1);
  pacienteNombre = '';
  pacienteEdad?: number;
  pacienteArea = '';
  pacienteAntiguedad = '';
  pacienteObservaciones = '';
  profesionalNombre = '';
  profesionalMatricula = '';

  isSubmitting = false;
  submitMessage = '';
  submitError = '';
  
  mostrarResultados = false;
  resultados: any = null;
  interpretacion = '';

  // Agrupación de preguntas por dimensión para mostrar
  preguntasPorDimension: { [key: string]: any[] } = {};

  constructor(
    public readonly copsoqData: CopsoqDataService,
    private readonly submissionService: CopsoqSubmissionService,
    private readonly authService: ReportesAuthService,
    public readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.agruparPreguntasPorDimension();
  }

  private agruparPreguntasPorDimension(): void {
    const preguntas = this.copsoqData.getPreguntas();
    this.preguntasPorDimension = {};
    
    preguntas.forEach(pregunta => {
      if (!this.preguntasPorDimension[pregunta.dimension]) {
        this.preguntasPorDimension[pregunta.dimension] = [];
      }
      this.preguntasPorDimension[pregunta.dimension].push(pregunta);
    });
  }

  get dimensiones() {
    return Object.keys(this.preguntasPorDimension);
  }

  get opciones() {
    return this.copsoqData.getOpciones();
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

    this.resultados = this.copsoqData.calcularPuntajes(this.respuestas);
    this.interpretacion = this.copsoqData.interpretarResultado(this.resultados);
    this.mostrarResultados = true;
    this.submitMessage = '';
    this.submitError = '';

    // Preparar datos para guardar
    this.submissionService.setPaciente({
      nombre: this.pacienteNombre,
      edad: this.pacienteEdad,
      area: this.pacienteArea,
      antiguedad: this.pacienteAntiguedad,
      observaciones: this.pacienteObservaciones
    });

    this.submissionService.setProfesional({
      nombre: this.profesionalNombre,
      matricula: this.profesionalMatricula
    });

    this.submissionService.setRespuestas(this.respuestas);
    this.submissionService.setResultados(this.resultados);
  }

  async guardarResultado(): Promise<void> {
    if (!this.mostrarResultados || !this.resultados) {
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
    this.respuestas = Array(30).fill(-1);
    this.pacienteNombre = '';
    this.pacienteEdad = undefined;
    this.pacienteArea = '';
    this.pacienteAntiguedad = '';
    this.pacienteObservaciones = '';
    this.profesionalNombre = '';
    this.profesionalMatricula = '';
    this.mostrarResultados = false;
    this.resultados = null;
    this.interpretacion = '';
    this.submitMessage = '';
    this.submitError = '';
    this.submissionService.reset();
  }

  getBadgeClass(color: string): string {
    if (color === 'verde') return 'badge-success';
    if (color === 'amarillo') return 'badge-warning';
    if (color === 'rojo') return 'badge-danger';
    return '';
  }

  getDimensionIcon(dimension: string): string {
    const icons: { [key: string]: string } = {
      'Exigencias en el trabajo': '⚡',
      'Doble presencia': '👔',
      'Organización del trabajo': '📋',
      'Relaciones interpersonales': '👥',
      'Inestabilidad en el trabajo': '⚠️',
      'Confianza': '🤝',
      'Justicia laboral': '⚖️'
    };
    return icons[dimension] || '📊';
  }

  getDimensionClass(dimension: string): string {
    return 'dimension-' + dimension.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (m) => {
      const map: { [key: string]: string } = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
      return map[m] || m;
    });
  }
}
