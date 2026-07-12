import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router'; // 👈 Added ActivatedRoute here
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../../models/request';
import { NotificationServiceService } from '../../../services/notification-service.service';
import { PushNotificationService } from '../../../services/push-notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule, MATERIAL_COMPONENTS],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  subscription: Subscription[] = [];
  returnUrl: string = ''; // 🚀 Track deep-link paths securely across login validation events
isLoading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute, // 👈 Inject ActivatedRoute here
    private authService: AuthService,
    private pushService: PushNotificationService,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit() {
    this.createFormGroup();

    // 🚀 Grab the returnUrl query parameter string if it was appended by the route guard
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';
  }

  createFormGroup() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onLogin(): void {
    this.isLoading = true; 
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); 
      this.isLoading = false; // Reset loading state
      return;
    }

    const payload: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(payload).subscribe({
      next: (employeeResponse) => {
        this.isLoading = false; // Reset loading state
        console.log('Backend verified profile payload:', employeeResponse);

        localStorage.setItem('scandic_eden_session', JSON.stringify(employeeResponse));
        
        // Links the browser token exclusively to this active user row
        this.pushService.subscribeUserDevice(employeeResponse.id);

        // 🚀 THE REDIRECT FIX: Check if a dynamic target deep-link route is stored
        if (this.returnUrl) {
          console.log(`Redirecting user straight to original destination: ${this.returnUrl}`);
          this.router.navigateByUrl(this.returnUrl);
        } else {
          // Standard conditional fallback matching rules
          if (employeeResponse.role === 'TeamLeader' || employeeResponse.isTeamLeader === true) {
            this.router.navigate(['/workspace/leader-dashboard']);
          } else {
            this.router.navigate(['/workspace/housekeeper-dashboard']);
          }
        }
      },
      error: (err) => {
        console.error('API connection or credentials rejected:', err);
        this.isLoading = false; // Reset loading state
        alert(err.error || 'Authentication failed. Please verify your credentials.');
      }
    });
  }

  ngOnDestroy(): void { }
}