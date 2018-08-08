import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BLE } from '@ionic-native/ble';




const COMMAND_SERVICE = 'dfb0';
const COMMAND_CHARACTERISTIC = 'dfb1';

const APP_STORAGE = 'tectronix_uzi';

const COMMANDS_STOP = 'K';
const COMMANDS_BUZZER = 'B';
const COMMANDS_LIGHTS = 'F';
const COMMANDS_RENAME = '#';

@Injectable()
export class DataProvider {

    availableDevices: any[];

    device: any = {
        id: 0,
        name: null,

        speed: 5,
        lightStatus: false,

        programs: [
            {
                id: '1',
                name: 'Seguidor de Líneas',
                action: 'Siguiendo líneas',
                type: 'demo'
            },
            {
                id: '2',
                name: 'Evasor de Obstáculos',
                action: 'Evadiendo obstáculos',
                type: 'demo'
            },
            {
                id: '3',
                name: 'Laberinto',
                action: 'Salir laberinto',
                type: 'demo'
            },
            {
                id: '4',
                name: 'Buzzer',
                action: 'Demo buzzer',
                type: 'demo'
            },
            {
                id: '5',
                name: 'RGB',
                action: 'Demo RGBs',
                type: 'demo'
            },
            {
                id: '6',
                name: 'UltraSonico',
                action: 'Demo Ultrasónico',
                type: 'demo'
            },
            {
                id: '7',
                name: 'QRES',
                action: 'Demo QRES',
                type: 'demo'
            }
        ]
    };

    peripheral: any;

    constructor(public http: HttpClient, private ble: BLE) {
    }

    btScan() {
        this.availableDevices = [];  // clear list
        console.log('btscan');
        return this.ble.startScan([]);
    }

    btStopScan(){
        this.ble.stopScan();
    }

    btConnect(deviceId) {

        const device = this.availableDevices.filter(e => {
            return e.id === deviceId;
        });

        if (device.length === 1) {
            this.device = {
                id: device[0].id,
                name: device[0].name,

                speed: 5,
                lastDirecton: null,
                lightStatus: false,

                programs: [
                    {
                        id: 'S',
                        name: 'Seguidor de Líneas',
                        action: 'Siguiendo líneas',
                        type: 'demo'
                    },
                    {
                        id: 'E',
                        name: 'Evasor de Obstáculos',
                        action: 'Evadiendo obstáculos',
                        type: 'demo'
                    },
                    {
                        id: 'M',
                        name: 'Laberinto',
                        action: 'Salir laberinto',
                        type: 'demo'
                    },
                    {
                        id: 'S',
                        name: 'Buzzer',
                        action: 'Demo buzzer',
                        type: 'demo'
                    },
                    {
                        id: 'S',
                        name: 'RGB',
                        action: 'Demo RGBs',
                        type: 'demo'
                    },
                    {
                        id: 'S',
                        name: 'UltraSonico',
                        action: 'Demo Ultrasónico',
                        type: 'demo'
                    },
                    {
                        id: 'S',
                        name: 'QRES',
                        action: 'Demo QRES',
                        type: 'demo'
                    }
                ]
            }

            return this.ble.connect(deviceId);
        }

        return null;
    }


    // the connection to the peripheral was successful
    onConnected(peripheral) {

        this.peripheral = peripheral;
        console.log('peripheral');
        console.log(peripheral);

        this.ble.startNotification(this.peripheral.id, COMMAND_SERVICE, COMMAND_CHARACTERISTIC).subscribe(
            data => this.onButtonStateChange(data),
            data => this.onButtonStateChange(data)
        );

    }

    onButtonStateChange(buffer: ArrayBuffer) {
        var data = new Uint8Array(buffer);
        console.log(data[0]);

    }

















    btDisconnect() {
        this.ble.disconnect(this.device.id);
    }

    btSendMessage(message, padMessage = true) {
        const that = this;
        const bufferStop = this.stringToBytes(this.uziPadding(COMMANDS_STOP));
        this.ble.writeWithoutResponse(this.device.id, COMMAND_SERVICE, COMMAND_CHARACTERISTIC, bufferStop).then(
            () => {
                console.log('Command Sent ' + COMMANDS_STOP)
                const paddedMessage = padMessage ? that.uziPadding(message) : message;
                const buffer = that.stringToBytes(paddedMessage);
                that.ble.writeWithoutResponse(that.device.id, COMMAND_SERVICE, COMMAND_CHARACTERISTIC, buffer).then(
                    () => console.log('Command Sent ' + message),
                    e => console.log('Error updating characteristic ' + e)
                );
            },
            e => console.log('Error updating characteristic ' + e)
        );

    }

    getAvailableDevices() {
        return this.availableDevices;
    }

    onDeviceDiscovered(device) {

        if (typeof device.name === 'undefined') {
            device.name = device.id;
        }
        this.availableDevices.push(device);
    }

    btRename(newName) {

        if (newName.length > 0) {
            this.btSendMessage(COMMANDS_RENAME + newName);
        }
    }

    btChangeDirection(direction) {
        // No enviar comando para comandos que no cambian direccion
        if (this.device.lastDirecton === direction) {
            return;
        }

        this.device.lastDirecton = direction;
        this.btSendMessage(direction);
    }

    btMove(moveX, moveY) {
        console.log(`movingX: ${moveX}, moveY: ${moveY}`);

        let message = '';
        if (moveY > 0) {
            message = 'U';
        }
        else {
            message = 'D';
        }
        this.btSendMessage(message);
    }

    btMoveStop() {
        this.device.lastDirecton = COMMANDS_STOP;
        this.btSendMessage(COMMANDS_STOP);
    }

    btSetSpeed(speed): number {
        this.device.speed = Math.round(speed);
        console.log(`setting speed: ${this.device.speed}`);

        const message = 'V' + (this.device.speed);
        this.btSendMessage(message);

        return this.device.speed;
    }

    btSoundBuzzer() {
        this.btSendMessage(COMMANDS_BUZZER);
    }

    btToggleLights(currentLightStatus) {
        this.btSendMessage(COMMANDS_LIGHTS);
        this.device.lightStatus = currentLightStatus;
        console.log('setting lights to: ' + ((this.device.lightStatus) ? 'on' : 'off'))
    }

    btExecuteProgram(programId) {
        console.log('executing program id: ' + programId);

        this.btSendMessage(programId, false);
    }

    btStopCurrentProgram() {
        console.log('stopping action');
        this.btSendMessage(COMMANDS_STOP);
    }

    getLightStatus(): boolean {
        return this.device.lightStatus;
    }

    getSpeed(): number {
        return this.device.speed;
    }

    getDevicePrograms() {

        return this.device.programs;
    }

    getKnownDevices() {

        const storage = localStorage.getItem(APP_STORAGE);
        let newStorage = null;

        if (storage) {
            newStorage = JSON.parse(storage);

            if (newStorage.devices) {
                return newStorage.devices;
            }
        }

        return [];
    }

    storeDevice(device) {
        const storage = localStorage.getItem(APP_STORAGE);
        let newStorage = null;

        if (storage) {
            newStorage = JSON.parse(storage);

            if (newStorage.devices) {
                let deviceIndex = -1;
                newStorage.devices.forEach((element, i) => {
                    if (element.id === device.id) {
                        deviceIndex = i;
                    }
                });

                if (deviceIndex !== -1) {
                    newStorage.devices[deviceIndex] = device;
                }
                else {
                    newStorage.devices.push(device);
                }
            }

        }
        else {
            newStorage = {
                devices: [device]
            }
        }

        localStorage.setItem(APP_STORAGE, JSON.stringify(newStorage));

    }

    forgetDevice(deviceId) {
        const storage = localStorage.getItem(APP_STORAGE);
        let newStorage = null;

        if (storage) {
            newStorage = JSON.parse(storage);

            if (newStorage.devices) {
                let deviceIndex = -1;
                newStorage.devices.forEach((element, i) => {
                    if (element.id === deviceId) {
                        deviceIndex = i;
                    }
                });

                if (deviceIndex !== -1) {
                    newStorage.devices.splice(deviceIndex, 1);
                }

            }

        }

        localStorage.setItem(APP_STORAGE, JSON.stringify(newStorage));

    }

    uziPadding(str) {
        //return str.paddEnd(20, '/');
        return (str + '////////////////////').substr(0, 20);
    }
    // ASCII only
    stringToBytes(string) {
        var array = new Uint8Array(string.length);
        for (var i = 0, l = string.length; i < l; i++) {
            array[i] = string.charCodeAt(i);
        }
        return array.buffer;
    }

    // ASCII only
    bytesToString(buffer) {
        return String.fromCharCode.apply(null, new Uint8Array(buffer));
    }
}
