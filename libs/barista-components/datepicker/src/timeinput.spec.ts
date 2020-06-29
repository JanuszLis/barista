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

import { _valueTo2DigitString, _parseAndValidateInput } from './timeinput';

describe('timeinput', () => {
  describe('_validateAndParseInput', () => {
    it('should return null if the provided value is null', () => {
      expect(_parseAndValidateInput(null, 0, 23, null)).toBe(null);
      expect(_parseAndValidateInput(null, 0, 23, 1)).toBe(null);
    });

    it('should return the number value if it is valid number and in the min/max range', () => {
      expect(_parseAndValidateInput(1, 0, 23, 1)).toBe(1);
    });

    it('should return the fallback value if the value is a valid number but not in the min/max range', () => {
      expect(_parseAndValidateInput(24, 0, 23, 1)).toBe(1);
      expect(_parseAndValidateInput(0, 1, 23, 1)).toBe(1);
    });

    it('should return the parsed number value if it is valid stringified number and in the min/max range', () => {
      expect(_parseAndValidateInput('1', 0, 23, 1)).toBe(1);
    });

    it('should return the fallback value if the value is a valid stringified number but not in the min/max range', () => {
      expect(_parseAndValidateInput('24', 0, 23, 1)).toBe(1);
    });

    it('should return the fallback value if it is not a valid value', () => {
      expect(_parseAndValidateInput('aa', 0, 23, 1)).toBe(1);
    });
  });

  describe('_valueTo2DigitString', () => {
    it('should cast a number value to string', () => {
      expect(_valueTo2DigitString(20)).toBe('20');
    });

    it('should prepend zeros for numbers smaller than 10', () => {
      expect(_valueTo2DigitString(8)).toBe('08');
      expect(_valueTo2DigitString(0)).toBe('00');
    });
  });
});
