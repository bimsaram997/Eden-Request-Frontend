import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; 
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  readonly VAPID_PUBLIC_KEY = "BM_zv_20Wct-5d_mzZQvOH61AN1laP6ZEIHZ9i7IB6eBPVhbl4U8KzFG_qTggrjfUMoc-5dPJ9d-12QeUQibmvE";
  
  baseUrl = environment.baseUrl;

  constructor(
    private swPush: SwPush, 
    private http: HttpClient,
    private router: Router 
  ) {
    this.swPush.notificationClicks.subscribe(event => {
      console.log('User clicked notification banner:', event);
      const targetUrl = event.notification.data?.url;
      if (targetUrl) {
        this.router.navigateByUrl(targetUrl);
      }
    });
  }

  // 🗑️ Cleans up old registration states and registers a fresh token using new keys
  public async resetAndSubscribeUserDevice(employeeId: number): Promise<void> {
    if (!this.swPush.isEnabled) {
      console.warn("PWA Service Worker features are disabled or unsupported on this browser.");
      return;
    }

    console.log("Cleaning up old registration states to enforce new VAPID keys...");
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();

      if (existingSubscription) {
        console.log("🗑️ Unsubscribing old active device registration...");
        await existingSubscription.unsubscribe();
      }

      console.log("✨ Requesting fresh push notification permission prompt with new keys...");
      
      // Convert VAPID string into the binary byte buffer required by the browser engine
      const applicationServerKey = this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY);

      // 🟢 'as any' cast bypasses the strict generic TypeScript definition conflict safely
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      });

      console.log('🎉 SUCCESS: Fresh Subscription object resolved:', newSubscription);
      const subJson = newSubscription.toJSON();
      
      const payload = {
        pushEndpoint: subJson.endpoint,
        pushP256DH: subJson.keys?.['p256dh'],
        pushAuth: subJson.keys?.['auth']
      };

      console.log("📡 Sending fresh token payload to API:", payload);

      this.http.put(`${this.baseUrl}/Employee/${employeeId}/push-token`, payload)
        .subscribe({
          next: () => console.log('✅ Fresh device push tokens successfully saved to backend database.'),
          error: (err) => console.error('❌ Failed to save fresh device tokens to API:', err)
        });

    } catch (err) {
      console.error('❌ Error handling clean device subscription sequence:', err);
    }
  }

  // Maps legacy invocation points over to the clean async method structure smoothly
  public subscribeUserDevice(employeeId: number): void {
    this.resetAndSubscribeUserDevice(employeeId);
  }

  /**
   * Helper utility: Validates string padding bounds and strips url-safe base64 tokens into a native byte array format.
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}