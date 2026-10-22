import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SDSAutocompleteServiceInterface, SDSHiercarchicalServiceResult } from '@gsa-sam/components';

import { SampleCountryData } from './autocomplete-country.data';

@Injectable()
export class AutocompleteCountryDataService implements SDSAutocompleteServiceInterface {
  getDataByText(currentItems: number, searchValue?: string): Observable<SDSHiercarchicalServiceResult> {
    const pageSize = 25;
    const term = (searchValue || '').toLowerCase();
    const items = SampleCountryData.filter((country) => country.name.toLowerCase().includes(term));

    return of({
      items: items.slice(currentItems, Math.min(currentItems + pageSize, items.length)),
      totalItems: items.length,
    });
  }
}
