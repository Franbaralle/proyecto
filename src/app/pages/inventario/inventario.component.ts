import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BdiDataService } from '../../services/bdi-data.service';
import { BdiSubmissionService } from '../../services/bdi-submission.service';
import { PendingResultsService } from '../../services/pending-results.service';
import { ReportesAuthService } from '../../services/reportes-auth.service';
import { PatientAuthService } from '../../services/patient-auth.service';

interface BdiOption {
  text: string;
}

interface BdiGroup {
  title: string;
  options: BdiOption[];
  selectedOption: number;
}

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {
    isSubmitting = false;
    submitMessage = '';
    submitError = '';

  readonly instructions = 'Instrucciones: Este cuestionario consta de 21 grupos de afirmaciones. Por favor, lea con atención cada uno de ellos cuidadosamente. Luego, elija uno de cada grupo, el que mejor describa el modo cómo se ha sentido las últimas dos semanas, incluyendo el día de hoy. Marque con una equis (x) la opción correspondiente al enunciado elegido. Si varios enunciados de un mismo grupo le parecen igualmente apropiados, marque con el que más se identifique. Verifique que no haya elegido más de uno por grupo.';

  groups: BdiGroup[] = [
    {
      title: 'Tristeza',
      selectedOption: 2,
      options: [
        { text: 'No me siento triste.' },
        { text: 'Me siento triste gran parte del tiempo.' },
        { text: 'Me siento triste todo el tiempo.' },
        { text: 'Me siento tan triste o soy tan infeliz que no puedo soportarlo.' }
      ]
    },
    {
      title: 'Pesimismo',
      selectedOption: 0,
      options: [
        { text: 'No estoy desalentado de mi futuro.' },
        { text: 'Me siento más desalentado respecto de mi futuro que lo que solía estarlo.' },
        { text: 'No espero que las cosas funcionen para mí.' },
        { text: 'Siento que no hay esperanza para mi futuro y que sólo puede empeorar.' }
      ]
    },
    {
      title: 'Fracaso',
      selectedOption: 2,
      options: [
        { text: 'No me siento como un fracasado.' },
        { text: 'He fracasado más de lo que hubiera debido.' },
        { text: 'Cuando miro hacia atrás, veo muchos fracasos.' },
        { text: 'Siento que como persona soy un fracaso total.' }
      ]
    },
    {
      title: 'Pérdida de Placer',
      selectedOption: 3,
      options: [
        { text: 'Obtengo tanto placer como siempre por las cosas de las que disfruto.' },
        { text: 'No disfruto tanto de las cosas como solía hacerlo.' },
        { text: 'Obtengo muy poco placer de las cosas que solía disfrutar.' },
        { text: 'No puedo obtener ningún placer de las cosas de las que solía disfrutar.' }
      ]
    },
    {
      title: 'Sentimientos de Culpa',
      selectedOption: 1,
      options: [
        { text: 'No me siento particularmente culpable.' },
        { text: 'Me siento culpable respecto de varias cosas que he hecho o que debería haber hecho.' },
        { text: 'Me siento bastante culpable la mayor parte del tiempo.' },
        { text: 'Me siento culpable todo el tiempo.' }
      ]
    },
    {
      title: 'Sentimientos de Castigo',
      selectedOption: 1,
      options: [
        { text: 'No siento que esté siendo castigado.' },
        { text: 'Siento que tal vez pueda ser castigado.' },
        { text: 'Espero ser castigado.' },
        { text: 'Siento que estoy siendo castigado.' }
      ]
    },
    {
      title: 'Disconformidad con uno mismo',
      selectedOption: 2,
      options: [
        { text: 'Siento acerca de mí lo mismo que siempre.' },
        { text: 'He perdido la confianza en mí mismo.' },
        { text: 'Estoy decepcionado conmigo mismo.' },
        { text: 'No me gusto a mí mismo.' }
      ]
    },
    {
      title: 'Autocrítica',
      selectedOption: 1,
      options: [
        { text: 'No me critico ni me culpo más de lo habitual.' },
        { text: 'Estoy más crítico conmigo mismo de lo que solía estarlo.' },
        { text: 'Me critico a mí mismo por todos mis errores.' },
        { text: 'Me culpo a mí mismo por todo lo malo que sucede.' }
      ]
    },
    {
      title: 'Pensamientos o Deseos Suicidas',
      selectedOption: 0,
      options: [
        { text: 'No tengo ningún pensamiento de matarme.' },
        { text: 'He tenido pensamientos de matarme, pero no lo haría.' },
        { text: 'Querría matarme.' },
        { text: 'Me mataría si tuviera oportunidad de hacerlo.' }
      ]
    },
    {
      title: 'Llanto',
      selectedOption: 2,
      options: [
        { text: 'No lloro más de lo que solía hacerlo.' },
        { text: 'Lloro más de lo que solía hacerlo.' },
        { text: 'Lloro por cualquier pequeñez.' },
        { text: 'Siento ganas de llorar pero no puedo.' }
      ]
    },
    {
      title: 'Agitación',
      selectedOption: 0,
      options: [
        { text: 'No estoy más inquieto o tenso que lo habitual.' },
        { text: 'Me siento más inquieto o tenso que lo habitual.' },
        { text: 'Estoy tan inquieto o agitado que me es difícil quedarme quieto.' },
        { text: 'Estoy tan inquieto o agitado que tengo que estar siempre en movimiento o haciendo algo.' }
      ]
    },
    {
      title: 'Pérdida de Interés',
      selectedOption: 2,
      options: [
        { text: 'No he perdido el interés en otras actividades o personas.' },
        { text: 'Estoy menos interesado que antes en otras personas o cosas.' },
        { text: 'He perdido casi todo el interés en otras personas o cosas.' },
        { text: 'Me es difícil interesarme por algo.' }
      ]
    },
    {
      title: 'Indecisión',
      selectedOption: 1,
      options: [
        { text: 'Tomo mis propias decisiones tan bien como siempre.' },
        { text: 'Me resulta más difícil que de costumbre tomar decisiones.' },
        { text: 'Encuentro mucha más dificultad que antes para tomar decisiones.' },
        { text: 'Tengo problemas para tomar cualquier decisión.' }
      ]
    },
    {
      title: 'Desvalorización',
      selectedOption: 1,
      options: [
        { text: 'No siento que yo no sea valioso.' },
        { text: 'No me considero a mí mismo tan valioso o útil como solía considerarme.' },
        { text: 'Me siento menos valioso cuando me comparo con otros.' },
        { text: 'Siento que no valgo nada.' }
      ]
    },
    {
      title: 'Pérdida de Energía',
      selectedOption: 2,
      options: [
        { text: 'Tengo tanta energía como siempre.' },
        { text: 'Tengo menos energía que la que solía tener.' },
        { text: 'No tengo suficiente energía para hacer demasiado.' },
        { text: 'No tengo energía suficiente para hacer nada.' }
      ]
    },
    {
      title: 'Cambios en los Hábitos de Sueño',
      selectedOption: 6,
      options: [
        { text: 'No he experimentado ningún cambio en mis hábitos de sueño.' },
        { text: 'Duermo un poco más de lo habitual.' },
        { text: 'Duermo un poco menos de lo habitual.' },
        { text: 'Duermo mucho más que lo habitual.' },
        { text: 'Duermo mucho menos que lo habitual.' },
        { text: 'Duermo la mayor parte del día.' },
        { text: 'Me despierto 1-2 horas más temprano y no puedo volver a dormirme.' }
      ]
    },
    {
      title: 'Irritabilidad',
      selectedOption: 0,
      options: [
        { text: 'No estoy más irritable que lo habitual.' },
        { text: 'Estoy más irritable que lo habitual.' },
        { text: 'Estoy mucho más irritable que lo habitual.' },
        { text: 'Estoy irritable todo el tiempo.' }
      ]
    },
    {
      title: 'Cambios en el Apetito',
      selectedOption: 3,
      options: [
        { text: 'No he experimentado cambios en mi apetito.' },
        { text: 'Mi apetito es un poco menor que lo habitual.' },
        { text: 'Mi apetito es un poco mayor que lo habitual.' },
        { text: 'Mi apetito es mucho menor que antes.' },
        { text: 'Mi apetito es mucho mayor que antes.' },
        { text: 'No tengo apetito en absoluto.' },
        { text: 'Quiero comer todo el día.' }
      ]
    },
    {
      title: 'Dificultad de Concentración',
      selectedOption: 3,
      options: [
        { text: 'Puedo concentrarme tan bien como siempre.' },
        { text: 'No puedo concentrarme tan bien como habitualmente.' },
        { text: 'Me es difícil mantener la mente en algo por mucho tiempo.' },
        { text: 'Encuentro que no puedo concentrarme en nada.' }
      ]
    },
    {
      title: 'Cansancio o Fatiga',
      selectedOption: 3,
      options: [
        { text: 'No estoy más cansado o fatigado que lo habitual.' },
        { text: 'Me fatigo o me canso más fácilmente que lo habitual.' },
        { text: 'Estoy demasiado fatigado o cansado para hacer muchas de las cosas que solía hacer.' },
        { text: 'Estoy demasiado fatigado o cansado para hacer la mayoría de las cosas que solía hacer.' }
      ]
    },
    {
      title: 'Pérdida de Interés en el Sexo',
      selectedOption: 2,
      options: [
        { text: 'No he notado ningún cambio reciente en mi interés por el sexo.' },
        { text: 'Estoy menos interesado en el sexo de lo que solía estarlo.' },
        { text: 'Estoy mucho menos interesado en el sexo.' },
        { text: 'He perdido completamente el interés en el sexo.' }
      ]
    }
  ];

  constructor(
    private readonly bdiData: BdiDataService,
    private readonly submissionService: BdiSubmissionService,    private readonly pendingService: PendingResultsService,    private readonly authService: ReportesAuthService,
    private readonly patientAuth: PatientAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.bdiData.responses = Array(21).fill(-1);
    this.bdiData.saveSession();
    this.groups.forEach((group, index) => {
      group.selectedOption = this.bdiData.responses[index] ?? -1;
    });
  }

  selectOption(groupIndex: number, optionIndex: number): void {
    this.groups[groupIndex].selectedOption = optionIndex;
    this.bdiData.updateResponse(groupIndex, optionIndex);
    this.submitMessage = '';
    this.submitError = '';
  }

  get canSubmit(): boolean {
    if (this.patientAuth.isLoggedIn) {
      // Pacientes Firebase: solo requieren datos de paciente + cuestionario completo
      return this.bdiData.isPatientDataComplete && this.bdiData.isQuestionnaireComplete && !this.isSubmitting;
    }
    return this.bdiData.canSubmitResult && !this.isSubmitting;
  }

  get isDiegoSession(): boolean {
    return this.authService.isDiegoSession;
  }

  async submitResult(): Promise<void> {
    this.submitMessage = '';
    this.submitError = '';

    const puedeEnviar = this.patientAuth.isLoggedIn
      ? this.bdiData.isPatientDataComplete && this.bdiData.isQuestionnaireComplete
      : this.bdiData.canSubmitResult;

    if (!puedeEnviar) {
      this.submitError = 'Debe completar todos los datos del paciente y todas las preguntas antes de guardar.';
      return;
    }

    // Pacientes Firebase: guardar localmente y volver a selección
    if (this.patientAuth.isLoggedIn) {
      this.pendingService.markPending('BDI-II');
      this.router.navigate(['/seleccion-test']);
      return;
    }

    // Sesión de psicólogo (Diego): enviar directo a Firestore
    this.isSubmitting = true;
    try {
      await this.submissionService.submitCurrentResult();
      this.bdiData.clearSession();
      this.submitMessage = 'Resultados guardados correctamente en Firebase.';
    } catch (error: unknown) {
      this.submitError = error instanceof Error ? error.message : 'No se pudo guardar el resultado.';
    } finally {
      this.isSubmitting = false;
    }
  }

}
