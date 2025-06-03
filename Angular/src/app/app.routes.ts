import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashBoardPTComponent } from './pt/dash-board-pt/dash-board-pt.component';
import { PublicationsPTComponent } from './pt/publications-pt/publications-pt.component';
import { InvestigatorsPTComponent } from './pt/investigators-pt/investigators-pt.component';
import { LoginPtComponent } from './pt/login-pt/login-pt.component';
import { AdminComponent } from './pt/admin/admin.component';
import { LogoutComponent } from './pt/logout/logout.component';
import { PublicationPageComponent } from './pt/publication-page/publication-page.component';
import { PublicationsEditComponent } from './pt/publications-edit/publications-edit.component';
import { InvestigatorPageComponent } from './pt/investigator-page/investigator-page.component';

export const routes: Routes = [

    {path: 'Investigadores', component: InvestigatorsPTComponent},
    {path: 'Investigators', component: InvestigatorsPTComponent},
    {path: 'Investigadores/Ver/:nome', component: InvestigatorPageComponent},
    {path: 'Investigators/View/:nome', component: InvestigatorPageComponent},
    {path: 'Publicações', component: PublicationsPTComponent},
    {path: 'Publications', component: PublicationsPTComponent},
    {path: 'Publicações/Ver/:id', component: PublicationPageComponent},
    {path: 'Publications/View/:id', component: PublicationPageComponent},
    {path: 'Publicações/Editar/:id', component: PublicationsEditComponent},
    {path: 'Publications/Edit/:id', component: PublicationsEditComponent},
    {path: 'Start',  component: DashBoardPTComponent},
    {path: 'Administrador', component: AdminComponent},
    {path: 'Admin',component: AdminComponent},
    {path: 'Entrar',  component: LoginPtComponent},
    {path: 'Login', component: LoginPtComponent},
    {path: 'Sair', component: LogoutComponent},
    {path: 'Logout', component: LogoutComponent},
    {path: 'Início', component: DashBoardPTComponent},
    {path: '**', redirectTo: '/Início', pathMatch: 'full'},
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
  })
  export class AppRoutingModule { }

