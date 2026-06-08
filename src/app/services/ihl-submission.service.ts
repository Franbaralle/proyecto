import { Injectable } from '@angular/core';
import { firebaseConfig } from '../config/firebase.config';
import { firebaseAuth, firestoreDb } from '../config/firebase.app';
import { IhlDataService } from './ihl-data.service';
import { CryptoService } from './crypto.service';
import { addDoc, collection, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class IhlSubmissionService {
  private readonly attemptsCollection = 'bdiResultados';
  private readonly reevaluationCollection = 'testReevaluationPermissions';
  private readonly testType = 'IHL';

  constructor(
    private readonly ihlData: IhlDataService,
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

  private async buildPayload(): Promise<Record<string, unknown>> {
    const patientKey = await this.cryptoService.hmac(this.normalize(this.ihlData.patient.nombreApellidos));

    return {
      creadoEn: new Date().toISOString(),
      pacienteNombreLower: patientKey,
      patientKey,
      patientEmail: await this.cryptoService.encryptJson(this.normalize(this.ihlData.patient.email)),
      testType: this.testType,
      paciente: await this.cryptoService.encryptJson(this.ihlData.patient),
      profesional: await this.cryptoService.encryptJson(this.ihlData.professional),
      respuestas: await this.cryptoService.encryptResponses(this.ihlData.responses),
      partB: await this.cryptoService.encryptJson(this.ihlData.partB),
      puntajeTotal: await this.cryptoService.encryptJson(this.ihlData.totalScore),
      nivelDepresion: await this.cryptoService.encryptJson(this.ihlData.hostigamientoLevel),
      diagnosticoGlobal: await this.cryptoService.encryptJson(`Diagnóstico global preliminar del IHL: ${this.ihlData.totalScore} puntos.`),  
      triangulacion: await this.cryptoService.encryptJson([])
    };
  }

  private async saveAsCurrentAttempt(): Promise<void> {
    const payload = await this.buildPayload();
    const patientKey = String(payload['patientKey'] || '');
    const testType = String(payload['testType'] || this.testType);

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
      throw new Error('Este paciente ya tiene un intento vigente para IHL. Habilite reevaluación para permitir un nuevo intento.');
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

  private async resolveResponses(raw: unknown): Promise<number[]> {
    if (typeof raw === 'string') { return this.cryptoService.decryptResponses(raw); }
    if (Array.isArray(raw)) { return raw as number[]; }
    return [];
  }

  private async resolveString(raw: unknown): Promise<string> {
    if (typeof raw !== 'string' || raw === '') { return ''; }
    const decrypted = await this.cryptoService.decryptJson<string>(raw, '__LEGACY__');
    return decrypted === '__LEGACY__' ? raw : decrypted;
  }

  private mapFirestoreError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error('Error al guardar en Firebase.');
  }

  private async ensureFirebaseAuth(): Promise<void> {
    if (!firebaseAuth.currentUser) {
      await signInAnonymously(firebaseAuth);
    }
  }
}
