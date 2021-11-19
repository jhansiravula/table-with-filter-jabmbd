import {Component, ElementRef, ViewChild, AfterViewInit} from '@angular/core';
import {DataSource} from '@angular/cdk/collections';
import {FormControl} from '@angular/forms';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/observable/combineLatest';

import { GithubApi } from '../models/Issues';

interface MultiFilter {
  name: string;
  color: string;
  minProgress: number;
}


@Component({
  selector: 'issue-list',
  templateUrl: './issue-list.component.html',
  styleUrls: ['./issue-list.component.css']
})
export class IssueListComponent {
displayedColumns = ['userId', 'userName', 'progress', 'color'];
  exampleDatabase = new ExampleDatabase();
  dataSource: ExampleDataSource | null;
  
  nameFilter = new FormControl();
  colorFilter = new FormControl();
  progressFilter = new FormControl(0);

  ngOnInit() {
    this.dataSource = new ExampleDataSource(this.exampleDatabase);
    
    const nameFilter$ = this.formControlValueStream(this.nameFilter, '');
    const colorFilter$ = this.formControlValueStream(this.colorFilter, '');
    const progressFilter$ = this.formControlValueStream(this.progressFilter, 0);
    
    
    
    Observable.combineLatest(nameFilter$, colorFilter$, progressFilter$)
      .map(([name, color, minProgress]) => ({ name, color, minProgress }))
      .subscribe(filter => {
        if (!this.dataSource) { return; }
        this.dataSource.filter = filter;
      });
  }
  
  private formControlValueStream(control: FormControl, defaultValue: any) {
    return control.valueChanges
      .debounceTime(150)
      .distinctUntilChanged()
      .startWith(defaultValue);
  }
}

/** Constants used to fill up our data base. */
const COLORS = ['maroon', 'red', 'orange', 'yellow', 'olive', 'green', 'purple',
  'fuchsia', 'lime', 'teal', 'aqua', 'blue', 'navy', 'black', 'gray'];
const NAMES = ['Maia', 'Asher', 'Olivia', 'Atticus', 'Amelia', 'Jack',
  'Charlotte', 'Theodore', 'Isla', 'Oliver', 'Isabella', 'Jasper',
  'Cora', 'Levi', 'Violet', 'Arthur', 'Mia', 'Thomas', 'Elizabeth'];

export interface UserData {
  id: string;
  name: string;
  progress: string;
  color: string;
}

/** An example database that the data source uses to retrieve data for the table. */
export class ExampleDatabase {
  /** Stream that emits whenever the data has been modified. */
  dataChange: BehaviorSubject<UserData[]> = new BehaviorSubject<UserData[]>([]);
  get data(): UserData[] { return this.dataChange.value; }

  constructor() {
    // Fill up the database with 100 users.
    for (let i = 0; i < 100; i++) { this.addUser(); }
  }

  /** Adds a new user to the database. */
  addUser() {
    const copiedData = this.data.slice();
    copiedData.push(this.createNewUser());
    this.dataChange.next(copiedData);
  }

  /** Builds and returns a new User. */
  private createNewUser() {
    const name =
        NAMES[Math.round(Math.random() * (NAMES.length - 1))] + ' ' +
        NAMES[Math.round(Math.random() * (NAMES.length - 1))].charAt(0) + '.';

    return {
      id: (this.data.length + 1).toString(),
      name: name,
      progress: Math.round(Math.random() * 100).toString(),
      color: COLORS[Math.round(Math.random() * (COLORS.length - 1))]
    };
  }
}

/**
 * Data source to provide what data should be rendered in the table. Note that the data source
 * can retrieve its data in any way. In this case, the data source is provided a reference
 * to a common data base, ExampleDatabase. It is not the data source's responsibility to manage
 * the underlying data. Instead, it only needs to take the data and send the table exactly what
 * should be rendered.
 */
export class ExampleDataSource extends DataSource<any> {
  _filterChange = new BehaviorSubject({ name: '', color: '' });
  get filter(): MultiFilter { return this._filterChange.value; }
  set filter(filter: MultiFilter) { this._filterChange.next(filter); }

  constructor(private _exampleDatabase: ExampleDatabase) {
    super();
  }

  /** Connect function called by the table to retrieve one stream containing the data to render. */
  connect(): Observable<UserData[]> {
    const displayDataChanges = [
      this._exampleDatabase.dataChange,
      this._filterChange,
    ];

    return Observable.merge(...displayDataChanges).map(() => {
      return this._exampleDatabase.data.slice()
        .filter((item: UserData) => {
          let itemName = item.name.toLowerCase();
          return itemName.indexOf(this.filter.name.toLowerCase()) !== -1;
        })
        .filter((item: UserData) => {
          let itemColor = item.color.toLowerCase();
          return itemColor.indexOf(this.filter.color.toLowerCase()) !== -1;
        })
        .filter((item: UserData) => {
          let progress = +item.progress;
          return progress >= this.filter.minProgress;
        });
    });
  }

  disconnect() {}
}

