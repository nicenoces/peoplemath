import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { AppRoutingModule } from './/app-routing.module';
import { TeamsComponent } from './teams/teams.component';
import { TeamPeriodsComponent } from './teamperiods/teamperiods.component';
import { PeriodComponent } from './period/period.component';


@NgModule({
  declarations: [
    AppComponent,
    TeamsComponent,
    TeamPeriodsComponent,
    PeriodComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
