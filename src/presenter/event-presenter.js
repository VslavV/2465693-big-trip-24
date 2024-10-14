import { render, replace, remove } from '../framework/render.js';
import FormEditView from '../view/form-edit-view.js';
import PointView from '../view/point-view.js';
import { UpdateType, UserAction } from '../const.js';
import { isEscapeKey, isMinoreUpdate } from '../utils.js';

const Mode = {
  DEFAULT: 'DEFAULT',
  EDITING: 'EDITING',
};

export default class EventPresenter {
  #eventPointItem = null;
  #editEventPoint = null;
  #eventPoint = null;
  #destinationsModel = null;
  #offersModel = null;
  #container = null;
  #handleDataChange = null;
  #handleModeChange = null;
  #mode = Mode.DEFAULT;

  constructor({ container, offersModel, destinationsModel, onDataChange, onModeChange }) {
    this.#container = container;
    this.#offersModel = offersModel;
    this.#destinationsModel = destinationsModel;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(eventPointItem) {
    this.#eventPointItem = eventPointItem;

    const prevEventPointComponent = this.#eventPoint;
    const prevEditEventPointComponent = this.#editEventPoint;

    this.#eventPoint = new PointView({
      eventPoint: this.#eventPointItem,
      destination: this.#destinationsModel.getDestinationsById(eventPointItem.destination),
      offers: [...this.#offersModel.getOffersById(eventPointItem.type, eventPointItem.offers)],
      onEditButtonClick: this.#editClickHandler,
      onFavoriteClick: this.#favoriteClickHandler,
    });

    this.#editEventPoint = new FormEditView({
      eventPoint: this.#eventPointItem,
      pointDestination: this.#destinationsModel.getDestinationsById(eventPointItem.destination),
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      typeOffers: this.#offersModel.getOffersType(),
      onFormSubmit: this.#formSubmitHandler,
      onRollupButtonClick: this.#rollupButtonClickHandler,
      onDeleteClick: this.#deleteClickHandler,
    });

    if (prevEventPointComponent === null || prevEditEventPointComponent === null) {
      render(this.#eventPoint, this.#container);
      return {};
    }

    if (this.#mode === Mode.DEFAULT) {
      replace(this.#eventPoint, prevEventPointComponent);
    }

    if (this.#mode === Mode.EDITING) {
      replace(this.#eventPoint, prevEditEventPointComponent);
      this.#mode = Mode.DEFAULT;
    }

    remove(prevEventPointComponent);
    remove(prevEditEventPointComponent);
  }

  destroy() {
    remove(this.#eventPoint);
    remove(this.#editEventPoint);
  }

  resetView() {
    if (this.#mode !== Mode.DEFAULT) {
      this.#editEventPoint.reset(this.#eventPointItem);
      this.#replaceEditToView();
    }
  }

  setSaving() {
    if (this.#mode === Mode.EDITING) {
      this.#editEventPoint.updateElement({
        isDisabled: true,
        isSaving: true,
      });
    }
  }

  setDeleting() {
    if (this.#mode === Mode.EDITING) {
      this.#editEventPoint.updateElement({
        isDisabled: true,
        isDeleting: true,
      });
    }
  }

  setAborting() {
    if (this.#mode === Mode.DEFAULT) {
      this.#eventPoint.shake();
      return;
    }

    const resetFormState = () => {
      this.#editEventPoint.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#editEventPoint.shake(resetFormState);
  }

  #replaceViewToEdit = () => {
    replace(this.#editEventPoint, this.#eventPoint);
    document.addEventListener('keydown', this.#escKeyDownHandler);
    this.#handleModeChange();
    this.#mode = Mode.EDITING;
  };

  #replaceEditToView = () => {
    replace(this.#eventPoint, this.#editEventPoint);
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    this.#mode = Mode.DEFAULT;
  };

  #escKeyDownHandler = (evt) => {
    if (isEscapeKey(evt)) {
      evt.preventDefault();
      this.#editEventPoint.reset(this.#eventPointItem);
      this.#replaceEditToView();
      document.removeEventListener('keydown', this.#escKeyDownHandler);
    }
  };

  #editClickHandler = () => {
    this.#replaceViewToEdit();
    document.addEventListener('keydown', this.#escKeyDownHandler);
  };

  #favoriteClickHandler = () => {
    this.#handleDataChange(UserAction.UPDATE_POINT, UpdateType.PATCH, { ...this.#eventPointItem, isFavorite: !this.#eventPointItem.isFavorite });
  };

  #rollupButtonClickHandler = (eventPointItem) => {
    this.#handleDataChange(UserAction.UPDATE_POINT, UpdateType.MINOR, eventPointItem);
    this.#replaceEditToView();
    document.removeEventListener('keydown', this.#escKeyDownHandler);
  };

  #formSubmitHandler = (update) => {
    const neccesaryUpdateType = isMinoreUpdate(this.#eventPointItem, update) ? UpdateType.MINOR : UpdateType.PATCH;
    this.#handleDataChange(UserAction.UPDATE_POINT, neccesaryUpdateType, update);
  };

  #deleteClickHandler = (eventPointItem) => {
    this.#handleDataChange(UserAction.DELETE_POINT, UpdateType.MINOR, eventPointItem);
  };
}
