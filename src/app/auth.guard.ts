import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // 🚀 MUST match the exact key name you saved in your LoginComponent!
  const sessionData = localStorage.getItem('scandic_eden_session'); 

  if (sessionData) {
    // User is logged in! Let them through to the workspace
    return true; 
  }

  // If NOT logged in, save the workspace path they wanted to visit
  console.warn(`Unauthenticated access to ${state.url}. Redirecting to login...`);
  
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};