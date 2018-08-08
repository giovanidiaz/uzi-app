import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import { ToastController } from 'ionic-angular/components/toast/toast-controller';
import { AlertController } from 'ionic-angular/components/alert/alert-controller';
import { DataProvider } from '../../providers/data.provider';
import { ControlPage } from '../control/control';
import { Platform } from 'ionic-angular/platform/platform';

/**
 * Generated class for the ConnectPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-connect',
  templateUrl: 'connect.html',
})
export class ConnectPage {

  knownDevices = [];
  btScanning = false;
  availableDevices: any[];
  connectingToDevice = null;

  constructor(public navCtrl: NavController, public navParams: NavParams, public toastCtrl: ToastController, private alertCtrl: AlertController, private dataProvider: DataProvider, private platform: Platform) {
  }

  ionViewWillEnter() {
    this.knownDevices = this.dataProvider.getKnownDevices();

    /*     console.log('JSON.stringify(this.knownDevices)');
        console.log(JSON.stringify(this.knownDevices)); */

  }

  ionViewDidEnter() {

    this.platform.ready().then(() => {

      this.scanDevices();

    });
  }

  scanDevices(refresher = null) {

    console.log('Scanning!!!');
    this.btScanning = true;
    this.availableDevices = [];
    this.dataProvider.btScan().subscribe(
      device => {
        this.dataProvider.onDeviceDiscovered(device);

        console.log('result!');
        console.log(this.dataProvider.availableDevices);

      },
      error => {
        let toast = this.toastCtrl.create({
          message: 'Error al buscar dispostivos bluetooth',
          duration: 5000
        });
        toast.present();
        console.log(error);
      },
      () => {
        console.log('finish!');
      }
    );

    setTimeout(() => {
      this.dataProvider.btStopScan();
      this.btScanning = false;

      if (refresher !== null) {
        refresher.complete();
      }

      this.availableDevices = this.dataProvider.getAvailableDevices();

      console.log('available devices!');
      console.log(this.availableDevices);

      /*     console.log('JSON.stringify(this.availableDevices)');
          console.log(JSON.stringify(this.availableDevices)); */
    }, 5000);
  }

  connectToDevice(deviceId) {
    if (this.connectingToDevice !== null || this.btScanning) {
      return;
    }


    const availableDevice = this.getAvailableDevice(deviceId);

    if (!availableDevice) {
      let confirm = this.alertCtrl.create({
        title: 'Olvidar dispositivo?',
        message: 'Este dispositivo no se encuentra disponible.<br/>Desea olvidar este dispositivo?',
        buttons: [
          {
            text: 'Olvidar',
            handler: () => {
              this.dataProvider.forgetDevice(deviceId);
              this.knownDevices = this.dataProvider.getKnownDevices();
            }
          },
          {
            text: 'No',
            handler: () => {
              console.log('No');
            }
          }
        ]
      });
      confirm.present();

      return;
    }


    this.connectingToDevice = availableDevice.id;

    this.dataProvider.btConnect(availableDevice.id).subscribe(
      peripheral => {

        console.log('peripheral');
        console.log(JSON.stringify(peripheral));

        this.connectingToDevice = null;
        this.dataProvider.storeDevice(availableDevice);

        this.navCtrl.push(ControlPage, {
          device: availableDevice
        });

        //this.dataProvider.onConnected(peripheral);
      },
      peripheral => {
        this.connectingToDevice = null;
        let toast = this.toastCtrl.create({
          message: 'Dispositivo desconectado',
          duration: 3000
        });
        toast.present();
        this.navCtrl.setRoot(ConnectPage);
      }
    );

  }

  getAvailableDevice(deviceId) {
    let available = null;

    if (this.availableDevices) {
      for (let i = 0; i < this.availableDevices.length; i++) {

        if (this.availableDevices[i].id === deviceId) {
          available = this.availableDevices[i];
          break;
        }

      }
    }

    return available;
  }

}
