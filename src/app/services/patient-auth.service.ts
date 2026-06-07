import { Injectable } from '@angular/core';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { firebaseAuth } from '../config/firebase.app';

@Injectable({ providedIn: 'root' })
export class PatientAuthService {
  private _currentUser: User | null = null;
  private readonly _initPromise: Promise<void>;

  constructor() {
    this._initPromise = new Promise((resolve) => {
      onAuthStateChanged(firebaseAuth, (user) => {
        this._currentUser = user;
        resolve();
      });
    });
  }

  get currentUser(): User | null {
    return this._currentUser;
  }

  get isLoggedIn(): boolean {
    return this._currentUser !== null;
  }

  get currentUid(): string | null {
    return this._currentUser?.uid ?? null;
  }

  get currentEmail(): string | null {
    return this._currentUser?.email ?? null;
  }

  waitForInit(): Promise<void> {
    return this._initPromise;
  }

  async register(email: string, password: string): Promise<User> {
    const credential = await createUserWithEmailAndPassword(
      firebaseAuth,
      email.trim().toLowerCase(),
      password
    );

    // Esperar a que onAuthStateChanged confirme el nuevo usuario.
    // Esto garantiza que el SDK interno de Firestore ya procesó el token
    // antes de intentar cualquier escritura en la base de datos.
    await new Promise<void>((resolve) => {
      const unsub = onAuthStateChanged(firebaseAuth, (u) => {
        if (u?.uid === credential.user.uid) {
          unsub();
          resolve();
        }
      });
    });

    this._currentUser = credential.user;
    return credential.user;
  }

  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(
      firebaseAuth,
      email.trim().toLowerCase(),
      password
    );
    this._currentUser = credential.user;
    return credential.user;
  }

  async logout(): Promise<void> {
    await signOut(firebaseAuth);
    this._currentUser = null;
  }
}
