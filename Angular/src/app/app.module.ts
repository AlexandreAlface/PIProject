import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import {MatSelectModule} from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app.routes';

export interface Lang {
  value: string;
  str: string;
  img: string;
}


@NgModule({
  declarations: [
],
  imports: [
    AppRoutingModule,
    BrowserModule,
    HttpClientModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
],
  providers: [],
  bootstrap: [],
  schemas: []
})
export class AppModule {
  langs: Lang[] = [
    { value: 'pt-1', str: 'PT', img: 'assets/pt-flag.png' },
    { value: 'eng-2', str: 'ENG', img: 'assets/eng-flag.png' },
     ];
}