import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogData, IDialogButton } from '../models/models';
import { DialogComponent } from '../components/dialog/dialog.component';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  private dialogResult$ = new Subject<{dialogId: number, result: any}>();

  constructor(private dialog: MatDialog) { }

  private open(data: DialogData): void {
    this.dialog.open(DialogComponent, { data });
  }

  init(data: DialogData): Promise<any> {
    const currentDialogId = Math.floor(Math.random() * 10001);
    data.buttons = data.buttons.map(button => this.createButton(button, currentDialogId));
    this.open(data);
    return new Promise((resolve) => {
      const subs$ = this.dialogResult$.subscribe((res) => {
        const {dialogId, result} = res;
        if(dialogId === currentDialogId){
          subs$.unsubscribe();
          resolve(result);
        }
      })
    })
  }

  popUp(data: Omit<DialogData, 'buttons'>, btnText?: string): Promise<any> {
    return this.init(({
      ...data,
      buttons: [ {
        label: btnText || "Ok",
        disabled: () => false,
        action: () => true,
      }]
    }));
  }

  createButton(button: IDialogButton, dialogId: number){
    return {
      ...button,
      action: () => {
        const actionResult = button.action()
        return (actionResult && actionResult.then ? actionResult : Promise.resolve(actionResult)).then((res: any) => {
          this.dialogResult$.next({result: res, dialogId});
          return res;
        });
      }
    }

  }

}
