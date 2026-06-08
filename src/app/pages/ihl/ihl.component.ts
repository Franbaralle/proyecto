import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IhlDataService, IhlPartBAnswers } from '../../services/ihl-data.service';
import { IhlSubmissionService } from '../../services/ihl-submission.service';
import { PendingResultsService } from '../../services/pending-results.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';

type IhlPartBNumericKeys = Exclude<keyof IhlPartBAnswers, 'q5Reason' | 'q6Explanation' | 'q7'>;

@Component({
  selector: 'app-ihl',
  templateUrl: './ihl.component.html',
  styleUrls: ['./ihl.component.css']
})
export class IhlComponent implements OnInit {
  readonly title = 'INVENTARIO DE HOSTIGAMIENTO LABORAL (IHL) - PARTES A y B';

  readonly frequencyOptions = [
    'Todos los días',
    'Algunas veces a la semana',
    'Algunas veces al mes',
    'Algunas veces al año',
    'Nunca'
  ];

  readonly discomfortOptions = ['Alto', 'Medio', 'Bajo'];

  readonly partBYesNoOptions = ['Sí', 'No'];
  readonly partBFrequencyOptions = ['Diariamente', 'Semanalmente', 'Mensualmente'];
  readonly partBDurationOptions = ['Algunos días', 'Semanas', 'Meses', 'Años'];
  readonly partBNoYesOptions = ['Sí', 'No'];
  readonly partBOutcomes = [
    'Lograr comprensión',
    'Que cese la agresión',
    'Irse de la empresa',
    'Cobrar una indemnización',
    'Que no lo molesten más',
    'Realizar un juicio',
    'Que su hostigador reciba un castigo',
    'Que todo vuelva a ser como antes',
    'Poder trabajar en su puesto'
  ];
  readonly partBSexOptions = ['Masculino', 'Femenino'];
  readonly partBAgeRelationOptions = ['Mayor que Ud.', 'Igual que Ud.', 'Menor que Ud.'];
  readonly partBPositionOptions = ['Superior al suyo', 'Igual al suyo', 'Inferior al suyo'];
  readonly partBSeniorityOptions = ['Mayor a la suya', 'Igual a la suya', 'Menor a la suya'];
  readonly partBBehaviorOptions = ['Sólo con Ud.', 'Con otras personas de su entorno laboral'];
  readonly partBActuationOptions = ['Individual', 'En grupo', 'Ambas'];

  readonly items: string[] = [
    `Cuando saludo, mi jefe no deja que nadie me conteste.`,
    `Cuando paso por al lado de mis jefes/compañeros/subordinados resoplan, "cuchichean" y/o hacen comentarios despectivos.`,
    `Mi superior me da pautas imprecisas para que mi trabajo resulte inadecuado.`,
    `El sindicato que me corresponde no atiende mis denuncias, reclamos o descargos.`,
    `Si solicito permiso, licencia, o similar, no se me otorga o debo compensarlo.`,
    `Mis jefes/compañeros/subordinados critican mi estilo de vida.`,
    `Mi superior intenta convencerme de que no me adapto al trabajo.`,
    `Siento que mis jefes/compañeros/subordinados me ignoran todo el tiempo.`,
    `En mi trabajo, se suele utilizar el hostigamiento para que la gente renuncie y no pagarles indemnizaciones.`,
    `Me cambian a lugares alejados y/o solitarios en el trabajo, sin ninguna explicación o por razones poco justificadas.`,
    `Limitan mi crecimiento/ascenso laboral.`,
    `Desde que asumió un nuevo jefe las cosas cambiaron para peor.`,
    `Me dan información incompleta para que realice mal mi trabajo.`,
    `Mis jefes/compañeros/subordinados se ríen cada vez que hablo.`,
    `En mi trabajo percibo un clima raro, como de continuo sobresalto.`,
    `Cuando hago una pregunta, nadie me responde.`,
    `Considero que me quieren ganar por cansancio.`,
    `Mis jefes/compañeros/subordinados no me hablan y/o no saludan.`,
    `Me quitan el trabajo que normalmente realizaba y no me asignan nuevas tareas.`,
    `Mi jefe convenció a los demás de que no sirvo para hacer mi trabajo.`,
    `Han designado a un nuevo empleado para que supervise y controle mis tareas.`,
    `Mis jefes/compañeros/subordinados me esquivan porque dicen que soy raro/a o anormal.`,
    `Me han dicho que me vaya.`,
    `Me han eliminado de la lista de contactos para recibir correos electrónicos u otro tipo de notificaciones.`,
    `Mis compañeros dicen que exagero y que no existe y/o perciben maltrato laboral.`,
    `Si hay un problema en el trabajo, siempre termino siendo acusado de ser el responsable aunque esto no sea cierto.`,
    `Me han dado órdenes de instruir a quien no sabe nada de mi trabajo para que ocupe mi lugar.`,
    `Mi jefe me exige que sea fiel/guarde un secreto/información pública aunque con ello transgreda las normas.`,
    `Me piden trabajos y a mitad del proceso, me cambian la tarea sin que pueda concluir ninguna de ellas.`,
    `He descubierto burlas escritas sobre mí.`,
    `Me sugieren que abandone mis tareas, porque perjudico a los demás.`,
    `Se comportan de manera irrespetuosa conmigo.`,
    `Mis decisiones son cuestionadas, contrariadas y/o ignoradas.`,
    `No hablo con nadie, para evitar sentirme despreciado/humillado/ignorado.`,
    `Me asignan tareas que son inútiles / sin sentido / descalificantes.`,
    `No respetan mi rol jerárquico ("me puentean").`,
    `He encontrado en la basura trabajos míos.`,
    `No me invitan a reuniones/eventos sociales.`,
    `Mis compañeros se "hacen" los que no ven lo que pasa.`,
    `En el horario de descanso, mis compañeros me evitan.`,
    `En mi trabajo tengo reputación de conflictivo/a.`,
    `Mi jefe me niega la posibilidad de hablar con él.`,
    `He encontrado rotos o han desaparecido materiales con los que trabajo.`,
    `En la organización donde trabajo no hay espacios específicos habilitados para formular denuncias de maltrato laboral.`,
    `Todo el trabajo que hago es evaluado negativamente, sin ninguna justificación.`,
    `Insinúan cosas feas acerca de mi religión/origen.`,
    `Mis compañeros sienten miedo de acercarse a mí.`,
    `Cuando intento hablar, me hacen callar o me interrumpen.`,
    `Cuando llego a mi lugar de trabajo dejan de hablar.`,
    `Me asignan trabajos que están por debajo de mi capacidad/formación.`,
    `Mi jefe presenta como suyas mis ideas y proyectos.`,
    `Me han arrojado objetos y/o agredido físicamente de manera leve.`,
    `Se burlan de mi aspecto físico.`,
    `Mis subordinados pierden u olvidan encargos para mí.`,
    `Me asignan excesiva cantidad de trabajo y sin ningún criterio.`,
    `Se hacen públicas cuestiones de mi vida privada con la intención de incomodarme.`,
    `Mi jefe sólo se dirige a mí mediante gritos e insultos.`,
    `Se difunden rumores feos sobre personas de mi entorno privado.`,
    `Percibo que estoy siendo amenazado en forma permanente.`,
    `Me preguntan por qué no renuncio.`,
    `Mis jefes/compañeros/subordinados me hacen quedar como si yo fuese un estúpido/a.`,
    `Mis jefes/compañeros/subordinados me han sugerido que comience un tratamiento psicológico sin fundamentos.`,
    `En mi trabajo es inútil denunciar las transgresiones.`
  ];

  isSubmitting = false;
  submitMessage = '';
  submitError = '';

  constructor(
    private readonly router: Router,
    public readonly ihlData: IhlDataService,
    private readonly ihlSubmissionService: IhlSubmissionService,
    private readonly pendingService: PendingResultsService,
    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService
  ) {}

  ngOnInit(): void {
    if (this.ihlData.responses.length !== this.items.length * 2) {
      this.ihlData.responses = Array(this.items.length * 2).fill(-1);
      this.ihlData.saveSession();
    }
  }

  get isDiegoSession(): boolean {
    return this.authService.isDiegoSession;
  }

  get isAuthorized(): boolean {
    return this.authService.isAuthorized;
  }

  get partB(): IhlPartBAnswers {
    return this.ihlData.partB;
  }

  get isQuestionnaireDisabled(): boolean {
    return this.partB.q2 === 1;
  }

  get canSubmit(): boolean {
    if (this.patientAuth.isLoggedIn) {
      return this.ihlData.isPatientDataComplete && this.ihlData.isQuestionnaireComplete && this.ihlData.isPartBComplete && !this.isSubmitting;
    }

    return this.ihlData.canSubmitResult && !this.isSubmitting;
  }

  frequencyResponse(itemIndex: number): number {
    return this.ihlData.responses[itemIndex];
  }

  discomfortResponse(itemIndex: number): number {
    return this.ihlData.responses[this.items.length + itemIndex];
  }

  selectFrequency(itemIndex: number, value: number): void {
    this.ihlData.responses[itemIndex] = value;
    this.ihlData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  selectDiscomfort(itemIndex: number, value: number): void {
    this.ihlData.responses[this.items.length + itemIndex] = value;
    this.ihlData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  selectPartBAnswer(question: IhlPartBNumericKeys, value: number): void {
    this.ihlData.partB[question] = value;
    if (question === 'q2' && value === 1) {
      this.clearPartBFromQuestion3();
    }
    this.ihlData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  updatePartBText(question: 'q5Reason' | 'q6Explanation', value: string): void {
    this.ihlData.partB[question] = value;
    this.ihlData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  toggleOutcome(index: number): void {
    const currentIndex = this.partB.q7.indexOf(index);
    if (currentIndex >= 0) {
      this.partB.q7.splice(currentIndex, 1);
    } else {
      this.partB.q7.push(index);
    }
    this.ihlData.saveSession();
    this.submitMessage = '';
    this.submitError = '';
  }

  isOutcomeChecked(index: number): boolean {
    return this.partB.q7.includes(index);
  }

  clearPartBFromQuestion3(): void {
    this.partB.q3 = -1;
    this.partB.q4 = -1;
    this.partB.q5 = -1;
    this.partB.q5Reason = '';
    this.partB.q6 = -1;
    this.partB.q6Explanation = '';
    this.partB.q7 = [];
    this.partB.q8 = -1;
    this.partB.q9 = -1;
    this.partB.q10 = -1;
    this.partB.q11a = -1;
    this.partB.q11b = -1;
    this.partB.q11c = -1;
    this.partB.q11d = -1;
    this.partB.q11e = -1;
    this.partB.q11f = -1;
  }

  async submitResult(): Promise<void> {
    this.submitMessage = '';
    this.submitError = '';

    const puedeEnviar = this.canSubmit;
    if (!puedeEnviar) {
      this.submitError = 'Debe completar todas las filas de frecuencia y malestar antes de continuar.';
      return;
    }

    if (this.patientAuth.isLoggedIn) {
      this.pendingService.markPending('IHL');
      this.router.navigate(['/seleccion-test']);
      return;
    }

    this.isSubmitting = true;
    try {
      await this.ihlSubmissionService.submitCurrentResult();
      this.ihlData.clearSession();
      this.submitMessage = 'Resultados guardados correctamente en Firebase.';
    } catch (error: unknown) {
      this.submitError = error instanceof Error ? error.message : 'No se pudo guardar el resultado.';
    } finally {
      this.isSubmitting = false;
    }
  }

  volverSeleccion(): void {
    this.router.navigate(['/seleccion-test']);
  }
}
