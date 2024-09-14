import { capitalizeLetter } from '../utils.js';
import AbstractView from '../framework/view/abstract-view.js';

const createFiltersItemTemplate = (filter, isChecked) => {
  const { type, count } = filter;

  return `<div class="trip-filters__filter">
    <input id="filter-${type}" class="trip-filters__filter-input  visually-hidden" type="radio" name="trip-filter" value="${type}"
    ${isChecked ? 'checked' : ''}${count === 0 ? 'disabled' : ''}>
    <label class="trip-filters__filter-label" for="filter-${type}">${capitalizeLetter(type)}</label>
  </div>`;
};

const createNewFiltersViewTemplate = (filterTypes) => {
  const filterTypesTemplate = filterTypes.map((filter, index) => createFiltersItemTemplate(filter, index === 0)).join('');

  return `<form class="trip-filters" action="#" method="get">
     ${filterTypesTemplate}
     <button class="visually-hidden" type="submit">Accept filter</button>
   </form>`;
};

export default class FiltersView extends AbstractView {
  #filters = null;

  constructor(filters) {
    super();
    this.#filters = filters;
  }

  get template() {
    return createNewFiltersViewTemplate(this.#filters);
  }
}
