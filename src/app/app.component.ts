import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  // title = 'learning_project';
  // loadedFeature = 'recipe';
  // onNavigate(feature: string){
  //   this.loadedFeature=feature;
  // }

  constructor(private authService: AuthService){}

  ngOnInit(){
    this.authService.autoLogin();
  }
}
