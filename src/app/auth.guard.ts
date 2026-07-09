import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // 🚀 MUST match the exact key name you saved in your LoginComponent!
 const sessionData = localStorage.getItem('scandic_eden_session'); 

  if (sessionData) {
    try {
      const parsedSession = JSON.parse(sessionData);
      // Ensure the session object has a valid token or ID property
      if (parsedSession && (parsedSession.id || parsedSession.token)) {
        return true; // Authenticated! Let them through to the request detail
      }
    } catch (e) {
      console.error("Failed to parse auth session", e);
    }
  }

  // 🚨 If NOT logged in, save the path AND the query parameters (?id=X)
  console.warn(`Unauthenticated deep-link access to ${state.url}. Redirecting...`);
  
  router.navigate(['/login'], { 
    queryParams: { 
      returnUrl: state.url,
      id: route.queryParams['id'] // Preserves the notification ID across the login bounce
    } 
  });
  return false;
};