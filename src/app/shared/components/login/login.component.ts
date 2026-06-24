import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MATERIAL_COMPONENTS } from '../../utils/material-imports';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { LoginRequest } from '../../../models/request';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterModule,
    MATERIAL_COMPONENTS],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit, OnDestroy{
loginForm!: FormGroup;
  subscription: Subscription[] = [];

  constructor(private fb: FormBuilder,
    private router: Router,
  private authService: AuthService,) {

  }

   ngOnInit() {
    this.createFormGroup();
  }

  createFormGroup() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
onLogin(): void {
    // Guard tracking form validity state
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched(); // Force validation styles to render immediately
      return;
    }

    const payload: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // Submitting payload directly to the data-transport service layer
    this.authService.login(payload).subscribe({
      next: (employeeResponse) => {
        console.log('Backend verified profile payload:', employeeResponse);
        
        // 1. Storage management is completed entirely within the component
        localStorage.setItem('scandic_eden_session', JSON.stringify(employeeResponse));

        // 2. Conditional navigation matching the properties returned from your C# service
        if (employeeResponse.role === 'TeamLeader' || employeeResponse.isTeamLeader === true) {
          //this.router.navigate(['/workspace/dashboard']);
        } else {
         this.router.navigate(['/workspace/housekeeper-dashboard']);
        }
      },
      error: (err) => {
        console.error('API connection or credentials rejected:', err);
        // Extracts the explicit backend ex.Message string if provided by your try/catch block
        alert(err.error || 'Authentication failed. Please verify your credentials.');
      }
    });
  }


   ngOnDestroy(): void {}
}
