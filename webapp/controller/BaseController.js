sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "listaordini/util/entityUtils",
    "listaordini/model/formatter",
    "sap/ui/core/Fragment",
    "sap/ui/Device",
  ],
  function (Controller, JSONModel, entityUtils, formatter, Fragment, Device) {
    "use strict";

    return Controller.extend("listaordini.controller.BaseController", {
      /**
       * Get the model for the view. Optionally specify the model name.
       *
       * @param {string} [sName] The name of the model. If not provided, the default model is returned.
       * @returns {sap.ui.model.Model} The model instance associated with the view.
       */
      getModel: function (sName) {
        return this.getView().getModel(sName);
      },

      /**
       * Set a model on the view. Optionally specify a model name.
       *
       * @param {sap.ui.model.Model} oModel The model to be set on the view.
       * @param {string} [sName] The name of the model. If not provided, the model is set as the default model.
       * @returns {void}
       */
      setModel: function (oModel, sName) {
        this.getView().setModel(oModel, sName);
        return this.getModel(sName);
      },

      /**
       * Get a global model from the core. Optionally specify the model name.
       *
       * @param {string} [sName] The name of the model. If not provided, the default global model is returned.
       * @returns {sap.ui.model.Model} The global model instance from the core.
       */
      getGlobalModel: function (sName) {
        return sap.ui.getCore().getModel(sName);
      },

      /**
       * Set a global model on the core. Optionally specify a model name.
       *
       * @param {sap.ui.model.Model} oModel The model to be set globally on the core.
       * @param {string} [sName] The name of the model. If not provided, the model is set as the default global model.
       * @returns {sap.ui.model.Model} The global model instance that was set on the core.
       */
      setGlobalModel: function (oModel, sName) {
        sap.ui.getCore().setModel(oModel, sName);
        return sap.ui.getCore().getModel(sName);
      },

      /**
       * Get the router instance for the current component.
       *
       * @returns {sap.ui.core.routing.Router} The router instance associated with this component.
       */
      getRouter: function () {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },

      /**
       * Navigate to a different route using the router.
       *
       * @param {string} sName The name of the route to navigate to.
       * @param {Object} [oParameters] Optional parameters to pass to the route.
       * @param {boolean} [bReplace] If true, replaces the current entry in the history with the new one (optional).
       * @returns {void}
       */
      navTo: function (sName, oParameters, bReplace) {
        this.getRouter().navTo(sName, oParameters, undefined, bReplace);
      },

      /**
       * Imposta lo stato di "busy" (occupato) della vista.
       * Quando il parametro `bBusy` è impostato su `true`, la vista viene considerata occupata
       * e viene visualizzato un indicatore di caricamento (di solito un "busy indicator").
       * Quando `bBusy` è impostato su `false`, l'indicatore di caricamento viene rimosso
       * e la vista torna al suo stato normale.
       *
       * @param {boolean} bBusy - Stato di "busy". `true` per mostrare l'indicatore di caricamento, `false` per nasconderlo.
       */
      setBusy: function (bBusy) {
        this.getView().setBusy(bBusy);
      },

      /**
       * Restituisce una stringa localizzata dal modello di risorse i18n del componente.
       * Utilizza il modello "i18n" definito nel componente per accedere al bundle delle traduzioni,
       * permettendo di ottenere facilmente testi localizzati in base alla chiave fornita.
       *
       * @param {string} sKey - La chiave della stringa localizzata da recuperare (definita nei file i18n.properties).
       * @returns {string} La stringa tradotta corrispondente alla chiave specificata.
       */
      getText: function (sKey) {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(sKey);
      },

      /**
       * Carica un frammento di vista (fragment) in modo asincrono e lo aggiunge come dipendente della vista corrente.
       * Se il frammento è già stato caricato, restituisce l'istanza già esistente per evitare il caricamento ripetuto.
       *
       * @param {string} sFragmentName Il nome del frammento da caricare (deve essere un percorso relativo o completo).
       * @param {string} [sFragmentId] Un identificativo opzionale per il frammento. Se non fornito, verrà usato l'ID della vista.
       * @returns {Promise<sap.ui.core.Fragment>} Una promessa che restituisce l'oggetto frammento caricato.
       */
      loadFragment: function (sFragmentName, sFragmentId) {
        var oView = this.getView();
        var sId = sFragmentId || oView.getId() + "--" + sFragmentName;

        // Controlla se il frammento è già caricato e lo restituisce direttamente
        var oFragment = oView.byId(sId);
        if (oFragment) {
          return Promise.resolve(oFragment);
        }

        // Carica il frammento in modo asincrono
        return sap.ui.core.Fragment.load({
          id: oView.getId(),
          name: sFragmentName,
          controller: this,
        }).then(
          function (oFragment) {
            // Aggiunge il frammento come dipendente della vista
            oView.addDependent(oFragment);

            // Se necessario, aggiungi altre logiche di configurazione o binding qui (ad esempio, il modello "i18n")
            oFragment.setModel(this.getModel("i18n"), "i18n");

            // Restituisce il frammento caricato
            return oFragment;
          }.bind(this)
        );
      },
      /**
       * Esegue una richiesta di tipo `read` per recuperare un insieme di entità (EntitySet) dal modello OData.
       * Supporta filtri, ordinamento, e parametri opzionali come il numero di record da recuperare e da saltare.
       *
       * @param {string} sPath - Il percorso dell'EntitySet da leggere (es. "/EntitySet").
       * @param {array} [aFilters=[]] - Filtri opzionali da applicare alla richiesta.
       * @param {object} [oUrlParameters={}] - Parametri URL opzionali da aggiungere alla richiesta.
       * @param {number} [iTop=0] - Numero di record da recuperare (0 per nessun limite).
       * @param {number} [iSkip=0] - Numero di record da saltare (usato per la paginazione).
       * @param {string} [sSort=""] - Ordine dei record da recuperare.
       * @param {string} [sExpand=""] - Parametri di espansione per recuperare entità correlate.
       *
       * @returns {Promise<object>} - Una promessa che restituisce un oggetto con i dati dell'EntitySet e informazioni aggiuntive come il conteggio totale dei record.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      async getEntitySet(sPath, aFilters = [], oUrlParameters = {}, iTop = 0, iSkip = 0, sSort = "", sExpand = "") {
        try {
          const oDataModel = this.getModel();

          const oUrlParametersStandard = {
            $top: iTop,
            $skip: iSkip,
            $inlinecount: "allpages",
            $orderby: sSort,
            $expand: sExpand,
          };

          const oUrlParametersMerge = { ...oUrlParametersStandard, ...oUrlParameters };

          const data = await new Promise((resolve, reject) => {
            oDataModel.read(sPath, {
              filters: aFilters,
              urlParameters: oUrlParametersMerge,
              success: (data, response) => resolve({ data, response }),
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data?.results || [],
            response: data.response,
            count: parseInt(data.data?.__count, 10) || 0,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(`${errorMessage || error?.message || error}`);
        }
      },

      /**
       * Esegue una richiesta di tipo `read` per recuperare una singola entità dal modello OData.
       * Utilizza una chiave specifica per individuare l'entità richiesta, supportando anche parametri URL e espansione di entità correlate.
       *
       * @param {string} sPath - Il percorso dell'entità da leggere (es. "/EntitySet/ID").
       * @param {object} oKey - Oggetto che rappresenta la chiave dell'entità (es. {ID: 1}).
       * @param {object} [oUrlParameters={}] - Parametri URL opzionali da aggiungere alla richiesta.
       * @param {string} [sExpand=""] - Parametri di espansione per recuperare entità correlate.
       *
       * @returns {Promise<object>} - Una promessa che restituisce i dati dell'entità e la risposta completa.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      async getEntity(sPath, oKey, oUrlParameters = {}, sExpand = "") {
        try {
          const oDataModel = this.getModel();
          const sKey = oDataModel.createKey(sPath, oKey);
          oUrlParameters["$expand"] = sExpand;

          const data = await new Promise((resolve, reject) => {
            oDataModel.read(sKey, {
              urlParameters: oUrlParameters,
              success: (data, response) => resolve({ data, response }),
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data,
            response: data.response,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(` ${errorMessage || error?.message || error}`);
        }
      },

      /**
       * Esegue una richiesta di tipo `create` su un endpoint OData specificato, passando un payload e opzioni aggiuntive come i parametri URL.
       * Prima di inviare la richiesta, il payload viene convertito ricorsivamente in formato UTC (fuso orario Roma) utilizzando un formatter personalizzato.
       * Restituisce una promessa che si risolve con i dati ricevuti dalla risposta OData o rifiuta con l'errore in caso di fallimento.
       *
       * @param {string} sPath - Il percorso dell'entità OData su cui eseguire la creazione (es. "/EntitySet").
       * @param {object} oPayload - Il corpo della richiesta contenente i dati da inviare al backend.
       * @param {object} [oUrlParameters={}] - Parametri opzionali da aggiungere all'URL della richiesta OData.
       *
       * @returns {Promise<{data: object, response: object}>} - Una promessa che restituisce un oggetto contenente i dati della risposta OData
       *    e la risposta stessa, se la richiesta ha avuto successo. In caso di errore, la promessa verrà rifiutata con un errore.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      createEntity: async function (sPath, oPayload, oUrlParameters = {}) {
        try {
          const oDataModel = this.getModel();

          oPayload = formatter.convertRecorsiveInUTCRome(oPayload);

          const data = await new Promise(async function (resolve, reject) {
            oDataModel.create(sPath, oPayload, {
              urlParameters: oUrlParameters,
              success: (data, response) => resolve({ data, response }),
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data,
            response: data.response,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(` ${errorMessage || error?.message || error}`);
        }
      },

      /**
       * Esegue una richiesta di tipo `delete` su un endpoint OData specificato, utilizzando la chiave dell'entità per identificarla.
       * Accetta opzionalmente dei parametri URL per personalizzare la richiesta.
       * Restituisce una promessa che si risolve con i dati ricevuti dalla risposta OData o rifiuta con l'errore in caso di fallimento.
       *
       * @param {string} sPath - Il percorso dell'entità OData su cui eseguire l'eliminazione (es. "/EntitySet").
       * @param {object} oKey - Oggetto che rappresenta la chiave dell'entità da eliminare (es. { ID: "123" }).
       * @param {object} [oUrlParameters={}] - Parametri opzionali da aggiungere all'URL della richiesta OData.
       *
       * @returns {Promise<{data: object, response: object}>} - Una promessa che restituisce un oggetto contenente i dati della risposta OData
       *    e la risposta stessa, se la richiesta ha avuto successo. In caso di errore, la promessa verrà rifiutata con un errore.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      deleteEntity: async function (sPath, oKey, oUrlParameters = {}) {
        try {
          const oDataModel = this.getModel();
          const sKey = oDataModel.createKey(sPath, oKey);

          const data = await new Promise((resolve, reject) => {
            oDataModel.remove(sKey, {
              urlParameters: oUrlParameters,
              method: "DELETE",
              success: (data, response) => resolve({ data, response }),
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data,
            response: data.response,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(` ${errorMessage || error?.message || error}`);
        }
      },

      /**
       * Esegue una richiesta di tipo `update` su un endpoint OData specificato, utilizzando la chiave dell'entità e i dati aggiornati.
       * Permette di aggiornare i dati nel backend e supporta anche parametri URL opzionali.
       * Restituisce una promessa che si risolve con i dati ricevuti dalla risposta OData o rifiuta con l'errore in caso di fallimento.
       *
       * @param {string} sPath - Il percorso dell'entità OData su cui eseguire l'aggiornamento (es. "/EntitySet").
       * @param {object} oKey - Oggetto che rappresenta la chiave dell'entità da aggiornare (es. { ID: "123" }).
       * @param {object} oData - I nuovi dati da inviare al backend per aggiornare l'entità.
       * @param {object} [oUrlParameters={}] - Parametri opzionali da aggiungere all'URL della richiesta OData.
       *
       * @returns {Promise<{data: object, response: object}>} - Una promessa che restituisce un oggetto contenente i dati della risposta OData
       *    e la risposta stessa, se la richiesta ha avuto successo. In caso di errore, la promessa verrà rifiutata con un errore.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      updateEntity: async function (sPath, oKey, oData, oUrlParameters = {}) {
        try {
          const oDataModel = this.getModel();
          const sKey = oDataModel.createKey(sPath, oKey);

          const data = await new Promise((resolve, reject) => {
            oDataModel.update(sKey, oData, {
              urlParameters: oUrlParameters,
              success: async (data, response) => {
                const read = await this.getEntity(sPath, oKey);

                resolve({ data: read.data, response: response });
              },
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data,
            response: data.response,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(` ${errorMessage || error?.message || error}`);
        }
      },

      /**
       * Esegue una chiamata a una funzione OData (Function Import) specificata tramite il nome della funzione, il metodo HTTP e parametri opzionali.
       * La funzione OData viene invocata utilizzando il modello OData, e la risposta viene restituita tramite una promessa.
       *
       * @param {string} sFunctionName - Il nome della funzione OData da chiamare (es. "/MyFunctionImport").
       * @param {string} sMethod - Il metodo HTTP da utilizzare per la richiesta (es. "GET", "POST").
       * @param {object} [oUrlParameters={}] - Parametri URL opzionali da aggiungere alla richiesta OData.
       *
       * @returns {Promise<{data: object, response: object}>} - Una promessa che restituisce i dati della risposta OData e la risposta stessa in caso di successo.
       *
       * @throws {Error} - Lancia un errore se la richiesta OData fallisce, con un messaggio di errore dettagliato.
       */
      functionImport: async function (sFunctionName, sMethod, oUrlParameters) {
        try {
          const oDataModel = this.getModel();

          const data = await new Promise(async function (resolve, reject) {
            await oDataModel.callFunction(sFunctionName, {
              method: sMethod,
              urlParameters: oUrlParameters,
              success: (data, response) => resolve({ data, response }),
              error: (error) => reject(error),
            });
          });

          return {
            data: data.data,
            response: data.response,
          };
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);

          throw new Error(`${errorMessage || error?.message || error}`);
        }
      },

      uploadAttachment: async function (sPath, oPayload, oUrlParameters = {}) {
        try {
          const oDataModel = this.getModel();
          const sServiceUrl = oDataModel.sServiceUrl;

          oUrlParameters.FileName = oPayload.FileName;

          const sFullUrl = `${sServiceUrl}${sPath}?${Object.entries(oUrlParameters)
            .map(([key, val]) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`)
            .join("&")}`;
          let csrfToken = "";

          const csrfTokenResponse = await new Promise((resolve, reject) => {
            jQuery.ajax({
              url: sFullUrl,
              method: "GET",
              headers: {
                "X-CSRF-Token": "Fetch",
              },
              success: function (data, textStatus, jqXHR) {
                csrfToken = jqXHR.getResponseHeader("X-CSRF-Token");
                resolve(csrfToken);
              },
              error: function (jqXHR, textStatus, errorThrown) {
                reject("Failed to get CSRF token: " + errorThrown);
              },
            });
          });

          const response = await new Promise((resolve, reject) => {
            jQuery.ajax({
              url: sFullUrl,
              method: "POST",
              data: oPayload.FileContent,
              processData: false,
              contentType: oPayload.Type,
              headers: {
                "X-CSRF-Token": csrfToken,
                Accept: "application/json",
              },
              success: function (data, textStatus, jqXHR) {
                resolve({ data, response: jqXHR });
              },
              error: function (jqXHR, textStatus, errorThrown) {
                reject(jqXHR);
              },
            });
          });

          return response.data;
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);
          throw new Error(` ${errorMessage || error?.message || error}`);
        }
      },

      downloadAttachment: async function (sPath, sIdAttachment, sNameFile) {
        const oDataModel = this.getModel();
        let oBlob, sHref, oDownloadLink, sServiceUrl;

        sServiceUrl = oDataModel.sServiceUrl;
        const sUrl = `${sServiceUrl}${sPath}('${sIdAttachment}')/$value`;

        this.setBusy(true);
        try {
          const oResponse = await fetch(sUrl);

          // Converto la risposta in un Blob per poterla scaricare
          oBlob = await oResponse.blob();

          sHref = URL.createObjectURL(oBlob);

          // Crea un link di download
          oDownloadLink = document.createElement("a");
          oDownloadLink.href = sHref;
          oDownloadLink.download = sNameFile; // Imposta il nome del file da scaricare

          // Aggiungi il link al DOM, esegui il click per scaricare e rimuovi il link
          document.body.appendChild(oDownloadLink);
          oDownloadLink.click();
          document.body.removeChild(oDownloadLink);

          // Rilascia l'oggetto URL creato
          window.URL.revokeObjectURL(sHref);
        } catch (error) {
          const errorMessage = entityUtils.getErrorMessage(error);
          throw new Error(` ${errorMessage || error?.message || error}`);
        } finally {
          this.setBusy(false);
        }
      },

      getViewSettingsDialog: function (sDialogFragmentName) {
        var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

        if (!pDialog) {
          pDialog = Fragment.load({
            id: this.getView().getId(),
            name: sDialogFragmentName,
            controller: this,
          }).then(function (oDialog) {
            if (Device.system.desktop) {
              oDialog.addStyleClass("sapUiSizeCompact");
            }
            return oDialog;
          });
          this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
        }
        return pDialog;
      },
    });
  }
);
