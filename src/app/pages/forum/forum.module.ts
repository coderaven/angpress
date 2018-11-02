import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from 'src/app/shared/material.module';

// Component
import { ForumComponent } from './forum.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: ForumComponent,
      },
      {
        path: ':name',
        component: ForumComponent,
      },
    ]),
    MaterialModule,
  ],
  declarations: [ForumComponent],
})
export class ForumModule {}