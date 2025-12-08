import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

export interface ModalResult {
  confirmed: boolean;
  value?: any;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalSubject = new Subject<ModalConfig>();
  private resultSubject = new Subject<ModalResult>();

  modal$ = this.modalSubject.asObservable();
  result$ = this.resultSubject.asObservable();

  /**
   * Show a success message
   */
  success(message: string, title: string = 'Success'): Promise<void> {
    return this.showModal({
      title,
      message,
      type: 'success',
      icon: 'check_circle',
      confirmText: 'OK'
    });
  }

  /**
   * Show an error message
   */
  error(message: string, title: string = 'Error'): Promise<void> {
    return this.showModal({
      title,
      message,
      type: 'error',
      icon: 'error',
      confirmText: 'OK'
    });
  }

  /**
   * Show a warning message
   */
  warning(message: string, title: string = 'Warning'): Promise<void> {
    return this.showModal({
      title,
      message,
      type: 'warning',
      icon: 'warning',
      confirmText: 'OK'
    });
  }

  /**
   * Show an info message
   */
  info(message: string, title: string = 'Info'): Promise<void> {
    return this.showModal({
      title,
      message,
      type: 'info',
      icon: 'info',
      confirmText: 'OK'
    });
  }

  /**
   * Show a confirmation dialog
   */
  confirm(message: string, title: string = 'Confirm', confirmText: string = 'Yes', cancelText: string = 'No'): Promise<boolean> {
    return new Promise((resolve) => {
      this.showModal({
        title,
        message,
        type: 'confirm',
        icon: 'help',
        confirmText,
        cancelText
      }).then(() => {
        const subscription = this.result$.subscribe((result) => {
          resolve(result.confirmed);
          subscription.unsubscribe();
        });
      });
    });
  }

  private showModal(config: ModalConfig): Promise<void> {
    return new Promise((resolve) => {
      this.modalSubject.next(config);
      
      // If not a confirm dialog, auto-resolve after showing
      if (config.type !== 'confirm') {
        setTimeout(() => resolve(), 100);
      } else {
        resolve();
      }
    });
  }

  closeModal(confirmed: boolean = false, value?: any): void {
    this.resultSubject.next({ confirmed, value });
  }
}

