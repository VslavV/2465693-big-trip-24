import AbstractView from '../framework/view/abstract-view.js';
import { capitalizeLetter } from '../utils.js';

const createFiltersItemTemplate = (filter, currentFilterType) => {
  const { type, count } = filter;

  return `<div class="trip-filters__filter">
    <input id="filter-${type}" class="trip-filters__filter-input  visually-hidden" type="radio" name="trip-filter" value="${type}"
    ${type === currentFilterType ? 'checked' : ''}
    ${count === 0 ? 'disabled' : ''}>
    <label class="trip-filters__filter-label" for="filter-${type}">${capitalizeLetter(type)}</label>
  </div>`;
};

const createNewFiltersViewTemplate = (filterTypes, currentFilterType) => {
  const filterTypesTemplate = filterTypes.map((filter) => createFiltersItemTemplate(filter, currentFilterType)).join('');

  return `<form class="trip-filters" action="#" method="get">
     ${filterTypesTemplate}
     <button class="visually-hidden" type="submit">Accept filter</button>
   </form>`;
};

export default class FiltersView extends AbstractView {
  #filters = null;
  #currentFilter = null;
  #handleFilterTypeChange = null;

  constructor({ filters, currentFilterType, onFilterTypeChange }) {
    super();
    this.#filters = filters;
    this.#currentFilter = currentFilterType;
    this.#handleFilterTypeChange = onFilterTypeChange;

    this.element.addEventListener('change', this.#filterTypeChangeHandler);
  }

  get template() {
    return createNewFiltersViewTemplate(this.#filters, this.#currentFilter);
  }

  #filterTypeChangeHandler = (evt) => {
    evt.preventDefault();
    this.#handleFilterTypeChange(evt.target.value);
  };
}
