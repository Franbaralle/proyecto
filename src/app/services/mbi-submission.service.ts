import { Injectable } from '@angular/core';
import { firebaseConfig } from '../config/firebase.config';
import { firebaseAuth, firestoreDb } from '../config/firebase.app';
import { CryptoService } from './crypto.service';
import { addDoc, collection, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

export interface MBIPatientData {
  nombre: string;
  edad?: number;
  area?: string;
  observaciones?: string;
}

export interface MBIProfessionalData {
  nombre: string;
  matricula?: string;
}

export interface StoredMBIResult {
  id: string;
  creadoEn: string;
  testType: string;
  patientKey: string;
  intentoNumero: number;
  isCurrent: boolean;
  diagnosticoGlobal: string;
  paciente: MBIPatientData;
  profesional: MBIProfessionalData;
  respuestas: number[];
  ae: number;
  d: number;
  rp: number;
  aeCategoria: string;
  dCategoria: string;
  rpCategoria: string;
  indiciosBurnout: number;
  resultadoGlobal: string;
}

@Injectable({
  providedIn: 'root'
})
export class MbiSubmissionService {
  private readonly attemptsCollection = 'mbiResultados';
  
  private paciente: MBIPatientData | null = null;
  private profesional: MBIProfessionalData | null = null;
  private respuestas: number[] = [];
  private puntajes: any = null;

  constructor(
    private readonly cryptoService: CryptoService
  ) {}

  get isFirebaseConfigured(): boolean {
    return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
  }

  setPaciente(data: MBIPatientData): void {
    this.paciente = data;
  }

  setProfesional(data: MBIProfessionalData): void {
    this.profesional = data;
  }

  setRespuestas(respuestas: number[]): void {
    this.respuestas = respuestas;
  }

  setPuntajes(puntajes: any): void {
    this.puntajes = puntajes;
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

  private async saveAsCurrentAttempt(): Promise<void> {
    if (!this.paciente || !this.profesional || !this.puntajes) {
      throw new Error('Datos incompletos para guardar el resultado');
    }

    const patientKey = this.cryptoService.hashPatientName(this.paciente.nombre);
    
    // Marcar intentos anteriores como no actuales
    await this.markPreviousAttemptsAsOld(patientKey);

    // Obtener el número de intento
    const intentoNumero = await this.getNextAttemptNumber(patientKey);

    // Crear el nuevo resultado
    const nuevoResultado: Omit<StoredMBIResult, 'id'> = {
      creadoEn: new Date().toISOString(),
      testType: 'MBI',
      patientKey,
      intentoNumero,
      isCurrent: true,
      diagnosticoGlobal: this.puntajes.resultadoGlobal,
      paciente: this.paciente,
      profesional: this.profesional,
      respuestas: this.respuestas,
      ae: this.puntajes.ae,
      d: this.puntajes.d,
      rp: this.puntajes.rp,
      aeCategoria: this.puntajes.aeCategoria,
      dCategoria: this.puntajes.dCategoria,
      rpCategoria: this.puntajes.rpCategoria,
      indiciosBurnout: this.puntajes.indiciosBurnout,
      resultadoGlobal: this.puntajes.resultadoGlobal
    };

    await addDoc(collection(firestoreDb, this.attemptsCollection), nuevoResultado);
  }

  private async markPreviousAttemptsAsOld(patientKey: string): Promise<void> {
    const q = query(
      collection(firestoreDb, this.attemptsCollection),
      where('patientKey', '==', patientKey),
      where('isCurrent', '==', true)
    );

    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(doc => 
      updateDoc(doc.ref, { isCurrent: false })
    );

    await Promise.all(updates);
  }

  private async getNextAttemptNumber(patientKey: string): Promise<number> {
    const q = query(
      collection(firestoreDb, this.attemptsCollection),
      where('patientKey', '==', patientKey),
      orderBy('intentoNumero', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 1;
    }

    const lastAttempt = snapshot.docs[0].data() as StoredMBIResult;
    return lastAttempt.intentoNumero + 1;
  }

  private async ensureFirebaseAuth(): Promise<void> {
    if (!firebaseAuth.currentUser) {
      await signInAnonymously(firebaseAuth);
    }
  }

  private mapFirestoreError(error: unknown): Error {
    if (error instanceof Error) {
      const message = error.message;
      
      if (message.includes('Missing or insufficient permissions')) {
        return new Error('Permisos insuficientes en Firestore. Revise las reglas de seguridad.');
      }
      
      if (message.includes('PERMISSION_DENIED')) {
        return new Error('Acceso denegado. Verifique las reglas de Firestore.');
      }
      
      if (message.includes('not found') || message.includes('does not exist')) {
        return new Error('La colección no existe. Verifique la configuración de Firestore.');
      }
      
      return error;
    }
    
    return new Error('Error desconocido al guardar en Firestore');
  }

  reset(): void {
    this.paciente = null;
    this.profesional = null;
    this.respuestas = [];
    this.puntajes = null;
  }
}
