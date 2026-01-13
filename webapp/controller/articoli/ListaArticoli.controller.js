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

    const INIT_MODEL_FILTERS = {
      CodArticolo: "",
      NomeArticolo: "",
    };

    return BaseController.extend("listaordini.controller.articoli.ListaArticoli", {
      onInit: function () {
        this.getRouter().getRoute("ListaArticoli").attachPatternMatched(this._onObjectMatched, this);

        this.oModelProducts = this.setModel(
          new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_PRODUCTS)),
          "Articoli"
        );

        this.oModelFilters = this.setModel(new JSONModel(generalUtils.copyWithoutRef(INIT_MODEL_FILTERS)), "Filters");
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

      onSearch: async function (oEvent) {
        const aFilters = [];
        const oFilterProduct = this.oModelFilters.getData();
        console.log(oFilterProduct);

        entityUtils.setFilterEQ(aFilters, "CodArticolo", oFilterProduct.CodArticolo);
        entityUtils.setFilterEQ(aFilters, "NomeArticolo", oFilterProduct.NomeArticolo);

        this.setBusy(true);

        try {
          this.oModelProducts.setProperty("/Top", TOP);
          this.oModelProducts.setProperty("/Skip", SKIP);
          this.oModelProducts.setProperty("/Filters", aFilters);

          await this._loadProducts();
        } catch (error) {
          console.error(error);
          MessageBox.error(error?.message);
        } finally {
          this.setBusy(false);
        }
      },

      onNew: function () {
        this.getRouter().navTo("NuovoArticolo");
      },

      onEdit: function (oEvent) {
        const sCodArticolo = oEvent.getSource().getParent().getBindingContext("Articoli").getObject().CodArticolo;

        this.getRouter().navTo("ModificaArticolo", {
          CodArticolo: sCodArticolo,
        });
      },

      onDelete: async function (oEvent) {
        const sCodArticolo = oEvent.getSource().getParent().getBindingContext("Articoli").getObject().CodArticolo;
        this.setBusy(true);

        try {
          await this.deleteEntity("/ZES_articoliSet", { CodArticolo: sCodArticolo }).then(async () => {
            this.setBusy(true);

            try {
              this._loadProducts();
              MessageBox.success(this.getText("msgSuccessDeleteProduct"));
            } catch (error) {
              console.error(error);
              MessageBox.error(error.message);
            } finally {
              this.setBusy(false);
            }
          });
        } catch (error) {
          console.error(error);
          MessageBox.error(error.message);
        } finally {
          this.setBusy(false);
        }
      },

      onPaginatorChange: async function (oEvent) {
        this.setBusy(true);

        try {
          await this._loadProducts();
        } catch (error) {
          console.error(error);
          MessageBox.error(error.message);
        } finally {
          this.setBusy(false);
        }
      },

      async _loadProducts() {
        const aFilters = this.oModelProducts.getProperty("/Filters");
        const iTop = this.oModelProducts.getProperty("/Top");
        const iSkip = this.oModelProducts.getProperty("/Skip");
        const sSort = this.oModelProducts.getProperty("/Sort");

        const oResult = await this.getEntitySet("/ZES_articoliSet", aFilters, {}, iTop, iSkip, sSort);
        console.log(oResult);
        this.oModelProducts.setProperty("/Data", oResult.data);
        this.oModelProducts.setProperty("/Count", oResult.count);

        return oResult;
      },
    });
  }
);
