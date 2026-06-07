import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { TriangulationDetail } from '../../services/bdi-data.service';
import { BdiSubmissionService, ReevaluationPermission, StoredBdiResult } from '../../services/bdi-submission.service';
import { ReportesStateService } from '../../services/reportes-state.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { AVAILABLE_TESTS, PacienteProfile, PacienteProfileService, PsicologoProfile } from '../../services/paciente-profile.service';
import { BAI_ITEMS } from '../../services/bai-data.service';

interface BdiSection {
  title: string;
  options: string[];
}

interface StoredAnswerDetail {
  section: string;
  optionText: string;
}

interface PatientRound {
  roundNumber: number;
  results: StoredBdiResult[];
  latestDate: string;
}

interface PatientSummary {
  patientKey: string;
  name: string;
  testTypes: string[];
  latestDate: string;
}

export interface AnalysisItemChange {
  label: string;
  direction: 'mejor' | 'peor';
  levels: number;
}

export interface PatientAnalysis {
  estadoActual: string;
  evolucionBdi: string | null;
  evolucionBai: string | null;
  itemsMejora: AnalysisItemChange[];
  itemsEmpeora: AnalysisItemChange[];
  itemsCompLabel: string;
  triangulacion: TriangulationDetail[];
  recomendacion: string;
  hayRiesgoAlto: boolean;
}

@Component({
  selector: 'app-reportes',
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
    readonly sections: BdiSection[] = [
      { title: 'Tristeza', options: ['No me siento triste.', 'Me siento triste gran parte del tiempo.', 'Me siento triste todo el tiempo.', 'Me siento tan triste o soy tan infeliz que no puedo soportarlo.'] },
      { title: 'Pesimismo', options: ['No estoy desalentado de mi futuro.', 'Me siento más desalentado respecto de mi futuro que lo que solía estarlo.', 'No espero que las cosas funcionen para mí.', 'Siento que no hay esperanza para mi futuro y que sólo puede empeorar.'] },
      { title: 'Fracaso', options: ['No me siento como un fracasado.', 'He fracasado más de lo que hubiera debido.', 'Cuando miro hacia atrás, veo muchos fracasos.', 'Siento que como persona soy un fracaso total.'] },
      { title: 'Pérdida de Placer', options: ['Obtengo tanto placer como siempre por las cosas de las que disfruto.', 'No disfruto tanto de las cosas como solía hacerlo.', 'Obtengo muy poco placer de las cosas que solía disfrutar.', 'No puedo obtener ningún placer de las cosas de las que solía disfrutar.'] },
      { title: 'Sentimientos de Culpa', options: ['No me siento particularmente culpable.', 'Me siento culpable respecto de varias cosas que he hecho o que debería haber hecho.', 'Me siento bastante culpable la mayor parte del tiempo.', 'Me siento culpable todo el tiempo.'] },
      { title: 'Sentimientos de Castigo', options: ['No siento que esté siendo castigado.', 'Siento que tal vez pueda ser castigado.', 'Espero ser castigado.', 'Siento que estoy siendo castigado.'] },
      { title: 'Disconformidad con uno mismo', options: ['Siento acerca de mí lo mismo que siempre.', 'He perdido la confianza en mí mismo.', 'Estoy decepcionado conmigo mismo.', 'No me gusto a mí mismo.'] },
      { title: 'Autocrítica', options: ['No me critico ni me culpo más de lo habitual.', 'Estoy más crítico conmigo mismo de lo que solía estarlo.', 'Me critico a mí mismo por todos mis errores.', 'Me culpo a mí mismo por todo lo malo que sucede.'] },
      { title: 'Pensamientos o Deseos Suicidas', options: ['No tengo ningún pensamiento de matarme.', 'He tenido pensamientos de matarme, pero no lo haría.', 'Querría matarme.', 'Me mataría si tuviera oportunidad de hacerlo.'] },
      { title: 'Llanto', options: ['No lloro más de lo que solía hacerlo.', 'Lloro más de lo que solía hacerlo.', 'Lloro por cualquier pequeñez.', 'Siento ganas de llorar pero no puedo.'] },
      { title: 'Agitación', options: ['No estoy más inquieto o tenso que lo habitual.', 'Me siento más inquieto o tenso que lo habitual.', 'Estoy tan inquieto o agitado que me es difícil quedarme quieto.', 'Estoy tan inquieto o agitado que tengo que estar siempre en movimiento o haciendo algo.'] },
      { title: 'Pérdida de Interés', options: ['No he perdido el interés en otras actividades o personas.', 'Estoy menos interesado que antes en otras personas o cosas.', 'He perdido casi todo el interés en otras personas o cosas.', 'Me es difícil interesarme por algo.'] },
      { title: 'Indecisión', options: ['Tomo mis propias decisiones tan bien como siempre.', 'Me resulta más difícil que de costumbre tomar decisiones.', 'Encuentro mucha más dificultad que antes para tomar decisiones.', 'Tengo problemas para tomar cualquier decisión.'] },
      { title: 'Desvalorización', options: ['No siento que yo no sea valioso.', 'No me considero a mí mismo tan valioso o útil como solía considerarme.', 'Me siento menos valioso cuando me comparo con otros.', 'Siento que no valgo nada.'] },
      { title: 'Pérdida de Energía', options: ['Tengo tanta energía como siempre.', 'Tengo menos energía que la que solía tener.', 'No tengo suficiente energía para hacer demasiado.', 'No tengo energía suficiente para hacer nada.'] },
      { title: 'Cambios en los Hábitos de Sueño', options: ['No he experimentado ningún cambio en mis hábitos de sueño.', 'Duermo un poco más de lo habitual.', 'Duermo un poco menos de lo habitual.', 'Duermo mucho más que lo habitual.', 'Duermo mucho menos que lo habitual.', 'Duermo la mayor parte del día.', 'Me despierto 1-2 horas más temprano y no puedo volver a dormirme.'] },
      { title: 'Irritabilidad', options: ['No estoy tan irritable que lo habitual.', 'Estoy más irritable que lo habitual.', 'Estoy mucho más irritable que lo habitual.', 'Estoy irritable todo el tiempo.'] },
      { title: 'Cambios en el Apetito', options: ['No he experimentado cambios en mi apetito.', 'Mi apetito es un poco menor que lo habitual.', 'Mi apetito es un poco mayor que lo habitual.', 'Mi apetito es mucho menor que antes.', 'Mi apetito es mucho mayor que antes.', 'No tengo apetito en absoluto.', 'Quiero comer todo el día.'] },
      { title: 'Dificultad de Concentración', options: ['Puedo concentrarme tan bien como siempre.', 'No puedo concentrarme tan bien como habitualmente.', 'Me es difícil mantener la mente en algo por mucho tiempo.', 'Encuentro que no puedo concentrarme en nada.'] },
      { title: 'Cansancio o Fatiga', options: ['No estoy más cansado o fatigado que lo habitual.', 'Me fatigo o me canso más fácilmente que lo habitual.', 'Estoy demasiado fatigado o cansado para hacer muchas de las cosas que solía hacer.', 'Estoy demasiado fatigado o cansado para hacer la mayoría de las cosas que solía hacer.'] },
      { title: 'Pérdida de Interés en el Sexo', options: ['No he notado ningún cambio reciente en mi interés por el sexo.', 'Estoy menos interesado en el sexo de lo que solía estarlo.', 'Estoy mucho menos interesado en el sexo.', 'He perdido completamente el interés en el sexo.'] }
    ];

  isSearching = false;
  searchError = '';

  get searchName(): string { return this.state.searchName; }
  set searchName(v: string) { this.state.searchName = v; }

  get searched(): boolean { return this.state.searched; }
  set searched(v: boolean) { this.state.searched = v; }

  get foundResults(): StoredBdiResult[] { return this.state.foundResults; }
  set foundResults(v: StoredBdiResult[]) { this.state.foundResults = v; }

  get selectedResult(): StoredBdiResult | null { return this.state.selectedResult; }
  set selectedResult(v: StoredBdiResult | null) { this.state.selectedResult = v; }

  lineChartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Puntaje BDI-II',
        fill: false,
        tension: 0.45
      }
    ]
  };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true }
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: 63
      }
    }
  };

  isEnablingReevaluation = false;
  reevaluationReason = '';
  reevaluationMessage = '';
  reevaluationError = '';
  reevaluationSelectedTests: Record<string, boolean> = {};
  showReevaluationForm = false;
  myPermissions: ReevaluationPermission[] = [];
  myPermissionsLoading = false;

  psicologoProfile: PsicologoProfile | null = null;
  patientProfile: PacienteProfile | null = null;
  readonly availableTests = AVAILABLE_TESTS;
  selectedTests: Record<string, boolean> = {};
  isSavingTests = false;
  saveTestsSuccess = '';
  saveTestsError = '';
  // Búsqueda directa de cuenta de paciente
  directSearchName = '';
  directSearching = false;
  directSearchResults: PacienteProfile[] = [];
  directSearched = false;
  directSearchError = '';
  directSelectedPatient: PacienteProfile | null = null;
  directSelectedTests: Record<string, boolean> = {};
  isSavingDirectTests = false;
  saveDirectTestsSuccess = '';
  saveDirectTestsError = '';
  get isDiegoSession(): boolean { return this.authService.isDiegoSession; }
  get isAuthorized(): boolean { return this.authService.isAuthorized; }

  get selectedPatientKey(): string | null { return this.state.selectedPatientKey; }
  set selectedPatientKey(v: string | null) { this.state.selectedPatientKey = v; }
  get selectedPatientName(): string { return this.state.selectedPatientName; }
  set selectedPatientName(v: string) { this.state.selectedPatientName = v; }

  constructor(
    private readonly submissionService: BdiSubmissionService,
    private readonly state: ReportesStateService,
    private readonly authService: ReportesAuthService,
    private readonly profileService: PacienteProfileService
  ) {}

  ngOnInit(): void {
    if (this.state.selectedPatientKey) {
      this.rebuildCharts();
    }
    if (this.isAuthorized) {
      void this.loadPsicologoProfile();
    }
  }

  private async loadPsicologoProfile(): Promise<void> {
    try {
      this.psicologoProfile = await this.profileService.getPsicologoByEmail(this.authService.currentEmail);
    } catch {
      this.psicologoProfile = null;
    }
  }

  async searchByPatientName(): Promise<void> {
    this.searchError = '';
    this.searched = true;
    this.selectedResult = null;

    if (!this.searchName.trim()) {
      this.foundResults = [];
      return;
    }

    this.isSearching = true;

    try {
      this.foundResults = await this.submissionService.searchResultsByPatientName(this.searchName);
    } catch (error: unknown) {
      this.searchError = error instanceof Error ? error.message : 'No se pudo realizar la búsqueda.';
      this.foundResults = [];
    } finally {
      this.isSearching = false;
    }
  }

  selectPatient(summary: PatientSummary): void {
    this.selectedPatientKey = summary.patientKey;
    this.selectedPatientName = summary.name;
    this.selectedResult = null;
    this.showReevaluationForm = false;
    this.reevaluationMessage = '';
    this.reevaluationError = '';
    this.reevaluationReason = '';
    this.reevaluationSelectedTests = {};
    this.saveTestsSuccess = '';
    this.saveTestsError = '';
    this.patientProfile = null;
    this.selectedTests = {};
    this.rebuildCharts();
    void this.loadPatientProfile(summary.patientKey);
    void this.loadMyPermissions();
  }

  selectRoundResult(result: StoredBdiResult): void {
    this.selectedResult = result;
    this.showReevaluationForm = false;
    this.reevaluationMessage = '';
    this.reevaluationError = '';
    this.reevaluationReason = '';
  }

  clearPatientSelection(): void {
    this.selectedPatientKey = null;
    this.selectedPatientName = '';
    this.selectedResult = null;
    this.showReevaluationForm = false;
    this.reevaluationMessage = '';
    this.patientProfile = null;
    this.selectedTests = {};
    this.myPermissions = [];
    this.permissionsError = '';
  }

  private async loadPatientProfile(patientKey: string): Promise<void> {
    try {
      this.patientProfile = await this.profileService.getProfileByPatientKey(patientKey);
      if (this.patientProfile) {
        this.availableTests.forEach((t) => {
          this.selectedTests[t.id] = this.patientProfile!.testsHabilitados.includes(t.id);
        });
      }
    } catch {
      this.patientProfile = null;
    }
  }

  async saveTestsHabilitados(): Promise<void> {
    if (!this.patientProfile) { return; }
    this.isSavingTests = true;
    this.saveTestsSuccess = '';
    this.saveTestsError = '';
    try {
      const tests = this.availableTests
        .filter((t) => this.selectedTests[t.id])
        .map((t) => t.id);
      await this.profileService.updateTestsHabilitados(this.patientProfile.uid, tests);
      this.patientProfile.testsHabilitados = tests;
      this.saveTestsSuccess = 'Tests actualizados correctamente.';
    } catch {
      this.saveTestsError = 'No se pudieron guardar los cambios.';
    } finally {
      this.isSavingTests = false;
    }
  }

  async searchDirectPatient(): Promise<void> {
    this.directSearched = true;
    this.directSelectedPatient = null;
    this.directSearchResults = [];
    this.directSearchError = '';
    this.saveDirectTestsSuccess = '';
    this.saveDirectTestsError = '';
    if (!this.directSearchName.trim()) { return; }
    this.directSearching = true;
    try {
      const emailUsado = this.authService.currentEmail;
      console.log('[DEBUG] Buscando pacientes de psicólogo:', JSON.stringify(emailUsado));
      this.directSearchResults = await this.profileService.searchPatientsByName(
        this.directSearchName,
        emailUsado
      );
      console.log('[DEBUG] Resultados:', this.directSearchResults.length, this.directSearchResults);
    } catch (e: unknown) {
      this.directSearchError = e instanceof Error ? e.message : 'Error al buscar.';
      this.directSearchResults = [];
    } finally {
      this.directSearching = false;
    }
  }

  selectDirectPatient(patient: PacienteProfile): void {
    this.directSelectedPatient = patient;
    this.saveDirectTestsSuccess = '';
    this.saveDirectTestsError = '';
    this.availableTests.forEach((t) => {
      this.directSelectedTests[t.id] = patient.testsHabilitados.includes(t.id);
    });
  }

  async saveDirectTestsHabilitados(): Promise<void> {
    if (!this.directSelectedPatient) { return; }
    this.isSavingDirectTests = true;
    this.saveDirectTestsSuccess = '';
    this.saveDirectTestsError = '';
    try {
      const tests = this.availableTests
        .filter((t) => this.directSelectedTests[t.id])
        .map((t) => t.id);
      await this.profileService.updateTestsHabilitados(this.directSelectedPatient.uid, tests);
      this.directSelectedPatient.testsHabilitados = tests;
      this.saveDirectTestsSuccess = 'Tests actualizados correctamente.';
    } catch {
      this.saveDirectTestsError = 'No se pudieron guardar los cambios.';
    } finally {
      this.isSavingDirectTests = false;
    }
  }

  async enableReevaluation(): Promise<void> {
    const selectedTypes = this.testTypesPresent.filter((tt) => this.reevaluationSelectedTests[tt]);
    if (!this.selectedPatientKey || !this.reevaluationReason.trim() || selectedTypes.length === 0) {
      this.reevaluationError = 'Seleccione al menos un test e ingrese un motivo para habilitar la reevaluación.';
      return;
    }

    this.isEnablingReevaluation = true;
    this.reevaluationError = '';

    const patientName = this.selectedPatientName || this.selectedPatientKey || '';

    try {
      for (const tt of selectedTypes) {
        await this.submissionService.enableReevaluation({
          patientName,
          testType: tt,
          enabledBy: this.authService.currentEmail || 'diego',
          reason: this.reevaluationReason.trim()
        });
      }
      const testLabels = selectedTypes
        .map((tt) => tt === 'BDI-II' ? 'Depresión (BDI-II)' : 'Ansiedad (BAI)')
        .join(' y ');
      this.reevaluationMessage = `Reevaluación habilitada para ${patientName} — ${testLabels}. El paciente podrá completar el test nuevamente.`;
      this.showReevaluationForm = false;
      this.reevaluationReason = '';
      this.reevaluationSelectedTests = {};
      void this.loadMyPermissions();
    } catch (error: unknown) {
      this.reevaluationError = error instanceof Error ? error.message : 'No se pudo habilitar la reevaluación.';
    } finally {
      this.isEnablingReevaluation = false;
    }
  }

  permissionsError = '';

  async loadMyPermissions(): Promise<void> {
    if (!this.selectedPatientKey) { return; }
    this.myPermissionsLoading = true;
    this.permissionsError = '';
    try {
      this.myPermissions = await this.submissionService.getPatientReevaluationPermissions(this.selectedPatientKey);
    } catch (err) {
      this.myPermissions = [];
      this.permissionsError = err instanceof Error ? err.message : 'Error al cargar reevaluaciones.';
    } finally {
      this.myPermissionsLoading = false;
    }
  }

  formatStoredDate(dateValue: string): string {
    if (!dateValue) {
      return '-';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString('es-AR');
  }

  get storedDetectedRules(): TriangulationDetail[] {
    return (this.selectedResult?.triangulacion || []).filter((item) => item.detectado);
  }

  get storedSummaryText(): string {
    if (!this.selectedResult) {
      return '';
    }

    const attempts = this.selectedPatientAttempts;
    const patientName = this.selectedResult.paciente?.nombreApellidos || 'Paciente';

    if (attempts.length <= 1) {
      const score = this.selectedResult.puntajeTotal;
      const level = this.selectedResult.nivelDepresion;
      if (this.storedDetectedRules.length === 0) {
        return `${patientName}: puntaje ${score} (${level}). Triangulación: no se detectaron patrones relevantes.`;
      }
      const rulesText = this.storedDetectedRules.map((r) => r.regla).join(', ');
      return `${patientName}: puntaje ${score} (${level}). Triangulación detectada: ${rulesText}.`;
    }

    // Comparativo: múltiples intentos
    const scoreList = attempts.map((a, i) => `Intento ${i + 1}: ${a.puntajeTotal} (${a.nivelDepresion})`).join(' → ');
    const first = attempts[0];
    const last = attempts[attempts.length - 1];
    const delta = last.puntajeTotal - first.puntajeTotal;
    let tendencia: string;
    if (delta < -4) {
      tendencia = `Tendencia de mejoría significativa (−${Math.abs(delta)} puntos desde el primer intento).`;
    } else if (delta < 0) {
      tendencia = `Leve mejoría (−${Math.abs(delta)} puntos desde el primer intento).`;
    } else if (delta === 0) {
      tendencia = 'Sin cambios en el puntaje total entre el primer y último intento.';
    } else if (delta <= 4) {
      tendencia = `Leve aumento de síntomas (+${delta} puntos desde el primer intento).`;
    } else {
      tendencia = `Aumento significativo de síntomas (+${delta} puntos desde el primer intento).`;
    }

    const currentRules = (last.triangulacion || []).filter((r) => r.detectado);
    const rulesText = currentRules.length > 0
      ? `Triangulación vigente: ${currentRules.map((r) => r.regla).join(', ')}.`
      : 'Triangulación vigente: no se detectaron patrones relevantes.';

    return `${patientName} — Evolución: ${scoreList}. ${tendencia} ${rulesText}`;
  }

  get storedSummaryRules(): TriangulationDetail[] {
    const attempts = this.selectedPatientAttempts;
    if (!attempts.length) { return this.storedDetectedRules; }
    // Mostrar las reglas del último intento
    return (attempts[attempts.length - 1].triangulacion || []).filter((r) => r.detectado);
  }

  get storedAnswerDetails(): StoredAnswerDetail[] {
    if (!this.selectedResult) {
      return [];
    }

    return this.sections.map((section, index) => {
      const selectedIndex = this.selectedResult?.respuestas?.[index] ?? -1;

      return {
        section: section.title,
        optionText: selectedIndex >= 0 && selectedIndex < section.options.length
          ? section.options[selectedIndex]
          : 'Sin respuesta registrada.'
      };
    });
  }

  private readonly BAI_OPTION_LABELS = ['En absoluto', 'Levemente', 'Moderadamente', 'Severamente'];

  get baiAnswerDetails(): StoredAnswerDetail[] {
    if (!this.selectedResult || this.selectedResult.testType !== 'BAI') { return []; }
    return BAI_ITEMS.map((label, index) => {
      const score = this.selectedResult?.respuestas?.[index] ?? -1;
      return {
        section: label,
        optionText: score >= 0 && score < this.BAI_OPTION_LABELS.length
          ? this.BAI_OPTION_LABELS[score]
          : 'Sin respuesta registrada.'
      };
    });
  }

  get baiAnswerDetailsComparative(): { section: string; answers: string[] }[] {
    const attempts = this.selectedPatientAttempts;
    if (!attempts.length || attempts[0].testType !== 'BAI') { return []; }
    return BAI_ITEMS.map((label, index) => ({
      section: label,
      answers: attempts.map((attempt) => {
        const score = attempt.respuestas?.[index] ?? -1;
        return score >= 0 && score < this.BAI_OPTION_LABELS.length
          ? this.BAI_OPTION_LABELS[score]
          : 'Sin respuesta.';
      })
    }));
  }

  get storedAnswerDetailsComparative(): { section: string; answers: string[] }[] {
    const attempts = this.selectedPatientAttempts;
    if (!attempts.length) {
      return [];
    }

    return this.sections.map((section, index) => ({
      section: section.title,
      answers: attempts.map((attempt) => {
        const selectedIndex = attempt.respuestas?.[index] ?? -1;
        return selectedIndex >= 0 && selectedIndex < section.options.length
          ? section.options[selectedIndex]
          : 'Sin respuesta.';
      })
    }));
  }

  get storedAnalysisText(): string {
    if (!this.selectedResult) {
      return '';
    }

    const attempts = this.selectedPatientAttempts;
    const patientName = this.selectedResult.paciente?.nombreApellidos || 'El paciente';

    if (attempts.length <= 1) {
      const score = this.selectedResult.puntajeTotal;
      const level = (this.selectedResult.nivelDepresion || '').toLowerCase();
      const detectedRules = this.storedDetectedRules.map((d) => d.regla.toLowerCase());
      const triangulationText = detectedRules.length > 0
        ? `En la triangulación se observan indicadores compatibles con ${detectedRules.join(', ')}.`
        : 'En la triangulación no se observan patrones relevantes.';
      const riskText = score >= 29
        ? 'Por severidad, se sugiere evaluación clínica prioritaria y seguimiento cercano.'
        : 'Se recomienda integrar este resultado con entrevista clínica y evolución longitudinal.';
      return `${patientName} presenta un puntaje de ${score}, ubicado en el rango de ${level}. ${triangulationText} ${riskText}`;
    }

    // Análisis comparativo
    const first = attempts[0];
    const last = attempts[attempts.length - 1];
    const delta = last.puntajeTotal - first.puntajeTotal;
    const levelNow = (last.nivelDepresion || '').toLowerCase();
    const levelBefore = (first.nivelDepresion || '').toLowerCase();

    let evolucion: string;
    if (delta < 0) {
      evolucion = `Desde el primer registro ha mostrado una evolución positiva, pasando de ${levelBefore} (${first.puntajeTotal} pts.) a ${levelNow} (${last.puntajeTotal} pts.).`;
    } else if (delta === 0) {
      evolucion = `El nivel de depresión se ha mantenido estable en ${levelNow} a lo largo de los ${attempts.length} registros.`;
    } else {
      evolucion = `Se observa un aumento en la sintomatología depresiva respecto al primer registro: de ${levelBefore} (${first.puntajeTotal} pts.) a ${levelNow} (${last.puntajeTotal} pts.).`;
    }

    // Ítems con cambio notorio entre primer y último intento
    const itemChanges: string[] = [];
    this.sections.forEach((section, idx) => {
      const scoreFirst = first.respuestas?.[idx] ?? 0;
      const scoreLast = last.respuestas?.[idx] ?? 0;
      const diff = scoreLast - scoreFirst;
      if (diff <= -1) {
        itemChanges.push(`${section.title} (mejoró ${Math.abs(diff)} nivel${Math.abs(diff) > 1 ? 'es' : ''})`);
      } else if (diff >= 1) {
        itemChanges.push(`${section.title} (aumentó ${diff} nivel${diff > 1 ? 'es' : ''})`);
      }
    });

    const itemText = itemChanges.length > 0
      ? `Ítems con cambio notable: ${itemChanges.join(', ')}.`
      : 'No se registran cambios notables por ítem entre el primer y último intento.';

    const currentRules = (last.triangulacion || []).filter((r) => r.detectado);
    const rulesText = currentRules.length > 0
      ? `En el último registro la triangulación detectó: ${currentRules.map((r) => r.regla.toLowerCase()).join(', ')}.`
      : 'En el último registro la triangulación no detectó patrones relevantes.';

    const riskText = last.puntajeTotal >= 29
      ? 'Por severidad actual, se sugiere evaluación clínica prioritaria.'
      : 'Se recomienda continuar el seguimiento longitudinal.';

    return `${patientName} cuenta con ${attempts.length} evaluaciones registradas. ${evolucion} ${itemText} ${rulesText} ${riskText}`;
  }

  get groupedPatients(): PatientSummary[] {
    const map = new Map<string, PatientSummary>();
    for (const r of this.foundResults) {
      const key = r.patientKey || this.normalize(r.paciente?.nombreApellidos || '');
      const name = r.paciente?.nombreApellidos || r.patientKey || key;
      if (!map.has(key)) {
        map.set(key, { patientKey: key, name, testTypes: [], latestDate: r.creadoEn });
      }
      const entry = map.get(key)!;
      const tt = r.testType || 'BDI-II';
      if (!entry.testTypes.includes(tt)) {
        entry.testTypes.push(tt);
      }
      if (new Date(r.creadoEn) > new Date(entry.latestDate)) {
        entry.latestDate = r.creadoEn;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  get selectedPatientAllResults(): StoredBdiResult[] {
    if (!this.selectedPatientKey) { return []; }
    return this.foundResults
      .filter((r) => (r.patientKey || this.normalize(r.paciente?.nombreApellidos || '')) === this.selectedPatientKey)
      .sort((a, b) => {
        if (a.intentoNumero !== b.intentoNumero) { return a.intentoNumero - b.intentoNumero; }
        return new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime();
      });
  }

  get patientRounds(): PatientRound[] {
    const all = this.selectedPatientAllResults;
    if (!all.length) { return []; }

    // Ventana de 4 horas: resultados enviados dentro de ese margen se consideran la misma sesión
    const ROUND_WINDOW_MS = 4 * 60 * 60 * 1000;

    // Ordenar por fecha ascendente (ignorar intentoNumero para el agrupamiento)
    const sorted = [...all].sort((a, b) =>
      new Date(a.creadoEn).getTime() - new Date(b.creadoEn).getTime()
    );

    const rounds: PatientRound[] = [];

    for (const result of sorted) {
      const resultTime = new Date(result.creadoEn).getTime();
      const testType = result.testType || 'BDI-II';

      // Buscar la ronda más reciente dentro de la ventana que no tenga ya este tipo de test
      let placed = false;
      for (let i = rounds.length - 1; i >= 0; i--) {
        const round = rounds[i];
        const roundLatestTime = new Date(round.latestDate).getTime();
        if (resultTime - roundLatestTime > ROUND_WINDOW_MS) { break; }
        const alreadyHasTestType = round.results.some((r) => (r.testType || 'BDI-II') === testType);
        if (!alreadyHasTestType) {
          round.results.push(result);
          if (resultTime > roundLatestTime) { round.latestDate = result.creadoEn; }
          placed = true;
          break;
        }
      }

      if (!placed) {
        rounds.push({ roundNumber: rounds.length + 1, results: [result], latestDate: result.creadoEn });
      }
    }

    rounds.forEach((r, i) => { r.roundNumber = i + 1; });
    return rounds;
  }

  get testTypesPresent(): string[] {
    return [...new Set(this.selectedPatientAllResults.map((r) => r.testType || 'BDI-II'))];
  }

  getRoundResult(round: PatientRound, testType: string): StoredBdiResult | null {
    return round.results.find((r) => (r.testType || 'BDI-II') === testType) ?? null;
  }

  isSelectedRound(round: PatientRound): boolean {
    return round.results.some((r) => r.id === this.selectedResult?.id);
  }

  get selectedResultRoundNumber(): number {
    if (!this.selectedResult) { return 0; }
    const idx = this.patientRounds.findIndex((round) =>
      round.results.some((r) => r.id === this.selectedResult!.id)
    );
    return idx + 1;
  }

  get selectedReportAnalysis(): PatientAnalysis | null {
    const r = this.selectedResult;
    if (!r) { return null; }

    const name = r.paciente?.nombreApellidos || 'El/la paciente';
    const testLabel = r.testType === 'BAI' ? 'BAI' : 'BDI-II';
    const analysis: PatientAnalysis = {
      estadoActual: `${name} obtuvo ${r.puntajeTotal} puntos en el ${testLabel}, correspondiente a ${r.nivelDepresion.toLowerCase()}.`,
      evolucionBdi: null,
      evolucionBai: null,
      itemsMejora: [],
      itemsEmpeora: [],
      itemsCompLabel: 'con síntomas moderados o severos',
      triangulacion: [],
      recomendacion: '',
      hayRiesgoAlto: false
    };

    // Ítems con mayor sintomatología
    if ((!r.testType || r.testType === 'BDI-II') && r.respuestas) {
      this.sections.forEach((section, idx) => {
        const score = r.respuestas?.[idx] ?? 0;
        if (score >= 2) {
          analysis.itemsEmpeora.push({ label: section.title, direction: 'peor', levels: score });
        }
      });
    } else if (r.testType === 'BAI' && r.respuestas) {
      BAI_ITEMS.forEach((itemLabel, idx) => {
        const score = r.respuestas?.[idx] ?? 0;
        if (score >= 2) {
          analysis.itemsEmpeora.push({ label: itemLabel, direction: 'peor', levels: score });
        }
      });
    }

    // Triangulación: usar solo la del propio reporte (BDI-II), nunca de otro test
    if (!r.testType || r.testType === 'BDI-II') {
      analysis.triangulacion = (r.triangulacion || []).filter((t) => t.detectado);
    }

    // Riesgo
    analysis.hayRiesgoAlto = r.puntajeTotal >= (r.testType === 'BAI' ? 26 : 29);
    analysis.recomendacion = analysis.hayRiesgoAlto
      ? 'Por la severidad actual, se sugiere evaluación clínica prioritaria y seguimiento cercano.'
      : 'Se recomienda integrar estos resultados con entrevista clínica y contexto longitudinal.';

    return analysis;
  }

  get selectedRound(): PatientRound | null {
    if (!this.selectedResult) { return null; }
    return this.patientRounds.find((r) =>
      r.results.some((res) => res.id === this.selectedResult!.id)
    ) ?? null;
  }

  get roundBdiResult(): StoredBdiResult | null {
    const round = this.selectedRound;
    return round ? this.getRoundResult(round, 'BDI-II') : null;
  }

  get roundBaiResult(): StoredBdiResult | null {
    const round = this.selectedRound;
    return round ? this.getRoundResult(round, 'BAI') : null;
  }

  get allBdiResults(): StoredBdiResult[] {
    return this.selectedPatientAllResults.filter((r) => (r.testType || 'BDI-II') === 'BDI-II');
  }

  get allBaiResults(): StoredBdiResult[] {
    return this.selectedPatientAllResults.filter((r) => r.testType === 'BAI');
  }

  get latestBdiResult(): StoredBdiResult | null {
    const all = this.allBdiResults;
    return all.length ? all[all.length - 1] : null;
  }

  get latestBaiResult(): StoredBdiResult | null {
    const all = this.allBaiResults;
    return all.length ? all[all.length - 1] : null;
  }

  get patientTriangulationRules(): TriangulationDetail[] {
    return (this.latestBdiResult?.triangulacion || []).filter((r) => r.detectado);
  }

  get roundTriangulationRules(): TriangulationDetail[] {
    return (this.roundBdiResult?.triangulacion || []).filter((r) => r.detectado);
  }

  get patientSummaryText(): string {
    if (!this.selectedPatientKey) { return ''; }

    const patientName = this.selectedPatientName;
    const bdi = this.latestBdiResult;
    const bai = this.latestBaiResult;
    const bdiAll = this.allBdiResults;
    const baiAll = this.allBaiResults;

    if (!bdi && !bai) { return ''; }

    const scoreParts: string[] = [];
    if (bdi) { scoreParts.push(`Depresión (BDI-II): ${bdi.puntajeTotal} pts. (${bdi.nivelDepresion})`); }
    if (bai) { scoreParts.push(`Ansiedad (BAI): ${bai.puntajeTotal} pts. (${bai.nivelDepresion})`); }
    const scoresText = scoreParts.join(' — ');

    const evolutionParts: string[] = [];

    if (bdiAll.length > 1) {
      const first = bdiAll[0];
      const last = bdiAll[bdiAll.length - 1];
      const delta = last.puntajeTotal - first.puntajeTotal;
      if (delta < -4) { evolutionParts.push(`mejora significativa en depresión (−2 ${Math.abs(delta)} pts.)`); }
      else if (delta < 0) { evolutionParts.push(`leve mejoría en depresión (−${Math.abs(delta)} pts.)`); }
      else if (delta === 0) { evolutionParts.push('depresión sin cambios'); }
      else if (delta <= 4) { evolutionParts.push(`leve aumento en depresión (+${delta} pts.)`); }
      else { evolutionParts.push(`aumento significativo en depresión (+${delta} pts.)`); }
    }

    if (baiAll.length > 1) {
      const first = baiAll[0];
      const last = baiAll[baiAll.length - 1];
      const delta = last.puntajeTotal - first.puntajeTotal;
      if (delta < -4) { evolutionParts.push(`mejora significativa en ansiedad (−${Math.abs(delta)} pts.)`); }
      else if (delta < 0) { evolutionParts.push(`leve mejoría en ansiedad (−${Math.abs(delta)} pts.)`); }
      else if (delta === 0) { evolutionParts.push('ansiedad sin cambios'); }
      else if (delta <= 4) { evolutionParts.push(`leve aumento en ansiedad (+${delta} pts.)`); }
      else { evolutionParts.push(`aumento significativo en ansiedad (+${delta} pts.)`); }
    }

    const evolutionSuffix = evolutionParts.length
      ? ` Evolución: ${evolutionParts.join('; ')}.`
      : '';

    const triRules = this.patientTriangulationRules;
    const triSuffix = triRules.length > 0
      ? ` Triangulación: ${triRules.map((r) => r.regla).join(', ')}.`
      : '';

    return `${patientName}: ${scoresText} (resultado actual).${evolutionSuffix}${triSuffix}`;
  }

  get patientAnalysis(): PatientAnalysis | null {
    if (!this.selectedPatientKey) { return null; }

    const patientName = this.selectedPatientName;
    const bdi = this.latestBdiResult;
    const bai = this.latestBaiResult;
    const bdiAll = this.allBdiResults;
    const baiAll = this.allBaiResults;

    if (!bdi && !bai) { return null; }

    const analysis: PatientAnalysis = {
      estadoActual: '',
      evolucionBdi: null,
      evolucionBai: null,
      itemsMejora: [],
      itemsEmpeora: [],
      itemsCompLabel: '',
      triangulacion: [],
      recomendacion: '',
      hayRiesgoAlto: false
    };

    // Estado actual
    if (bdi && bai) {
      analysis.estadoActual = `${patientName} presenta ${bdi.nivelDepresion.toLowerCase()} según el BDI-II (${bdi.puntajeTotal} pts.) y ${bai.nivelDepresion.toLowerCase()} según el BAI (${bai.puntajeTotal} pts.).`;
    } else if (bdi) {
      analysis.estadoActual = `${patientName} presenta ${bdi.nivelDepresion.toLowerCase()} según el BDI-II (${bdi.puntajeTotal} pts.). El BAI aún no ha sido evaluado.`;
    } else if (bai) {
      analysis.estadoActual = `${patientName} presenta ${bai.nivelDepresion.toLowerCase()} según el BAI (${bai.puntajeTotal} pts.). El BDI-II aún no ha sido evaluado.`;
    }

    // Evolucion BDI
    if (bdiAll.length > 1) {
      const firstBdi = bdiAll[0];
      const lastBdi = bdiAll[bdiAll.length - 1];
      const deltaBdi = lastBdi.puntajeTotal - firstBdi.puntajeTotal;
      const trajectoryBdi = bdiAll.map((r) => `${r.puntajeTotal} pts. (${r.nivelDepresion.toLowerCase()})`).join(' → ');
      const allDeltasBdi = bdiAll.slice(1).map((r, i) => r.puntajeTotal - bdiAll[i].puntajeTotal);
      const hasFluctuationBdi = allDeltasBdi.some((d) => d > 0) && allDeltasBdi.some((d) => d < 0);
      if (hasFluctuationBdi) {
        analysis.evolucionBdi = `Fluctuante: ${trajectoryBdi}.`;
      } else if (deltaBdi < 0) {
        analysis.evolucionBdi = `Evolución positiva: ${trajectoryBdi}.`;
      } else if (deltaBdi === 0) {
        analysis.evolucionBdi = `Estable en ${lastBdi.nivelDepresion.toLowerCase()} a lo largo de los ${bdiAll.length} registros.`;
      } else {
        analysis.evolucionBdi = `Aumento en la sintomatología: ${trajectoryBdi}.`;
      }
    }

    // Evolucion BAI
    if (baiAll.length > 1) {
      const firstBai = baiAll[0];
      const lastBai = baiAll[baiAll.length - 1];
      const deltaBai = lastBai.puntajeTotal - firstBai.puntajeTotal;
      const trajectoryBai = baiAll.map((r) => `${r.puntajeTotal} pts. (${r.nivelDepresion.toLowerCase()})`).join(' → ');
      const allDeltasBai = baiAll.slice(1).map((r, i) => r.puntajeTotal - baiAll[i].puntajeTotal);
      const hasFluctuationBai = allDeltasBai.some((d) => d > 0) && allDeltasBai.some((d) => d < 0);
      if (hasFluctuationBai) {
        analysis.evolucionBai = `Fluctuante: ${trajectoryBai}.`;
      } else if (deltaBai < 0) {
        analysis.evolucionBai = `Evolución positiva: ${trajectoryBai}.`;
      } else if (deltaBai === 0) {
        analysis.evolucionBai = `Estable en ${lastBai.nivelDepresion.toLowerCase()} a lo largo de los ${baiAll.length} registros.`;
      } else {
        analysis.evolucionBai = `Aumento en la sintomatología: ${trajectoryBai}.`;
      }
    }

    // Items BDI con cambio notable
    if (bdiAll.length > 1) {
      const allBdiDeltas = bdiAll.slice(1).map((r, i) => r.puntajeTotal - bdiAll[i].puntajeTotal);
      const isBdiFluctuating = allBdiDeltas.some((d) => d > 0) && allBdiDeltas.some((d) => d < 0);
      const baseResult = isBdiFluctuating ? bdiAll[bdiAll.length - 2] : bdiAll[0];
      const lastResult = bdiAll[bdiAll.length - 1];
      analysis.itemsCompLabel = isBdiFluctuating ? 'respecto a la evaluación anterior' : 'respecto a la primera evaluación';
      const itemsMejora: AnalysisItemChange[] = [];
      const itemsEmpeora: AnalysisItemChange[] = [];
      this.sections.forEach((section, idx) => {
        const scoreBase = baseResult.respuestas?.[idx] ?? 0;
        const scoreLast = lastResult.respuestas?.[idx] ?? 0;
        const diff = scoreLast - scoreBase;
        if (diff <= -1) { itemsMejora.push({ label: section.title, direction: 'mejor', levels: Math.abs(diff) }); }
        else if (diff >= 1) { itemsEmpeora.push({ label: section.title, direction: 'peor', levels: diff }); }
      });
      analysis.itemsMejora = itemsMejora;
      analysis.itemsEmpeora = itemsEmpeora;
    }

    // Triangulacion
    analysis.triangulacion = this.patientTriangulationRules;

    // Riesgo
    const bdiScore = bdi?.puntajeTotal ?? 0;
    const baiScore = bai?.puntajeTotal ?? 0;
    analysis.hayRiesgoAlto = bdiScore >= 29 || baiScore >= 26;
    analysis.recomendacion = analysis.hayRiesgoAlto
      ? 'Por la severidad actual, se sugiere evaluación clínica prioritaria y seguimiento cercano.'
      : 'Se recomienda integrar estos resultados con entrevista clínica y evolución longitudinal.';

    return analysis;
  }

  get selectedPatientAttempts(): StoredBdiResult[] {
    if (!this.selectedResult) {
      return [];
    }

    const selectedPatientKey = this.selectedResult.patientKey || this.normalize(this.selectedResult.paciente?.nombreApellidos || '');
    const selectedTest = this.selectedResult.testType || 'BDI-II';

    const all = this.foundResults
      .filter((item) => {
        const patientKey = item.patientKey || this.normalize(item.paciente?.nombreApellidos || '');
        const testType = item.testType || 'BDI-II';
        return patientKey === selectedPatientKey && testType === selectedTest;
      })
      .sort((a, b) => {
        const aTime = new Date(a.creadoEn).getTime();
        const bTime = new Date(b.creadoEn).getTime();
        if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
          return a.intentoNumero - b.intentoNumero;
        }
        return aTime - bTime;
      });

    // Solo incluir hasta el reporte seleccionado (inclusive)
    const selectedIdx = all.findIndex((a) => a.id === this.selectedResult!.id);
    return selectedIdx >= 0 ? all.slice(0, selectedIdx + 1) : all;
  }

  get selectedResultAttemptIndex(): number {
    const idx = this.selectedPatientAttempts.findIndex((a) => a.id === this.selectedResult?.id);
    return idx >= 0 ? idx + 1 : 1;
  }

  get previousAttemptDelta(): string {
    const attempts = this.selectedPatientAttempts;
    if (attempts.length < 2) {
      return 'Sin intento previo para comparar.';
    }

    const current = attempts[attempts.length - 1];
    const previous = attempts[attempts.length - 2];
    const delta = current.puntajeTotal - previous.puntajeTotal;

    if (delta === 0) {
      return `Sin cambios respecto al intento previo (puntaje ${current.puntajeTotal}).`;
    }

    if (delta < 0) {
      return `Mejora de ${Math.abs(delta)} puntos respecto al intento previo (${previous.puntajeTotal} → ${current.puntajeTotal}).`;
    }

    return `Aumento de ${delta} puntos respecto al intento previo (${previous.puntajeTotal} → ${current.puntajeTotal}).`;
  }

  private rebuildCharts(): void {
    const rounds = this.patientRounds;
    const testTypes = this.testTypesPresent;

    if (!rounds.length) {
      this.lineChartData = { labels: [], datasets: [] };
      return;
    }

    const labels = rounds.map((r, i) => `Reporte ${i + 1} · ${this.shortDate(r.latestDate)}`);

    const colorMap: Record<string, string> = {
      'BDI-II': '#e91e8c',
      'BAI': '#f5c842'
    };
    const labelMap: Record<string, string> = {
      'BDI-II': 'Depresión (BDI-II)',
      'BAI': 'Ansiedad (BAI)'
    };

    const datasets = testTypes.map((tt) => {
      const data: (number | null)[] = rounds.map((round) => {
        const result = this.getRoundResult(round, tt);
        return result ? result.puntajeTotal : null;
      });
      const color = colorMap[tt] ?? '#666';
      return {
        data,
        label: labelMap[tt] ?? tt,
        fill: false,
        tension: 0.45,
        borderColor: color,
        backgroundColor: color + '33',
        spanGaps: false
      };
    });

    this.lineChartData = { labels, datasets };
  }

  shortDate(dateValue: string): string {
    if (!dateValue) {
      return 'Sin fecha';
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString('es-AR');
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

}
