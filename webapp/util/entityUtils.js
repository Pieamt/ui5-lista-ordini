sap.ui.define(["sap/ui/model/Filter", "sap/ui/model/FilterOperator"], function (Filter, FilterOperator) {
  "use strict";

  return {
    /**
     * Estrae e restituisce il messaggio di errore da una risposta OData.
     * @param {object} error - Oggetto di errore restituito dalla chiamata OData.
     * @returns {string|null} - Messaggio di errore se presente, altrimenti null.
     */
    getErrorMessage: function (error) {
      if (error.responseText) {
        try {
          const oErrorDetails = JSON.parse(error.responseText);
          return oErrorDetails?.error?.message?.value;
        } catch (parseError) {
          return null;
        }
      }

      return null;
    },

    /**
     * Aggiunge un filtro di uguaglianza (EQ) a un array di filtri, se il valore è definito.
     * @param {sap.ui.model.Filter[]} aFilters - Array di filtri a cui aggiungere il nuovo filtro.
     * @param {string} sPropertyModel - Nome della proprietà del modello su cui applicare il filtro.
     * @param {string} sValue - Valore da confrontare con l'operatore EQ.
     */
    setFilterEQ: function (aFilters, sPropertyModel, sValue) {
      if (sValue) {
        aFilters.push(new Filter(sPropertyModel, FilterOperator.EQ, sValue));
      }
    },

    setFilterGE: function (aFilters, sPropertyModel, sValue) {
      if (sValue) {
        aFilters.push(new Filter(sPropertyModel, FilterOperator.GE, sValue));
      }
    },

    setFilterLE: function (aFilters, sPropertyModel, sValue) {
      if (sValue) {
        aFilters.push(new Filter(sPropertyModel, FilterOperator.LE, sValue));
      }
    },

    setFilterBT: function (aFilters, sPropertyModel, sValueFrom, sValueTo) {
      if (sValueFrom && sValueTo) {
        aFilters.push(new Filter(sPropertyModel, FilterOperator.BT, sValueFrom, sValueTo));
        return;
      } else if (sValueFrom && !sValueTo) {
        this.setFilterGE(aFilters, sPropertyModel, sValueFrom);
        return;
      } else if (!sValueFrom && sValueTo) {
        this.setFilterLE(aFilters, sPropertyModel, sValueTo);
      }
    },
  };
});
