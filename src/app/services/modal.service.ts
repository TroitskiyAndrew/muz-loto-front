import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  message: string = '';
  showModal = false;
  $answer = new Subject<boolean>()

  constructor() { }

  openModal(message: string): Promise<boolean>{
    this.message = message;
    this.showModal = true;
    return new Promise((resolve) => {
      const sub = this.$answer.subscribe(answer => {
        sub.unsubscribe;
        resolve(answer);
      });
    });
  }

  submitAnswer(answer: boolean){
    this.showModal = false;
    this.message = '';
    this.$answer.next(answer);
  }

}
