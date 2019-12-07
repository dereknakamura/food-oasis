import { useReducer, useEffect } from "react";
import * as stakeholderService from "../../services/stakeholder-service";
import * as categoryService from "../../services/category-service";
import { actionTypes } from "./actionTypes";
import { reducer } from "./reducer";
import { initialState } from "./initialState";

export function useStakeholders() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const search = async (
    searchString,
    latitude,
    longitude,
    selectedLocationName,
    selectedCategories,
    selectedDistance
  ) => {
    const {
      FETCH_FAILURE,
      FETCH_REQUEST,
      FETCH_SUCCESS
    } = actionTypes.STAKEHOLDERS;
    if (!selectedCategories) return;
    try {
      dispatch({ type: FETCH_REQUEST });
      const stakeholders = await stakeholderService.search({
        name: searchString,
        categoryIds: selectedCategories.map(category => category.id),
        latitude,
        longitude,
        distance: selectedDistance
      });
      dispatch({ type: FETCH_SUCCESS, stakeholders });
      dispatch({
        type: actionTypes.UPDATE_CRITERIA,
        payload: {
          searchString,
          selectedLatitude: latitude,
          selectedLongitude: longitude,
          selectedLocationName,
          selectedCategories,
          selectedDistance
        }
      });
    } catch (err) {
      console.log(err);
      dispatch({ type: FETCH_FAILURE });
    }
  };

  const fetchCategories = async () => {
    const {
      FETCH_FAILURE,
      FETCH_REQUEST,
      FETCH_SUCCESS
    } = actionTypes.CATEGORIES;

    dispatch({ type: FETCH_REQUEST });
    try {
      const allCategories = await categoryService.getAll();
      const categories = allCategories.filter(category => !category.inactive);

      const selectedCategories = categories.filter(
        category => category.id === 1 || category.id === 8 || category.id === 9
      ); // setting the initial selection to FoodPantry, Food Bank, Soup Kitchen
      dispatch({ type: FETCH_SUCCESS, categories, selectedCategories });
    } catch (error) {
      dispatch({ type: FETCH_FAILURE, error });
    }
  };

  const fetchLocation = async () => {
    const {
      FETCH_FAILURE,
      FETCH_REQUEST,
      FETCH_SUCCESS
    } = actionTypes.LOCATION;

    dispatch({ type: FETCH_REQUEST });
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async position => {
            if (position) {
              const userCoordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              dispatch({ type: FETCH_SUCCESS, userCoordinates });
            }
            // async fn must return something
            return { latitude: null, longitude: null };
          },
          async error => {
            dispatch({ type: FETCH_FAILURE, error });
            return { latitude: null, longitude: null };
          }
        );
      } else {
        // If browser location permission is denied, the request is
        // "successful", but the result is null coordinates.
        dispatch({
          type: FETCH_SUCCESS,
          userCoordinates: { latitude: null, longitude: null }
        });
      }
    } catch (error) {
      dispatch({ type: FETCH_FAILURE, error });
      return error;
    }
  };

  useEffect(() => {
    const {
      searchString,
      selectedLatitude,
      selectedLongitude,
      selectedLocationName,
      selectedDistance,
      selectedCategories
    } = initialState;

    // Runs once on initialization to get list of all active categories
    fetchCategories();

    // Runs once on initialization to get user's browser lat/lon, if
    // browser permits
    fetchLocation();

    // Exposed to consuming component to execute search
    search(
      searchString,
      selectedLatitude,
      selectedLongitude,
      selectedLocationName,
      selectedCategories,
      selectedDistance
    );
  }, []);

  return { state, dispatch, actionTypes, search };
}
