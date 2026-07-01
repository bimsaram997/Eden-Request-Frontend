import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, Subject } from '@microsoft/signalr';
@Injectable({
  providedIn: 'root'
})
export class NotificationServiceService {

  private hubConnection!: HubConnection;
  // Real-time reactive data pipelines
  public leaderNewRequests$ = new Subject<any>(); 
  public housekeeperStatusUpdates$ = new Subject<any>();
  private alertSound = new Audio('notification-alert.mp3');

  constructor() { }
 public startConnection(userEmail: string, userRole: string): void {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:44356/notificationHub') 
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log(`SignalR connection active for: ${userEmail}`);
        this.hubConnection.invoke('JoinUserByRole', userEmail, userRole);
      })
      .catch(err => console.error('SignalR Startup Error:', err));

    this.hubConnection.on('ReceiveNewRequestAlert', (data) => {
      this.leaderNewRequests$.next(data);
      this.triggerDeviceAlert();
    });

    this.hubConnection.on('ReceiveStatusUpdate', (data) => {
      this.housekeeperStatusUpdates$.next(data);
      this.triggerDeviceAlert();
    });
  }

  private triggerDeviceAlert(): void {
    // 1. Reset and play sound safely
    this.alertSound.currentTime = 0;
    this.alertSound.play()
      .then(() => {
        console.log('Notification alert sound played successfully.');
      })
      .catch((err) => {
        // 🔇 Gracefully catch browser interaction blocks on fresh reload
        alert('Audio autoplay blocked. User needs to interact with the page first.');
      });

    // 2. Trigger vibration safely
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400]);
      } catch (err) {
        // 📳 Gracefully catch browser [Intervention] restriction blocks on fresh reload
        console.warn('Vibration blocked. User needs to interact with the page first.', err);
      }
    }
  }
}
