// Copyright 2019-2020 Google LLC
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

import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Bucket, bucketResourcesAllocated, bucketCommittedResourcesAllocated } from '../bucket';
import { Objective, CommitmentType } from '../objective';
import { MatDialog } from '@angular/material/dialog';
import { EditObjectiveDialogComponent, EditObjectiveDialogData } from '../edit-objective-dialog/edit-objective-dialog.component';
import { EditBucketDialogComponent, EditBucketDialogData } from '../edit-bucket-dialog/edit-bucket-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ObjectiveComponent } from '../objective/objective.component';
import { Immutable } from '../immutable';

@Component({
  selector: 'app-bucket',
  templateUrl: './bucket.component.html',
  styleUrls: ['./bucket.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BucketComponent implements OnInit {
  @Input() bucket?: Immutable<Bucket>;
  @Input() unit?: string;
  @Input() totalAllocationPercentage?: number;
  @Input() globalResourcesAvailable?: number;
  @Input() maxCommittedPercentage?: number;
  @Input() unallocatedTime?: ReadonlyMap<string, number>;
  @Input() showOrderButtons?: boolean;
  @Input() isEditingEnabled?: boolean;
  @Input() otherBuckets?: readonly Immutable<Bucket>[];
  @Output() onMoveBucketUp = new EventEmitter<Immutable<Bucket>>();
  @Output() onMoveBucketDown = new EventEmitter<Immutable<Bucket>>();
  @Output() onChanged = new EventEmitter<[Immutable<Bucket>, Immutable<Bucket>]>();

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  /**
   * Limit of resources expected to be allocated to the given bucket in this period,
   * based on total available and the percentage the user has set for this bucket.
   */
  bucketAllocationLimit(): number {
    return this.globalResourcesAvailable! * this.bucket!.allocationPercentage / 100;
  }

  edit(): void {
    if (!this.isEditingEnabled) {
      return;
    }
    let newBucket: Bucket = {
      displayName: this.bucket!.displayName,
      allocationPercentage: this.bucket!.allocationPercentage,
      objectives: [], // Not currently editable via this dialog
    };
    const dialogData: EditBucketDialogData = {
      'bucket': newBucket, 'okAction': 'OK', 'allowCancel': false,
      'title': 'Edit bucket "' + this.bucket!.displayName + '"',
    };
    const dialogRef = this.dialog.open(EditBucketDialogComponent, {data: dialogData});
    dialogRef.afterClosed().subscribe((editedBucket?: Bucket) => {
      if (editedBucket) {
        const newBucket: Immutable<Bucket> = {
          displayName: editedBucket.displayName,
          allocationPercentage: editedBucket.allocationPercentage,
          objectives: this.bucket!.objectives, // Not currently editable via this dialog
        };
        this.onChanged.emit([this.bucket!, newBucket]);
      }
    });
  }

  addObjective(): void {
    if (!this.isEditingEnabled) {
      return;
    }
    const dialogData: EditObjectiveDialogData = {
      objective: {
        name: '',
        resourceEstimate: 0,
        commitmentType: CommitmentType.Aspirational,
        notes: '',
        groups: '',
        tags: '',
        assignments: [],
      },
      original: undefined,
      title: 'Add Objective',
      okAction: 'Add',
      unit: this.unit!,
      otherBuckets: [],
      onMoveBucket: undefined,
      onDelete: undefined,
    };
    const dialogRef = this.dialog.open(EditObjectiveDialogComponent, {data: dialogData});
    dialogRef.afterClosed().subscribe(objective => {
      if (!objective) {
        return;
      }
      let newObjectives: Immutable<Objective>[] = [...this.bucket!.objectives];
      newObjectives.push(objective);
      let newBucket: Immutable<Bucket> = {...this.bucket!, objectives: newObjectives};
      this.onChanged.emit([this.bucket!, newBucket]);
    });
  }

  private objectiveIndex(objective: Immutable<Objective>): number {
    return this.bucket!.objectives.findIndex(o => o === objective);
  }

  moveObjective(original: Immutable<Objective>, newObjective: Immutable<Objective>, newBucket: Immutable<Bucket>) {
    this.deleteObjective(original);
    const newObjectives: Immutable<Objective>[] = [...newBucket.objectives];
    newObjectives.push(newObjective);
    this.onChanged.emit([newBucket, {...newBucket, objectives: newObjectives}]);
  }

  deleteObjective(objective: Immutable<Objective>): void {
    const index = this.objectiveIndex(objective);
    const newObjectives: Immutable<Objective>[] = [...this.bucket!.objectives];
    newObjectives.splice(index, 1);
    const newBucket: Immutable<Bucket> = {...this.bucket!, objectives: newObjectives};
    this.onChanged.emit([this.bucket!, newBucket]);
  }

  reorderDrop(event: CdkDragDrop<ObjectiveComponent[]>) {
    const newObjectives: Immutable<Objective>[] = [...this.bucket!.objectives];
    moveItemInArray(newObjectives, event.previousIndex, event.currentIndex);
    if (event.previousIndex != event.currentIndex) {
      const newBucket: Immutable<Bucket> = {...this.bucket!, objectives: newObjectives};
      this.onChanged.emit([this.bucket!, newBucket]);
    }
  }

  onObjectiveChanged(original: Immutable<Objective>, newObjective: Immutable<Objective>): void {
    const index = this.objectiveIndex(original);
    const newObjectives: Immutable<Objective>[] = [...this.bucket!.objectives];
    newObjectives[index] = newObjective;
    const newBucket: Immutable<Bucket> = {...this.bucket!, objectives: newObjectives};
    this.onChanged.emit([this.bucket!, newBucket]);
  }

  moveBucketUp(): void {
    this.onMoveBucketUp.emit(this.bucket);
  }

  moveBucketDown(): void {
    this.onMoveBucketDown.emit(this.bucket);
  }

  resourcesAllocated(): number {
    return bucketResourcesAllocated(this.bucket!);
  }

  isOverAllocated(): boolean {
    return this.totalAllocationPercentage! > 100;
  }

  committedResourcesAllocated(): number {
    return bucketCommittedResourcesAllocated(this.bucket!);
  }

  isOverCommitted(): boolean {
    return this.commitRatio() * 100 > this.maxCommittedPercentage!;
  }

  /**
   * Fraction of resources allocated within this bucket to committed objectives
   */
  commitRatio(): number {
    let total = this.resourcesAllocated();
    return total ? this.committedResourcesAllocated() / total : 0;
  }
}
