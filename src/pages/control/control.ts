import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { Component, NgZone } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController } from 'ionic-angular';
import { DataProvider } from '../../providers/data.provider';
import nipplejs from 'nipplejs';
import { ViewController } from 'ionic-angular/navigation/view-controller';
import { ModalController } from 'ionic-angular/components/modal/modal-controller';


@IonicPage()
@Component({
    selector: 'page-control',
    templateUrl: 'control.html',
})
export class ControlPage {

    currentDevice: any;
    maxSpeed: number = 10;
    currentSpeed: number = 5;
    speedInterval: any = null;
    currentDirection = null;
    lastExecuted = 0;

    currentAction = null;
    currentLightStatus = false;
    currentBuzzerStatus = false;
    buzzerDuration = 1000;
    buzzerTimeout = null;

    nipple: any;

    devicePrograms: any[];

    // Ordenarlo por frecuencia de uso para reducir checks
    joysticBreakpoints = [
        { direction: 'U', breakpoints: [67.5, 112.5] }, // Arriba
        { direction: '1', breakpoints: [112.5, 157.5] }, // Arriba izq
        { direction: '2', breakpoints: [22.5, 67.5] }, // Arriba der
        { direction: 'R', breakpoints: [337.5, 22.5] }, // der
        { direction: 'L', breakpoints: [157.5, 202.5] }, // izq
        { direction: 'D', breakpoints: [247.5, 292.5] }, // abajo
        { direction: '4', breakpoints: [202.5, 247.5] }, // abajo izq
        { direction: '3', breakpoints: [292.5, 337.5] } // abajo der
    ];

    joystickDeadzone = 0.4;

    constructor(public navCtrl: NavController, public navParams: NavParams, public zone: NgZone, private dataProvider: DataProvider, public actionSheetCtrl: ActionSheetController, public modalCtrl: ModalController) {
        this.currentDevice = navParams.get('device');
    }

    ionViewWillEnter() {
        this.devicePrograms = this.dataProvider.getDevicePrograms();
    }

    ionViewDidLoad() {
        this.currentLightStatus = this.dataProvider.getLightStatus();
        this.currentSpeed = this.dataProvider.getSpeed();
        const that = this;

        // Hack: Evita bugs con la renderizacion de nipplejs en un elemento no visible
        setTimeout(() => {

            this.nipple = nipplejs.create({
                zone: document.getElementById('trx-joystick'),
                mode: 'static',
                position: { left: '50%', top: '50%' },
                size: 125,
                color: '#D0250C'
            });

            this.nipple.on('start', function (evt, data) {
                if (that.currentAction !== null) {
                    that.stopCurrentProgram();
                }
            });

            this.nipple.on('move', function (evt, data) {
                /**                const position = {
                                    x: data.position.x - data.instance.position.x,
                                    y: data.instance.position.y - data.position.y,
                                };
                **/

                if (data.force > that.joystickDeadzone) {

                    const millis = new Date().getTime();
                    if (millis > that.lastExecuted + 250) {
                        const angle = data.angle.degree;

                        let direction = 'K';

                        for (let i = 0; i < that.joysticBreakpoints.length; i++) {
                            const e = that.joysticBreakpoints[i];

                            // Debido a que los angulos de R (derecha) hacen un loop en grados, se tratan de forma especial
                            if (e.direction !== 'R') {
                                if (e.breakpoints[0] <= angle && angle < e.breakpoints[1]) {
                                    direction = e.direction;
                                    break;
                                }
                            } else if (0 <= angle && angle < e.breakpoints[1]
                                || e.breakpoints[0] <= angle && angle < 360) {
                                direction = e.direction; // R
                                break;
                            }

                        }

                        that.dataProvider.btChangeDirection(direction);
                        that.lastExecuted = millis;
                    }
                }
            });

            this.nipple.on('end', function (evt, data) {
                that.dataProvider.btMoveStop();
            });
        }, 1000);

    }

    ionViewWillLeave() {
        if (this.speedInterval) {
            clearInterval(this.speedInterval);
        }

        // Desconectar bluetooth cuando se salga de esta pagina
        this.dataProvider.btDisconnect();

    }

    public onChange($event: any): void {
        this.dataProvider.btMove($event.deltaX, $event.deltaY);
    }

    public startedChangingSpeed(e) {

        if (!this.speedInterval) {
            this.zone.run(() => {
                this.dataProvider.btSetSpeed(this.currentSpeed);
            });
            this.speedInterval = setInterval(() => {
                this.zone.run(() => {
                    this.currentSpeed = this.dataProvider.btSetSpeed(this.currentSpeed);
                });
            }, 333);
        }

    }

    public stoppedChangingSpeed() {
        if (this.speedInterval) {
            clearInterval(this.speedInterval);

            this.zone.run(() => {
                this.speedInterval = null;
                this.currentSpeed = Math.round(this.currentSpeed);
            });
        }
    }

    public increaseSpeed() {
        this.zone.run(() => {
            this.currentSpeed = this.dataProvider.btSetSpeed(Math.min(this.currentSpeed + 1, this.maxSpeed));
        });
        console.log(this.currentSpeed);
    }

    public decreaseSpeed() {
        this.zone.run(() => {
            this.currentSpeed = this.dataProvider.btSetSpeed(Math.max(this.currentSpeed - 1, 0));
        });
        console.log(this.currentSpeed);
    }

    public soundBuzzer() {
        this.zone.run(() => {
            this.currentBuzzerStatus = true;
        });
        this.dataProvider.btSoundBuzzer();
    }

    public onBuzzerStop() {
        if (this.buzzerTimeout) {
            clearTimeout(this.buzzerTimeout);
            this.buzzerTimeout = null;
        }

        this.buzzerTimeout = setTimeout(() => {

            this.zone.run(() => {
                this.currentBuzzerStatus = false;
            });
        }, this.buzzerDuration);
    }

    public toggleLights() {
        this.zone.run(() => {
            this.currentLightStatus = !this.currentLightStatus;
        });
        this.dataProvider.btToggleLights(this.currentLightStatus);
    }

    public stopCurrentProgram() {
        this.dataProvider.btStopCurrentProgram();
        this.currentAction = null;
    }

    public presentProgramList() {

        const buttons = this.devicePrograms.map(e => {
            return {
                text: e.name,
                role: e.id,
                handler: () => {
                    this.dataProvider.btExecuteProgram(e.id);
                    this.currentAction = e.action;
                }
            }
        })

        let actionSheet = this.actionSheetCtrl.create({
            title: 'Seleccione Programa',
            buttons: buttons
        });
        actionSheet.present();
    }

    public openSettings() {

        let settingsModal = this.modalCtrl.create(DeviceSettings, { device: this.currentDevice });
        settingsModal.onDidDismiss(data => {

            if (data.status) {
                this.dataProvider.btRename(this.currentDevice.name);
                this.dataProvider.storeDevice(this.currentDevice);
            }

        });
        settingsModal.present();
    }

}

@Component({
    selector: 'page-device-settings',
    template: `
        <ion-header>
            <ion-navbar>
                <ion-title>
                    Editando Dispositivo
                </ion-title>
            </ion-navbar>
        </ion-header>
        <ion-content style="background-color: #fff;">
            <h3>Nombre del dispositivo</h3>
            <ion-input type="text" value="{{device.name}}" (change)="changeName($event)" placeholder="Nombre dispositivo" max="18"></ion-input>

            <h3>ID del Dispositivo</h3>
            <div>{{device.id}}</div>

            <button ion-button (click)="dismiss(false)">Cancelar</button>
            <button ion-button (click)="dismiss(true)">Guardar</button>
        </ion-content>
    `,
})

export class DeviceSettings {

    device: any;
    tempName: string;
    constructor(public viewCtrl: ViewController, public navParams: NavParams, private toastCtrl: ToastController) {

        this.device = navParams.get('device');
        this.tempName = this.device.name + '';
    }

    changeName(e) {
        const newName = e.target.value.trim();
        if (newName.length > 0) {
            this.tempName = newName;
        }
        else {
            e.target.value = this.tempName;
        }
    }
    dismiss(status) {
        if (status) {
            this.device.name = this.tempName;

            let toast = this.toastCtrl.create({
                message: 'Configuraciones guardadas',
                duration: 5000
            });
            toast.present();
        }

        let data = { 'device': this.device, 'status': status };
        this.viewCtrl.dismiss(data);
    }



}
