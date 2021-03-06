// Copyright 2019-2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {
  Component,
  OnInit,
  Input,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ImmutablePeriod } from '../period';
import { ImmutableObjective } from '../objective';
import { ImmutableAssignment } from '../assignment';
import { ImmutablePerson } from '../person';

@Component({
  selector: 'app-assignments-by-person',
  templateUrl: './assignments-by-person.component.html',
  styleUrls: ['./assignments-by-person.component.css'],
  // Requires all inputs to be immutable
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignmentsByPersonComponent implements OnInit {
  @Input() period?: ImmutablePeriod;

  constructor() {}

  ngOnInit(): void {}

  hasAssignments(person: ImmutablePerson): boolean {
    for (const bucket of this.period!.buckets) {
      for (const objective of bucket.objectives) {
        for (const assignment of objective.assignments) {
          if (assignment.personId === person.id) {
            return true;
          }
        }
      }
    }
    return false;
  }

  assignmentsFor(person: ImmutablePerson): ObjectiveAssignment[] {
    const result: ObjectiveAssignment[] = [];
    this.period!.buckets.forEach((bucket) => {
      bucket.objectives.forEach((objective) => {
        objective.assignments
          .filter((assignment) => assignment.personId === person.id)
          .forEach((assignment) => {
            result.push({ objective, assignment });
          });
      });
    });
    // Sort in descending order of commitment
    result.sort((a, b) => b.assignment.commitment - a.assignment.commitment);
    return result;
  }

  personDisplayNameWithUsername(person: ImmutablePerson): string {
    return person.displayNameWithUsername();
  }

  personTrackBy(_index: number, person: ImmutablePerson): string {
    return person.id;
  }

  assignmentsTrackBy(_index: number, oa: ObjectiveAssignment): string {
    return oa.objective.name;
  }
}

interface ObjectiveAssignment {
  objective: ImmutableObjective;
  assignment: ImmutableAssignment;
}
