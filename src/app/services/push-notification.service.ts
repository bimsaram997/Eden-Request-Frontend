import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment.prod';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  readonly VAPID_PUBLIC_KEY = "BJG4RvGGTYeHowRny5MucqHnxv5lhEP-fDc1rsHjAzidA0NtncIu0h4SxTc-4gksM9IkBYcod3wP0rU8WsuNVTY";
  
  baseUrl = environment.baseUrl;

  constructor(
    private swPush: SwPush, 
    private http: HttpClient,
    private router: Router 
  ) {
    // 🔔 Global Listener: Catches when a user clicks the system notification banner
    this.swPush.notificationClicks.subscribe(event => {
      console.log('User clicked notification banner:', event);
      
      const targetUrl = event.notification.data?.url;
      if (targetUrl) {
        console.log(`Routing user to: ${targetUrl}`);
        this.router.navigateByUrl(targetUrl);
      }
    });
  }

  public subscribeUserDevice(employeeId: number): void {
    if (!this.swPush.isEnabled) {
      console.warn("PWA Service Worker features are disabled or unsupported on this browser.");
      return;
    }

    console.log("Checking browser subscription state safely...");

    navigator.serviceWorker.ready.then((registration) => {
      return registration.pushManager.getSubscription();
    })
    .then((existingSubscription) => {
      // 🚀 If a token already exists, use it instead of recreating it!
      if (existingSubscription) {
        console.log("📦 Found healthy existing subscription token. Syncing to backend...");
        return existingSubscription; 
      }
      
      console.log("✨ No active token found. Requesting fresh push notification permission prompt...");
      
      // Angular's SwPush handles binary string extraction internally; string is required here.
      return this.swPush.requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY
      });
    })
    .then(subscription => {
      console.log('🎉 SUCCESS: Subscription object resolved:', subscription);
      const subJson = subscription.toJSON();
      
      const payload = {
        pushEndpoint: subJson.endpoint,
        pushP256DH: subJson.keys?.['p256dh'],
        pushAuth: subJson.keys?.['auth']
      };

      console.log("📡 Sending token payload to API:", payload);

      this.http.put(`${this.baseUrl}/Employee/${employeeId}/push-token`, payload)
        .subscribe({
          next: () => console.log('✅ Device push tokens successfully saved to backend database.'),
          error: (err) => console.error('❌ Failed to save device tokens to API:', err)
        });
    })
    .catch(err => {
      console.error('❌ Error handling push device subscription sequence:', err);
    });
  }
}