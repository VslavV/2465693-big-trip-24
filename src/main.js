import { AUTHORIZATION, END_POINT } from './const.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import MainPresenter from './presenter/main-presenter.js';
import EventPointsModel from './model/event-points-model.js';
import OffersModel from './model/offers-model.js';
import DestinationsModel from './model/destinations-model.js';
import FilterModel from './model/filter-model.js';
import EventPointsApiService from './event-points-api-service.js';
import NewEventButtonView from './view/new-event-button-view.js';
import { render } from './framework/render.js';

const tripMainElement = document.querySelector('.trip-main');
const filterControlElement = document.querySelector('.trip-controls__filters');
const tripEventsElement = document.querySelector('.trip-events');

const newEventButtonComponent = new NewEventButtonView({ onButtonClick: handleNewEventButtonClick });

const service = new EventPointsApiService(END_POINT, AUTHORIZATION);
const offersModel = new OffersModel(service);
const destinationsModel = new DestinationsModel(service);
const eventPointsModel = new EventPointsModel(service, offersModel, destinationsModel);
const filterModel = new FilterModel();

const tripInfoPresenter = new TripInfoPresenter(eventPointsModel, destinationsModel, offersModel, tripMainElement);
const filterPresenter = new FilterPresenter({ filterContainer: filterControlElement, filterModel, eventPointsModel });
const mainPresenter = new MainPresenter({
  eventsContainer: tripEventsElement,
  eventPointsModel,
  offersModel,
  destinationsModel,
  filterModel,
  onNewEventDestroy: handleNewEventFormClose,
});

function handleNewEventFormClose() {
  newEventButtonComponent.element.disabled = false;
}

function handleNewEventButtonClick() {
  mainPresenter.createPoint();
  newEventButtonComponent.element.disabled = true;
}

tripInfoPresenter.init();
filterPresenter.init();
render(newEventButtonComponent, tripMainElement);
eventPointsModel.init();
mainPresenter.init();
