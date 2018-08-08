import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { ControlPage, DeviceSettings } from '../pages/control/control';
import { DataProvider } from '../providers/data.provider';
import { HttpClientModule } from '@angular/common/http';
import { BLE } from '@ionic-native/ble';
import { ConnectPage } from '../pages/connect/connect';

@NgModule({
    declarations: [
        MyApp,
        HomePage,
        ControlPage,
        ConnectPage,
        DeviceSettings
    ],
    imports: [
        BrowserModule,
        IonicModule.forRoot(MyApp),
        HttpClientModule
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        MyApp,
        HomePage,
        ControlPage,
        ConnectPage,
        DeviceSettings
    ],
    providers: [
        StatusBar,
        SplashScreen,
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        BLE,
        DataProvider
    ]
})
export class AppModule {
}
