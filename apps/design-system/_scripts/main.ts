/**
 * @license
 * Copyright 2020 Dynatrace LLC
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const themeSwitch = document.querySelector('.ds-theme-switch');
if (themeSwitch) {
  themeSwitch.addEventListener('click', () => {
    if (document.body.classList.contains('fluid-theme--abyss')) {
      document.body.classList.remove('fluid-theme--abyss');
      document.body.classList.add('fluid-theme--surface');
    } else {
      document.body.classList.add('fluid-theme--abyss');
      document.body.classList.remove('fluid-theme--surface');
    }
  });
}
