/**
 * Copyright 2020-2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ImmutablePeriod } from '../period';
import { ImmutableObjective, totalResourcesAllocated } from '../objective';
import { MatDialog } from '@angular/material/dialog';
import {
  RenameClassDialogComponent,
  RenameClassDialogData,
} from '../rename-class-dialog/rename-class-dialog.component';

export enum AggregateBy {
  Group = 'group',
  Tag = 'tag',
}

@Component({
  selector: 'app-assignments-classify',
  templateUrl: './assignments-classify.component.html',
  styleUrls: ['./assignments-classify.component.css'],
  // Requires all inputs to be immutable
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsClassifyComponent implements OnInit {
  @Input() period?: ImmutablePeriod;
  @Input() aggregateBy?: AggregateBy;
  @Input() groupType?: string;
  @Input() title?: string;
  @Input() isEditingEnabled?: boolean;
  @Output() rename = new EventEmitter<[string, string]>();

  constructor(private dialog: MatDialog) {}

  ngOnInit(): void {}

  objectivesByGroup(): Array<[string, ImmutableObjective[]]> {
    const obsByGroup = new Map<string, ImmutableObjective[]>();
    this.period!.buckets.forEach((b) => {
      b.objectives.forEach((o) => {
        const mgs = o.groups.filter((g) => g.groupType === this.groupType);
        if (mgs.length > 0) {
          const groupName = mgs[0].groupName;
          if (obsByGroup.has(groupName)) {
            obsByGroup.get(groupName)!.push(o);
          } else {
            obsByGroup.set(groupName, [o]);
          }
        }
      });
    });
    for (const [_g, obs] of obsByGroup) {
      obs.sort((o1, o2) => o2.resourcesAllocated() - o1.resourcesAllocated());
    }
    const result = Array.from(obsByGroup.entries());
    result.sort(([g1, obs1], [g2, obs2]) => {
      const resources1 = this.totalAssignedResources(obs1);
      const resources2 = this.totalAssignedResources(obs2);
      return resources2 - resources1 || g1.localeCompare(g2);
    });
    return result;
  }

  objectivesByTag(): Array<[string, ImmutableObjective[]]> {
    const obsByTag = new Map<string, ImmutableObjective[]>();
    this.period!.buckets.forEach((b) => {
      b.objectives.forEach((o) => {
        o.tags.forEach((t) => {
          if (obsByTag.has(t.name)) {
            obsByTag.get(t.name)!.push(o);
          } else {
            obsByTag.set(t.name, [o]);
          }
        });
      });
    });
    for (const [_g, obs] of obsByTag) {
      obs.sort((o1, o2) => o2.resourcesAllocated() - o1.resourcesAllocated());
    }
    const result = Array.from(obsByTag.entries());
    result.sort(([g1, _obs1], [g2, _obs2]) => g1.localeCompare(g2));
    return result;
  }

  objectivesByClass(): Array<[string, ImmutableObjective[]]> {
    switch (this.aggregateBy) {
      case AggregateBy.Group:
        return this.objectivesByGroup();
      case AggregateBy.Tag:
        return this.objectivesByTag();
    }
    console.error('Unsupported aggregateBy "' + this.aggregateBy + '"');
    return [];
  }

  classTrackBy(
    _index: number,
    classobj: [string, ImmutableObjective[]]
  ): string {
    return classobj[0];
  }

  assignedResources(objective: ImmutableObjective): number {
    return objective.resourcesAllocated();
  }

  totalAssignedResources(objectives: readonly ImmutableObjective[]): number {
    return totalResourcesAllocated(objectives);
  }

  renameClass(cname: string): void {
    const data: RenameClassDialogData = {
      classType: this.aggregateBy || '',
      currentName: cname,
    };
    const dialog = this.dialog.open(RenameClassDialogComponent, { data });
    dialog.afterClosed().subscribe((newName) => {
      if (newName) {
        this.rename.emit([cname, newName]);
      }
    });
  }
}
