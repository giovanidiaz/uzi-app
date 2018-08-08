import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { ControlPage} from '../control/control';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  controlPage = ControlPage;

  constructor(public navCtrl: NavController) {

  }

}
