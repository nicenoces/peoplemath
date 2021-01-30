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

import { Person, ImmutablePerson } from './person';

describe('ImmutablePerson', () => {
  const _mut: Person = new Person('test', 'Test Person', 'LOC', 1);
  const person = new ImmutablePerson(_mut);

  it('should convert', () => {
    expect(person.toOriginal()).toEqual(_mut);
  });

  it('should be immutable', () => {
    const p: Person = person;
    expect(() => {
      p.displayName = 'Bobby';
    }).toThrowError(/Cannot set property displayName/);
    expect(person.displayName).toEqual('Test Person');
  });
});
