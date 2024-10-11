import { SortType, UpdateType, UserAction, FilterType } from '../const.js';
import EventListView from '../view/event-list-view.js';
import SortView from '../view/sort-view';
import MessageView from '../view/message-view.js';
import LoadingView from '../view/loading-view.js';
import EventPresenter from './event-presenter.js';
import NewEventPresenter from './new-event-presenter.js';
import { sortByDay, sortByPrice, sortByTime, filter } from '../utils.js';

import { render, RenderPosition, remove } from '../framework/render.js';

export default class MainPresenter {
  #eventList = new EventListView();
  #container = null;
  #eventPointsModel = null;
  #offersModel = null;
  #destinationsModel = null;
  #filterModel = null;
  #sortComponent = null;
  #messageComponent = null;
  #Loadingcomponent = new LoadingView();

  #eventPresenter = new Map();
  #newEventPresenter = null;

  #currentSortType = SortType.DAY;
  #filterType = FilterType.EVERYTHING;
  #isLoading = true;

  constructor({ container, eventPointsModel, offersModel, destinationsModel, filterModel, onNewEventDestroy }) {
    this.#container = container;
    this.#eventPointsModel = eventPointsModel;
    this.#offersModel = offersModel;
    this.#destinationsModel = destinationsModel;
    this.#filterModel = filterModel;

    this.#newEventPresenter = new NewEventPresenter({
      container: this.#eventList.element,
      offersModel: this.#offersModel,
      destinationsModel: this.#destinationsModel,
      onDataChange: this.#handleViewAction,
      onDestroy: onNewEventDestroy,
    });

    //подписка на изменение модели
    this.#eventPointsModel.addObserver(this.#handleModelEvent);
    this.#filterModel.addObserver(this.#handleModelEvent);
  }

  get eventPoints() {
    this.#filterType = this.#filterModel.filter;
    const eventPoints = this.#eventPointsModel.eventPoints;
    const filteredPoints = filter[this.#filterType](eventPoints);

    switch (this.#currentSortType) {
      case SortType.TIME:
        return filteredPoints.sort(sortByTime);
      case SortType.PRICE:
        return filteredPoints.sort(sortByPrice);
    }
    return filteredPoints.sort(sortByDay);
  }

  init() {
    this.#renderPage();
  }

  createPoint() {
    this.#currentSortType = SortType.DAY;
    this.#filterType = FilterType.EVERYTHING;
    this.#filterModel.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);
    this.#newEventPresenter.init();
  }

  /**приватный метод для отрисовки компонентов сортировки */
  #renderSort() {
    this.#sortComponent = new SortView({
      checkedSortType: this.#currentSortType,
      onSortTypeChange: this.#handleSortTypeChange,
    });

    render(this.#sortComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  /**приватный метод для отрисовки сообщения на странице */
  #renderMessage() {
    this.#messageComponent = new MessageView({
      filterType: this.#filterType,
    });
    render(this.#messageComponent, this.#container);
  }

  /**приватный метод для отрисовки точки события, принимает объект точки события*/
  #renderEventPoint(eventPointItem) {
    const eventPresenter = new EventPresenter({
      container: this.#eventList.element,
      eventPointsModel: this.#eventPointsModel,
      offersModel: this.#offersModel,
      destinationsModel: this.#destinationsModel,
      onDataChange: this.#handleViewAction,
      onModeChange: this.#handleModeChange,
    });
    eventPresenter.init(eventPointItem);
    this.#eventPresenter.set(eventPointItem.id, eventPresenter);
  }

  #handleModeChange = () => {
    this.#newEventPresenter.destroy();
    this.#eventPresenter.forEach((presenter) => presenter.resetView());
  };

  #clearPage({ resetSortType = false } = {}) {
    this.#newEventPresenter.destroy();
    this.#eventPresenter.forEach((presenter) => presenter.destroy());
    this.#eventPresenter.clear();

    remove(this.#Loadingcomponent);
    remove(this.#sortComponent);
    if (this.#messageComponent) {
      remove(this.#messageComponent);
    }
    if (resetSortType) {
      this.#currentSortType = SortType.DAY;
    }
  }

  /**обработчик реагирующий на действия пользователя, Здесь будем вызывать обновление модели.
   * @actionType - действие пользователя, нужно чтобы понять, какой метод модели вызвать
   * @updateType - тип изменений, нужно чтобы понять, что после нужно обновить
   * @update обновленные данные
   */
  #handleViewAction = async (actionType, updateType, update) => {
    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#eventPresenter.get(update.id).setSaving();
        try {
          await this.#eventPointsModel.updatePoint(updateType, update);
        } catch (err) {
          this.#eventPresenter.get(update.id).setAborting();
        }
        break;
      case UserAction.ADD_POINT:
        this.#newEventPresenter.setSaving();
        try {
          await this.#eventPointsModel.addPoint(updateType, update);
        } catch (err) {
          this.#newEventPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#eventPresenter.get(update.id).setDeleting();
        try {
          await this.#eventPointsModel.deletePoint(updateType, update);
        } catch (err) {
          this.#eventPresenter.get(update.id).setAborting();
        }
        break;
    }
  };

  /**обработчик срабатывающий при изменении модели. В зависимости от типа изменений решаем, что делать:
   *- обновить часть списка (например, когда поменялся Destination )
   *- обновить список (например, когда событие удалено или добавилось новое)
   *- обновить всю доску (например, при переключении фильтра)
   */
  #handleModelEvent = (updateType, data) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#eventPresenter.get(data.id).init(data);
        break;
      case UpdateType.MINOR:
        this.#clearPage();
        this.#renderPage();
        break;
      case UpdateType.MAJOR:
        this.#clearPage({ resetSortType: true });
        this.#renderPage();
        break;
      case UpdateType.INIT:
        this.#isLoading = false;
        remove(this.#Loadingcomponent);
        this.#renderPage();
        break;
    }
  };

  /**обработчик смены сортировки */
  #handleSortTypeChange = (sortType) => {
    if (this.#currentSortType === sortType) {
      return {};
    }

    this.#currentSortType = sortType;
    this.#clearPage();
    this.#renderPage();
  };

  #renderEventPoints(eventPoints) {
    eventPoints.forEach((eventPoint) => this.#renderEventPoint(eventPoint));
  }

  #renderLoading() {
    render(this.#Loadingcomponent, this.#container);
  }

  /**приватный метод для отрисовки списка событий */
  #renderEventsList() {
    render(this.#eventList, this.#container);
    this.#renderEventPoints(this.eventPoints);
  }

  #renderPage() {
    if (this.#isLoading) {
      this.#renderLoading();
      return;
    }

    //проверяем, если событий нет, то выводим сообщение
    if (!this.eventPoints.length) {
      this.#renderMessage();
      return;
    }
    this.#renderSort();
    this.#renderEventsList();
  }
}
