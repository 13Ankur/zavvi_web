import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ModalService, ModalConfig } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9) translateY(-20px)' }),
        animate('300ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0, transform: 'scale(0.95) translateY(-10px)' }))
      ])
    ])
  ],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="onOverlayClick()" [@fadeIn]>
      <div class="modal-container" (click)="$event.stopPropagation()" [@slideIn]>
        <div class="modal-header" [class]="'modal-' + config?.type">
          <span class="material-icons modal-icon">{{ config?.icon }}</span>
        </div>
        
        <div class="modal-body">
          <h2 class="modal-title">{{ config?.title }}</h2>
          <p class="modal-message">{{ config?.message }}</p>
        </div>
        
        <div class="modal-footer">
          <button 
            *ngIf="config?.type === 'confirm'" 
            class="modal-btn modal-btn-cancel"
            (click)="onCancel()">
            {{ config?.cancelText || 'Cancel' }}
          </button>
          <button 
            class="modal-btn modal-btn-confirm"
            [class.modal-btn-full]="config?.type !== 'confirm'"
            (click)="onConfirm()">
            {{ config?.confirmText || 'OK' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    .modal-container {
      background: white;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    :host-context(.dark-mode) .modal-container {
      background: var(--bg-primary);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
    }

    .modal-header {
      padding: 32px 24px 24px;
      text-align: center;
    }

    .modal-icon {
      font-size: 64px;
      display: inline-block;
    }

    .modal-success .modal-icon { color: #10b981; }
    .modal-error .modal-icon { color: #ef4444; }
    .modal-warning .modal-icon { color: #f59e0b; }
    .modal-info .modal-icon { color: #3b82f6; }
    .modal-confirm .modal-icon { color: #6C47FF; }

    .modal-body {
      padding: 0 24px 24px;
      text-align: center;
    }

    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 0 12px;
      color: #1f2937;
    }

    :host-context(.dark-mode) .modal-title {
      color: var(--text-dark);
    }

    .modal-message {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      line-height: 1.6;
    }

    :host-context(.dark-mode) .modal-message {
      color: var(--text-medium);
    }

    .modal-footer {
      padding: 16px 24px 24px;
      display: flex;
      gap: 12px;
    }

    .modal-btn {
      flex: 1;
      padding: 14px 24px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .modal-btn-full {
      flex: 1;
    }

    .modal-btn-confirm {
      background: linear-gradient(135deg, #6C47FF, #5b86e5);
      color: white;
    }

    .modal-btn-confirm:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(108, 71, 255, 0.4);
    }

    .modal-btn-confirm:active {
      transform: translateY(0);
    }

    .modal-btn-cancel {
      background: #f3f4f6;
      color: #6b7280;
    }

    :host-context(.dark-mode) .modal-btn-cancel {
      background: rgba(255, 255, 255, 0.1);
      color: var(--text-medium);
    }

    .modal-btn-cancel:hover {
      background: #e5e7eb;
    }

    :host-context(.dark-mode) .modal-btn-cancel:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(-20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    /* Mobile Responsive */
    @media (max-width: 480px) {
      .modal-container {
        max-width: calc(100vw - 32px);
      }

      .modal-header {
        padding: 24px 20px 20px;
      }

      .modal-icon {
        font-size: 56px;
      }

      .modal-title {
        font-size: 1.25rem;
      }

      .modal-message {
        font-size: 0.9375rem;
      }

      .modal-footer {
        flex-direction: column-reverse;
      }

      .modal-btn {
        width: 100%;
      }
    }
  `]
})
export class ModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  config: ModalConfig | null = null;
  private subscription: Subscription | null = null;

  constructor(private modalService: ModalService) {}

  ngOnInit() {
    this.subscription = this.modalService.modal$.subscribe((config) => {
      this.config = config;
      this.isOpen = true;
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onOverlayClick() {
    if (this.config?.type !== 'confirm') {
      this.close();
    }
  }

  onConfirm() {
    this.modalService.closeModal(true);
    this.close();
  }

  onCancel() {
    this.modalService.closeModal(false);
    this.close();
  }

  private close() {
    this.isOpen = false;
    setTimeout(() => {
      this.config = null;
    }, 300);
  }
}

