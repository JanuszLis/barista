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

/** The options that can be used with the packager builder */
export interface DesignTokensBuildOptions {
  /** List of glob patterns that should be searched for design token input files. */
  entrypoints: string[];
  /** List of glob patterns for alias files to build JSON metadata for as required by some applications. */
  aliasesEntrypoints: string[];
  /** Output path that defines the destination directory. */
  outputPath: string;
}
