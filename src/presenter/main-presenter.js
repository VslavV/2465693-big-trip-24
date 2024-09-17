import { MessageText } from '../const.js';
import EventListView from '../view/event-list-view.js';
import SortView from '../view/sort-view';
import MessageView from '../view/message-view.js';
import EventPresenter from './event-presenter.js';

import { render, RenderPosition } from '../framework/render.js';

export default class MainPresenter {
  #eventList = new EventListView();
  #container = null;
  #eventPointsModel = null;
  #offersModel = null;
  #destinationsModel = null;
  #sortComponent = new SortView();
  #messageComponent = new MessageView({ message: MessageText.EVERYTHING });

  #eventListPoints = [];

  constructor({ container, eventPointsModel, offersModel, destinationsModel }) {
    this.#container = container;
    this.#eventPointsModel = eventPointsModel;
    this.#offersModel = offersModel;
    this.#destinationsModel = destinationsModel;
  }

  init() {
    this.#eventListPoints = [...this.#eventPointsModel.eventPoints];
    this.#renderEventsList();
  }

  /**приватный метод для отрисовки компонентов сортировки */
  #renderSort() {
    render(this.#sortComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  /**приватный метод для отрисовки сообщения на странице */
  #renderMessage() {
    render(this.#messageComponent, this.#container);
  }

  /**приватный метод для отрисовки точки события, принимает объект точки события*/
  #renderEventPoints(eventPointItem) {
    const eventPresenter = new EventPresenter({
      container: this.#eventList.element,
      eventPointsModel: this.#eventPointsModel,
      offersModel: this.#offersModel,
      destinationsModel: this.#destinationsModel,
    });
    eventPresenter.init(eventPointItem);
  }

  /**приватный метод для отрисовки списка событий */
  #renderEventsList() {
    render(this.#eventList, this.#container);
    this.#renderSort();

    //проверяем, если событий нет, то выводим сообщение
    if (!this.#eventListPoints.length) {
      this.#renderMessage();
      return;
    }

    for (let i = 0; i < this.#eventListPoints.length; i++) {
      this.#renderEventPoints(this.#eventListPoints[i]);
    }
  }
}
