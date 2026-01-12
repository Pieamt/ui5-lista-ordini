sap.ui.define(
  [
    "../BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "listaordini/util/entityUtils",
    "listaordini/util/generalUtils",
  ],
  function (BaseController, JSONModel, MessageBox, entityUtils, generalUtils) {
    "use strict";

    const TOP = 10;
    const SKIP = 0;

    const INIT_MODEL_PRODUCTS = {
      Data: [],
      Skip: SKIP,
      Top: TOP,
      Count: 0,
      Sort: "",
      Filters: [],
    };

    return BaseController.extend("listaordini.controller.articoli.ListaArticoli", {
      onInit: function () {
        this.getRouter().getRoute("ListaArticoli").attachPatternMatched(this._onObjectMatched, this);

        this.oModelProducts = this.setModel(
          new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_PRODUCTS)),
          "Articoli"
        );
      },

      _onObjectMatched: async function () {
        this.setBusy(true);

        try {
          this.oModelProducts.setData(generalUtils.copyWithoutRef(INIT_MODEL_PRODUCTS));

          await this._loadProducts();
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.message);
        } finally {
          this.setBusy(false);
        }
      },

      onNewProduct: function () {
        this.getRouter().navTo("Articolo");
      },

      async _loadProducts() {
        const aFilters = this.oModelProducts.getProperty("/Filters");
        const iTop = this.oModelProducts.getProperty("/Top");
        const iSkip = this.oModelProducts.getProperty("/Skip");
        const sSort = this.oModelProducts.getProperty("/Sort");

        const oResult = await this.getEntitySet("/ZES_articoliSet", aFilters, {}, iTop, iSkip, sSort);

        this.oModelProducts.setProperty("/Data", oResult.data);
        this.oModelProducts.setProperty("/Count", oResult.count);

        return oResult;
      },
    });
  }
);
