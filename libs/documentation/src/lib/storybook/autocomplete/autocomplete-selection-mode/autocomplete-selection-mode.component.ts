import { Component, OnInit } from '@angular/core';
import { SDSAutocompletelConfiguration, SDSSelectedItemModel, SelectionMode } from '@gsa-sam/components';
import { AutocompleteCountryDataService } from '../services/autocomplete-country.service';
import { AutocompleteSampleDataService } from '../services/autocomplete-sample.service';

@Component({
  standalone: false,
  templateUrl: './autocomplete-selection-mode.component.html',
  selector: `sds-autocomplete-selection-mode-demo`,
  providers: [AutocompleteSampleDataService, AutocompleteCountryDataService],
})
export class AutocompleteSelectionMode implements OnInit {
  public settings = new SDSAutocompletelConfiguration();
  public settings3 = new SDSAutocompletelConfiguration();

  public model = new SDSSelectedItemModel();
  public model3 = new SDSSelectedItemModel();

  constructor(
    public countryService: AutocompleteCountryDataService,
    public service: AutocompleteSampleDataService,
  ) {
    this.setup();
  }

  changes(value) {
    console.log(value);
  }

  ngOnInit() {}

  setup() {
    this.settings.id = 'autocompleteBasic';
    this.settings.primaryKeyField = 'id';
    this.settings.primaryTextField = 'name';
    this.settings.labelText = 'Country';
    this.settings.selectionMode = SelectionMode.SINGLE;
    this.settings.autocompletePlaceHolderText = 'eg: Japan';

    this.settings3.primaryKeyField = 'id';
    this.settings3.id = 'autocompleteBasic3';
    this.settings3.labelText = 'Autocomplete 3';
    this.settings3.primaryTextField = 'name';
    this.settings3.secondaryTextField = 'subtext';
    this.settings3.selectionMode = SelectionMode.MULTIPLE;
    this.settings3.autocompletePlaceHolderText = 'eg: Level 1';
  }
}
