sap.ui.define(
  [
    "../BaseController",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "listaordini/util/entityUtils",
    "listaordini/util/generalUtils",
    "listaordini/model/formatter",
  ],
  function (BaseController, MessageBox, JSONModel, entityUtils, generalUtils, formatter) {
    "use strict";

    const TOP = 10;
    const SKIP = 0;

    const INIT_MODEL_ORDERS = {
      Data: [],
      Skip: SKIP,
      Top: TOP,
      Count: 0,
      Sort: "",
      Filters: [],
    };

    const INIT_MODEL_FILTERS = {
      Cliente: "",
      Stato: "",
    };

    return BaseController.extend("listaordini.controller.ordini.ListaOrdini", {
      formatter: formatter,

      onInit: function () {
        this.getRouter().getRoute("ListaOrdini").attachPatternMatched(this._onObjectMatched, this);

        this.oModelOrders = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_ORDERS)), "Ordini");

        this.oModelFilters = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_FILTERS)), "Filters");
      },

      _onObjectMatched: async function () {
        // Modello mock per la ComboBox
        const oStateModel = new JSONModel({
          states: [
            { key: "", text: "Seleziona Stato" },
            { key: "01", text: "Creato" },
            { key: "02", text: "In elaborazione" },
            { key: "03", text: "In transito" },
            { key: "04", text: "Chiuso" },
          ],
        });
        // Setto il modello alla view con nome 'States'
        this.setModel(oStateModel, "States");

        this.setBusy(true);

        try {
          this.oModelOrders.setData(generalUtils.copyWithoutRef(INIT_MODEL_ORDERS));

          await this._loadOrders();
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.message);
        } finally {
          this.setBusy(false);
        }
      },

      onSearch: async function (oEvent) {
        const aFilters = [];
        const oFilterOrders = this.oModelFilters.getData();

        entityUtils.setFilterEQ(aFilters, "Cliente", oFilterOrders.Cliente);
        entityUtils.setFilterEQ(aFilters, "Stato", oFilterOrders.Stato);

        this.setBusy(true);

        try {
          this.oModelOrders.setProperty("/Top", TOP);
          this.oModelOrders.setProperty("/Skip", SKIP);
          this.oModelOrders.setProperty("/Filters", aFilters);

          await this._loadOrders();
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.message);
        } finally {
          this.setBusy(false);
        }
      },

      async _loadOrders() {
        const aFilters = this.oModelOrders.getProperty("/Filters");
        const iTop = this.oModelOrders.getProperty("/Top");
        const iSkip = this.oModelOrders.getProperty("/Skip");
        const sSort = this.oModelOrders.getProperty("/Sort");

        const oResult = await this.getEntitySet("/ZES_lista_ordiniSet", aFilters, {}, iTop, iSkip, sSort);

        this.oModelOrders.setProperty("/Data", oResult.data);
        this.oModelOrders.setProperty("/Count", oResult.count);

        return oResult;
      },
    });
  }
);
