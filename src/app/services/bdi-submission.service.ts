import { Injectable } from '@angular/core';
import { firebaseConfig } from '../config/firebase.config';
import { firebaseAuth, firestoreDb } from '../config/firebase.app';
import { BdiDataService, PatientData, ProfessionalData, TriangulationDetail } from './bdi-data.service';
import { CryptoService } from './crypto.service';
import { addDoc, collection, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export type TestType = 'BDI-II';

export interface ReevaluatePermissionInput {
  patientName: string;
  testType: string;
  enabledBy: string;
  reason: string;
}

export interface ReevaluationPermission {
  id: string;
  patientKey: string;
  testType: string;
  allowed: boolean;
  enabledBy: string;
  reason: string;
  updatedAt: string;
  lastConsumedAt?: string;
}

export interface StoredBdiResult {
  id: string;
  creadoEn: string;
  testType: string;
  patientKey: string;
  intentoNumero: number;
  isCurrent: boolean;
  diagnosticoGlobal: string;
  reevaluadoPor?: string;
  motivoReevaluacion?: string;
  paciente: PatientData;
  profesional: ProfessionalData;
  respuestas: number[];
  puntajeTotal: number;
  nivelDepresion: string;
  triangulacion: TriangulationDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class BdiSubmissionService {
  private readonly attemptsCollection = 'bdiResultados';
  private readonly reevaluationCollection = 'testReevaluationPermissions';

  constructor(
    private readonly bdiData: BdiDataService,
    private readonly cryptoService: CryptoService
  ) {}

  get isFirebaseConfigured(): boolean {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
  }

  async submitCurrentResult(): Promise<void> {
    if (!this.isFirebaseConfigured) {
      throw new Error('Firebase no está configurado. Complete apiKey y projectId en src/app/config/firebase.config.ts');
    }

    await this.ensureFirebaseAuth();

    try {
      await this.saveAsCurrentAttempt();
    } catch (error: unknown) {
      throw this.mapFirestoreError(error);
    }
  }

  async enableReevaluation(input: ReevaluatePermissionInput): Promise<void> {
    if (!this.isFirebaseConfigured) {
      throw new Error('Firebase no está configurado.');
    }

    await this.ensureFirebaseAuth();

    const patientRaw = this.normalize(input.patientName);
    if (!patientRaw) {
      throw new Error('Debe indicar el nombre del paciente para habilitar reevaluación.');
    }
    const patientKey = await this.cryptoService.hmac(patientRaw);
    const now = new Date().toISOString();

    try {
      await addDoc(collection(firestoreDb, this.reevaluationCollection), {
        patientKey,
        testType: input.testType,
        allowed: true,
        enabledBy: await this.cryptoService.encryptJson(input.enabledBy),
        enabledByHash: await this.cryptoService.hmac(input.enabledBy),
        reason: await this.cryptoService.encryptJson(input.reason),
        updatedAt: now
      });
    } catch (error: unknown) {
      throw this.mapFirestoreError(error);
    }
  }

  async hasCurrentAttempt(patientName: string, testType: string, patientEmail?: string): Promise<boolean> {
    if (!this.isFirebaseConfigured) {
      return false;
    }

    await this.ensureFirebaseAuth();

    const patientKey = await this.cryptoService.hmac(this.normalize(patientName));

    if (!patientKey) {
      return false;
    }

    try {
      const snap = await getDocs(query(
        collection(firestoreDb, this.attemptsCollection),
        where('patientKey', '==', patientKey),
        where('testType', '==', testType),
        where('isCurrent', '==', true),
        limit(1)
      ));

      if (snap.empty) {
        return false;
      }

      const permSnap = await getDocs(query(
        collection(firestoreDb, this.reevaluationCollection),
        where('patientKey', '==', patientKey),
        where('testType', '==', testType),
        where('allowed', '==', true),
        limit(1)
      ));
      if (!permSnap.empty) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async searchResultsByPatientName(name: string): Promise<StoredBdiResult[]> {
    if (!this.isFirebaseConfigured) {
      throw new Error('Firebase no está configurado.');
    }

    await this.ensureFirebaseAuth();

    const normalized = this.normalize(name);
    if (!normalized) {
      return [];
    }

    const q = query(
      collection(firestoreDb, this.attemptsCollection),
      where('patientKey', '==', await this.cryptoService.hmac(normalized)),
      orderBy('creadoEn', 'desc'),
      limit(50)
    );

    let snap;
    try {
      snap = await getDocs(q);
    } catch (error: unknown) {
      throw this.mapFirestoreError(error);
    }

    const results = await Promise.all(snap.docs.map(async (docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;

      return {
        id: docSnap.id,
        creadoEn: (data['creadoEn'] as string) || '',
        testType: (data['testType'] as string) || 'BDI-II',
        patientKey: (data['patientKey'] as string) || (data['pacienteNombreLower'] as string) || '',
        intentoNumero: Number(data['intentoNumero'] ?? 1),
        isCurrent: Boolean(data['isCurrent'] ?? true),
        diagnosticoGlobal: await this.resolveString(data['diagnosticoGlobal']),
        reevaluadoPor: await this.resolveString(data['reevaluadoPor']),
        motivoReevaluacion: await this.resolveString(data['motivoReevaluacion']),
        paciente: await this.resolveJson<PatientData>(data['paciente'], {} as PatientData),
        profesional: await this.resolveJson<ProfessionalData>(data['profesional'], {} as ProfessionalData),
        respuestas: await this.resolveResponses(data['respuestas']),
        puntajeTotal: await this.resolveNumber(data['puntajeTotal']),
        nivelDepresion: await this.resolveString(data['nivelDepresion']),
        triangulacion: await this.resolveJson<TriangulationDetail[]>(data['triangulacion'], [])
      };
    }));

    return results.sort((a, b) => {
      const aTime = new Date(a.creadoEn).getTime();
      const bTime = new Date(b.creadoEn).getTime();
      if (Number.isNaN(aTime) || Number.isNaN(bTime)) {
        return b.intentoNumero - a.intentoNumero;
      }

      return bTime - aTime;
    });
  }

  private async buildPayload(): Promise<Record<string, unknown>> {
    const patientKey = await this.cryptoService.hmac(this.normalize(this.bdiData.patient.nombreApellidos));
    const testType: TestType = 'BDI-II';

    return {
      creadoEn: new Date().toISOString(),
      pacienteNombreLower: patientKey,
      patientKey,
      patientEmail: await this.cryptoService.encryptJson(this.normalize(this.bdiData.patient.email)),
      testType,
      paciente: await this.cryptoService.encryptJson(this.bdiData.patient),
      profesional: await this.cryptoService.encryptJson(this.bdiData.professional),
      respuestas: await this.cryptoService.encryptResponses(this.bdiData.responses),
      puntajeTotal: await this.cryptoService.encryptJson(this.bdiData.totalScore),
      nivelDepresion: await this.cryptoService.encryptJson(this.bdiData.depressionLevel),
      diagnosticoGlobal: await this.cryptoService.encryptJson(this.buildGlobalDiagnosis(this.bdiData.totalScore, this.bdiData.depressionLevel)),
      triangulacion: await this.cryptoService.encryptJson(this.bdiData.getTriangulationDetails())
    };
  }

  private buildGlobalDiagnosis(score: number, level: string): string {
    return `Diagnóstico global preliminar: ${level} (BDI-II ${score} puntos). Integrar con entrevista clínica y otros tests vigentes.`;
  }

  private async resolveResponses(raw: unknown): Promise<number[]> {
    if (typeof raw === 'string') { return this.cryptoService.decryptResponses(raw); }
    if (Array.isArray(raw)) { return raw as number[]; }
    return [];
  }

  private async resolveJson<T>(raw: unknown, fallback: T): Promise<T> {
    if (typeof raw === 'string' && raw !== '') { return this.cryptoService.decryptJson<T>(raw, fallback); }
    if (raw !== null && typeof raw === 'object') { return raw as T; } // compatibilidad retroactiva
    return fallback;
  }

  private async resolveString(raw: unknown): Promise<string> {
    if (typeof raw !== 'string' || raw === '') { return ''; }
    const decrypted = await this.cryptoService.decryptJson<string>(raw, '__LEGACY__');
    return decrypted === '__LEGACY__' ? raw : decrypted;
  }

  private async resolveNumber(raw: unknown): Promise<number> {
    if (typeof raw === 'number') { return raw; }
    if (typeof raw === 'string') { return this.cryptoService.decryptJson<number>(raw, 0); }
    return 0;
  }

  private async saveAsCurrentAttempt(): Promise<void> {
    const payload = await this.buildPayload();
    const patientKey = String(payload['patientKey'] || '');
    const testType = String(payload['testType'] || 'BDI-II');

    if (!patientKey) {
      throw new Error('No se puede guardar: falta nombre del paciente.');
    }

    const now = new Date().toISOString();
    const attemptsRef = collection(firestoreDb, this.attemptsCollection);

    const attemptsQuery = query(
      attemptsRef,
      where('patientKey', '==', patientKey),
      where('testType', '==', testType)
    );
    const attemptsSnapshot = await getDocs(attemptsQuery);
    const existingAttempts = attemptsSnapshot.docs;
    const currentAttempt = existingAttempts.find((item) => Boolean(item.data()['isCurrent'] ?? true));

    const maxAttemptNumber = existingAttempts.reduce((max: number, item) => {
      const current = Number(item.data()['intentoNumero'] ?? 1);
      return current > max ? current : max;
    }, 0);
    const nextAttemptNumber = maxAttemptNumber + 1;

    const permSnap = await getDocs(query(
      collection(firestoreDb, this.reevaluationCollection),
      where('patientKey', '==', patientKey),
      where('testType', '==', testType),
      where('allowed', '==', true),
      limit(1)
    ));
    const permissionDoc = permSnap.empty ? null : permSnap.docs[0];
    const reevaluationAllowed = permissionDoc !== null;

    if (currentAttempt && !reevaluationAllowed) {
      throw new Error('Este paciente ya tiene un intento vigente para BDI-II. Habilite reevaluación para permitir un nuevo intento.');
    }

    if (currentAttempt) {
      await updateDoc(currentAttempt.ref, {
        isCurrent: false,
        updatedAt: now,
        reemplazadoPorIntento: nextAttemptNumber
      });
    }

    await addDoc(attemptsRef, {
      ...payload,
      creadoEn: now,
      updatedAt: now,
      isCurrent: true,
      intentoNumero: nextAttemptNumber,
      reevaluadoPor: reevaluationAllowed && permissionDoc!.data()['enabledBy']
        ? await this.cryptoService.encryptJson(await this.resolveString(permissionDoc!.data()['enabledBy']))
        : '',
      motivoReevaluacion: reevaluationAllowed && permissionDoc!.data()['reason']
        ? await this.cryptoService.encryptJson(await this.resolveString(permissionDoc!.data()['reason']))
        : ''
    });

    if (reevaluationAllowed) {
      await updateDoc(permissionDoc!.ref, {
        allowed: false,
        updatedAt: now,
        lastConsumedAt: now
      });
    }
  }

  private normalize(value: string): string {
    return value.trim().toLowerCase();
  }

  async getPatientReevaluationPermissions(patientNameOrKey: string): Promise<ReevaluationPermission[]> {
    if (!this.isFirebaseConfigured) { return []; }
    await this.ensureFirebaseAuth();
    const patientKey = patientNameOrKey.length === 64 && /^[0-9a-f]+$/.test(patientNameOrKey)
      ? patientNameOrKey
      : await this.cryptoService.hmac(this.normalize(patientNameOrKey));
    const q = query(
      collection(firestoreDb, this.reevaluationCollection),
      where('patientKey', '==', patientKey),
      orderBy('updatedAt', 'desc'),
      limit(100)
    );
    let snap;
    try { snap = await getDocs(q); } catch (err) {
      console.error('[getPatientReevaluationPermissions] Firestore error:', err);
      throw err;
    }
    return Promise.all(snap.docs.map(async (d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        patientKey: (data['patientKey'] as string) || '',
        testType: (data['testType'] as string) || '',
        allowed: Boolean(data['allowed']),
        enabledBy: await this.resolveString(data['enabledBy']),
        reason: await this.resolveString(data['reason']),
        updatedAt: (data['updatedAt'] as string) || '',
        lastConsumedAt: (data['lastConsumedAt'] as string) || undefined
      } as ReevaluationPermission;
    }));
  }

  private async ensureFirebaseAuth(): Promise<void> {
    if (firebaseAuth.currentUser) {
      return;
    }

    try {
      await signInAnonymously(firebaseAuth);
    } catch (error: unknown) {
      const details = error instanceof Error ? error.message : 'No se pudo autenticar en Firebase.';
      throw new Error(`No se pudo iniciar sesión anónima en Firebase. Verifique que Authentication > Sign-in method > Anonymous esté habilitado. Detalle: ${details}`);
    }
  }

  private mapFirestoreError(error: unknown): Error {
    const message = error instanceof Error ? error.message : 'Error desconocido de Firebase.';

    if (message.includes('Missing or insufficient permissions')) {
      return new Error('Firebase rechazó la operación por permisos. Configure reglas de Firestore para permitir acceso autenticado (request.auth != null).');
    }

    return new Error(`No se pudo completar la operación en Firebase: ${message}`);
  }
}
